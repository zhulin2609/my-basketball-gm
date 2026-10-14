package com.basketballgm.auth;

import com.basketballgm.config.ApiException;
import com.basketballgm.user.CurrentUser;
import com.basketballgm.user.UserMapper;
import com.basketballgm.user.UserRow;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * Web scan-code login tickets. A ticket is short-lived and single-use; the raw ticket travels
 * in the mini program code scene while only its digest is stored. Approving requires the
 * authenticated mini program session; claiming additionally requires the browser binding value
 * created by the initiating browser. Expiry and state transitions are enforced atomically in
 * SQL at statement time so a request cannot cross the expiry boundary mid-flight.
 */
@Service
public class WebLoginTicketService {
  private final WebLoginTicketMapper ticketMapper;
  private final WechatLoginClient wechatClient;
  private final UserMapper userMapper;
  private final CurrentUser currentUser;
  private final AuthTokenIssuer tokenIssuer;
  private final Duration ticketTtl;
  private final int ticketPerHour;
  private final int ticketGlobalPerHour;
  private final int qrCodePerMinute;
  private final AuthRateLimiter rateLimiter;
  private final TransactionTemplate transactionTemplate;
  private final Map<String, CachedCode> qrCodeCache = new ConcurrentHashMap<>();

  private record CachedCode(byte[] image, Instant expiresAt, ApiException failure) {}

  public WebLoginTicketService(
      WebLoginTicketMapper ticketMapper,
      WechatLoginClient wechatClient,
      UserMapper userMapper,
      CurrentUser currentUser,
      AuthTokenIssuer tokenIssuer,
      AuthRateLimiter rateLimiter,
      TransactionTemplate transactionTemplate,
      @Value("${app.wechat.ticket-ttl:PT5M}") Duration ticketTtl,
      @Value("${app.wechat.ticket-per-hour:30}") int ticketPerHour,
      @Value("${app.wechat.ticket-global-per-hour:500}") int ticketGlobalPerHour,
      @Value("${app.wechat.qrcode-per-minute:30}") int qrCodePerMinute
  ) {
    this.ticketMapper = ticketMapper;
    this.wechatClient = wechatClient;
    this.userMapper = userMapper;
    this.currentUser = currentUser;
    this.tokenIssuer = tokenIssuer;
    this.rateLimiter = rateLimiter;
    this.transactionTemplate = transactionTemplate;
    this.ticketTtl = ticketTtl;
    this.ticketPerHour = ticketPerHour;
    this.ticketGlobalPerHour = ticketGlobalPerHour;
    this.qrCodePerMinute = qrCodePerMinute;
  }

  public WebLoginTicketCreateResponse create(WebLoginTicketCreateRequest request) {
    // 生成小程序码依赖微信能力；未配置时创建票据必然无法完成流程，直接明确失败。
    if (!wechatClient.configured()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "WECHAT_NOT_CONFIGURED", "微信登录能力未配置。");
    }
    // 计数与插入在同一事务内由咨询锁串行化，避免并发创建越过配额。
    return transactionTemplate.execute(transaction -> {
      ticketMapper.acquireCreateLock();
      String bindingDigest = TokenSupport.digest(request.browserBinding());
      Instant hourAgo = Instant.now().minus(Duration.ofHours(1));
      if (ticketMapper.countRecentForBinding(bindingDigest, hourAgo) >= ticketPerHour
          || ticketMapper.countRecentGlobal(hourAgo) >= ticketGlobalPerHour) {
        throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "操作太频繁，请稍后再试。");
      }
      String ticket = TokenSupport.newTicket();
      Instant expiresAt = Instant.now().plus(ticketTtl);
      ticketMapper.insert(TokenSupport.digest(ticket), bindingDigest, expiresAt);
      return new WebLoginTicketCreateResponse(ticket, expiresAt);
    });
  }

  public WebLoginTicketStatusResponse status(String ticket, String browserBinding) {
    WebLoginTicketRow row = requireBoundRow(ticket, browserBinding);
    return new WebLoginTicketStatusResponse(effectiveStatus(row), row.expiresAt());
  }

  @Transactional
  public void confirm(String ticket, Jwt jwt) {
    WebLoginTicketRow row = requireTicketForUpdate(ticket);
    requireLive(row);
    if (!"pending".equals(row.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "TICKET_RESOLVED", "该登录请求已被处理。");
    }
    if (ticketMapper.approve(row.id(), currentUser.id(jwt)) == 0) {
      throw new ApiException(HttpStatus.CONFLICT, "TICKET_RESOLVED", "该登录请求已被处理。");
    }
  }

  @Transactional
  public void reject(String ticket, Jwt jwt) {
    WebLoginTicketRow row = requireTicketForUpdate(ticket);
    requireLive(row);
    if (!"pending".equals(row.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "TICKET_RESOLVED", "该登录请求已被处理。");
    }
    if (ticketMapper.reject(row.id()) == 0) {
      throw new ApiException(HttpStatus.CONFLICT, "TICKET_RESOLVED", "该登录请求已被处理。");
    }
  }

  @Transactional
  public AuthResponse claim(String ticket, WebLoginTicketClaimRequest request) {
    WebLoginTicketRow row = requireBoundRowForUpdate(ticket, request.browserBinding());
    if ("rejected".equals(row.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "TICKET_REJECTED", "用户已拒绝该登录请求。");
    }
    if ("consumed".equals(row.status())) {
      throw new ApiException(HttpStatus.GONE, "TICKET_CONSUMED", "该登录结果已被领取。");
    }
    if (!row.expiresAt().isAfter(Instant.now())) throw expired();
    if (!"approved".equals(row.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "TICKET_NOT_APPROVED", "用户尚未确认登录。");
    }
    if (ticketMapper.consume(row.id()) == 0) {
      throw new ApiException(HttpStatus.GONE, "TICKET_CONSUMED", "该登录结果已被领取。");
    }
    UserRow user = row.approvedUserId() == null ? null : userMapper.findById(row.approvedUserId());
    if (user == null) throw new IllegalStateException("票据批准的账号不存在。");
    return tokenIssuer.issue(user);
  }

  public byte[] qrCode(String ticket) {
    WebLoginTicketRow row = requireTicket(ticket);
    if (!row.expiresAt().isAfter(Instant.now())) throw expired();
    // computeIfAbsent 使同一票据的并发请求共享一次生成；失败结果短期缓存，
    // 冷却期内不再调用上游，冷却结束后移除并重试。
    CachedCode cached = qrCodeCache.computeIfAbsent(row.id(), id -> generateCode(row, ticket));
    if (!cached.expiresAt().isAfter(Instant.now())) {
      qrCodeCache.remove(row.id(), cached);
      cached = qrCodeCache.computeIfAbsent(row.id(), id -> generateCode(row, ticket));
    }
    if (cached.failure() != null) throw cached.failure();
    return cached.image();
  }

  private CachedCode generateCode(WebLoginTicketRow row, String ticket) {
    Instant cooldown = Instant.now().plus(Duration.ofSeconds(30));
    if (!rateLimiter.allow("wechat-qrcode", qrCodePerMinute)) {
      return new CachedCode(null, cooldown,
          new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "操作太频繁，请稍后再试。"));
    }
    try {
      return new CachedCode(wechatClient.createMiniProgramCode(ticket, "pages/auth/index"), row.expiresAt(), null);
    } catch (ApiException exception) {
      return new CachedCode(null, cooldown, exception);
    }
  }

  private WebLoginTicketRow requireTicket(String ticket) {
    WebLoginTicketRow row = ticketMapper.findByDigest(TokenSupport.digest(ticket));
    if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "登录票据不存在。");
    return row;
  }

  private WebLoginTicketRow requireTicketForUpdate(String ticket) {
    WebLoginTicketRow row = ticketMapper.findByDigestForUpdate(TokenSupport.digest(ticket));
    if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "登录票据不存在。");
    return row;
  }

  private WebLoginTicketRow requireBoundRowForUpdate(String ticket, String browserBinding) {
    WebLoginTicketRow row = requireTicketForUpdate(ticket);
    byte[] expected = row.browserBindingDigest().getBytes(StandardCharsets.UTF_8);
    byte[] actual = TokenSupport.digest(browserBinding).getBytes(StandardCharsets.UTF_8);
    if (!MessageDigest.isEqual(expected, actual)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "登录票据不存在。");
    }
    return row;
  }

  private WebLoginTicketRow requireBoundRow(String ticket, String browserBinding) {
    WebLoginTicketRow row = requireTicket(ticket);
    byte[] expected = row.browserBindingDigest().getBytes(StandardCharsets.UTF_8);
    byte[] actual = TokenSupport.digest(browserBinding).getBytes(StandardCharsets.UTF_8);
    if (!MessageDigest.isEqual(expected, actual)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "登录票据不存在。");
    }
    return row;
  }

  private ApiException expired() {
    return new ApiException(HttpStatus.GONE, "TICKET_EXPIRED", "登录票据已过期，请刷新网页重新扫码。");
  }

  private void requireLive(WebLoginTicketRow row) {
    if (!row.expiresAt().isAfter(Instant.now())) throw expired();
  }

  private String effectiveStatus(WebLoginTicketRow row) {
    if ("consumed".equals(row.status())) return row.status();
    if (!row.expiresAt().isAfter(Instant.now())) return "expired";
    return row.status();
  }
}
