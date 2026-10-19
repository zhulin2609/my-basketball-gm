package com.basketballgm.auth;

import com.basketballgm.config.ApiException;
import com.basketballgm.user.CurrentUser;
import com.basketballgm.user.ReservedUsernames;
import com.basketballgm.user.UserMapper;
import com.basketballgm.user.UserRow;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * WeChat passwordless registration and identity binding. The confirmation credential is a
 * single-use server-side random token; only its digest is stored. A successful bind or
 * register consumes the credential inside the same transaction that writes the identity.
 * A concurrent or repeated attempt of the same finished binding is recognized and answered
 * with the same session instead of a conflict.
 */
@Service
public class WechatAuthService {
  static final String PROVIDER = "wechat";

  private final WechatLoginClient wechatClient;
  private final UserIdentityMapper identityMapper;
  private final WechatCredentialMapper credentialMapper;
  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;
  private final ReservedUsernames reservedUsernames;
  private final CurrentUser currentUser;
  private final AuthTokenIssuer tokenIssuer;
  private final TransactionTemplate transactionTemplate;
  private final AuthRateLimiter rateLimiter;
  private final String appid;
  private final Duration credentialTtl;
  private final int credentialPerHour;
  private final int bindAttempts;
  private final int exchangePerMinute;

  public WechatAuthService(
      WechatLoginClient wechatClient,
      UserIdentityMapper identityMapper,
      WechatCredentialMapper credentialMapper,
      UserMapper userMapper,
      PasswordEncoder passwordEncoder,
      ReservedUsernames reservedUsernames,
      CurrentUser currentUser,
      AuthTokenIssuer tokenIssuer,
      TransactionTemplate transactionTemplate,
      AuthRateLimiter rateLimiter,
      @Value("${app.wechat.appid:}") String appid,
      @Value("${app.wechat.credential-ttl:PT10M}") Duration credentialTtl,
      @Value("${app.wechat.credential-per-hour:10}") int credentialPerHour,
      @Value("${app.wechat.bind-attempts:5}") int bindAttempts,
      @Value("${app.wechat.exchange-per-minute:60}") int exchangePerMinute
  ) {
    this.wechatClient = wechatClient;
    this.identityMapper = identityMapper;
    this.credentialMapper = credentialMapper;
    this.userMapper = userMapper;
    this.passwordEncoder = passwordEncoder;
    this.reservedUsernames = reservedUsernames;
    this.currentUser = currentUser;
    this.tokenIssuer = tokenIssuer;
    this.transactionTemplate = transactionTemplate;
    this.rateLimiter = rateLimiter;
    this.appid = appid;
    this.credentialTtl = credentialTtl;
    this.credentialPerHour = credentialPerHour;
    this.bindAttempts = bindAttempts;
    this.exchangePerMinute = exchangePerMinute;
  }

  public WechatExchangeResponse exchange(WechatExchangeRequest request) {
    // 在调用微信之前限频：非法 code 与已绑定身份的交换同样消耗微信配额。
    if (!rateLimiter.allow("wechat-exchange", exchangePerMinute)) {
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "操作太频繁，请稍后再试。");
    }
    WechatLoginClient.WechatIdentity identity = wechatClient.exchangeCode(request.code());
    UserIdentityRow bound = identityMapper.find(PROVIDER, appid, identity.openid());
    if (bound != null) {
      UserRow user = userMapper.findById(bound.userId());
      if (user == null) throw new IllegalStateException("微信身份指向的账号不存在。");
      return WechatExchangeResponse.authenticated(tokenIssuer.issue(user));
    }

    Instant hourAgo = Instant.now().minus(Duration.ofHours(1));
    if (credentialMapper.countRecentForIdentity(PROVIDER, appid, identity.openid(), hourAgo) >= credentialPerHour) {
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "操作太频繁，请稍后再试。");
    }
    String credentialToken = TokenSupport.newCredentialToken();
    Instant expiresAt = Instant.now().plus(credentialTtl);
    credentialMapper.insert(
        TokenSupport.digest(credentialToken), PROVIDER, appid, identity.openid(), identity.unionid(), expiresAt);
    return WechatExchangeResponse.confirmationRequired(credentialToken, expiresAt);
  }

  public AuthResponse bind(WechatBindRequest request) {
    WechatCredentialRow credential = requireCredential(request.credentialToken());
    AuthResponse replay = replayIfConsumed(credential);
    if (replay != null) return replay;

    UserRow user = userMapper.findByUsername(request.username());
    if (user == null
        || user.passwordHash() == null
        || !passwordEncoder.matches(request.password(), user.passwordHash())) {
      Integer attempts = credentialMapper.markFailed(credential.id(), bindAttempts);
      if (attempts == null) throw invalidCredential();
      if (attempts >= bindAttempts) throw exhaustedCredential();
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_ACCOUNT_CREDENTIALS", "用户名或密码错误，请修改后重试。");
    }

    try {
      transactionTemplate.executeWithoutResult(transaction -> linkIdentity(credential, user));
    } catch (DataIntegrityViolationException | CredentialConsumedException exception) {
      return resolveBindConflict(credential, user);
    }
    return tokenIssuer.issue(user);
  }

  public WechatRegisterResponse register(WechatRegisterRequest request) {
    WechatCredentialRow credential = requireCredential(request.credentialToken());
    AuthResponse replay = replayIfConsumed(credential);
    if (replay != null) return new WechatRegisterResponse(replay, false);

    if (reservedUsernames.isReserved(request.username())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "该用户名不可用。");
    }
    if (userMapper.findByUsername(request.username()) != null) {
      // 并发或重试：该身份可能已完成注册，按已完成结果返回会话而不是用户名冲突。
      UserIdentityRow identity = identityMapper.find(credential.provider(), credential.appid(), credential.openid());
      if (identity != null) {
        UserRow owner = userMapper.findById(identity.userId());
        if (owner != null) {
          consumeResolvedCredential(credential, owner);
          return new WechatRegisterResponse(tokenIssuer.issue(owner), false);
        }
      }
      throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被占用。");
    }

    try {
      UserRow user = transactionTemplate.execute(transaction -> {
        UserRow created = userMapper.insertRegistered(request.username(), null, request.username());
        linkIdentity(credential, created);
        return created;
      });
      if (user == null) throw new IllegalStateException("账号创建失败。");
      return new WechatRegisterResponse(tokenIssuer.issue(user), true);
    } catch (DataIntegrityViolationException | CredentialConsumedException exception) {
      return resolveRegisterConflict(credential);
    }
  }

  public List<IdentityResponse> identities(Jwt jwt) {
    return identityMapper.listByUser(currentUser.id(jwt)).stream()
        .map(identity -> new IdentityResponse(identity.provider(), identity.appid(), identity.createdAt()))
        .toList();
  }

  private WechatCredentialRow requireCredential(String credentialToken) {
    WechatCredentialRow credential = credentialMapper.findByDigest(TokenSupport.digest(credentialToken));
    if (credential == null) throw invalidCredential();
    if (!credential.expiresAt().isAfter(Instant.now())) throw invalidCredential();
    return credential;
  }

  /** A retry of a succeeded bind or register returns the same session instead of failing. */
  private AuthResponse replayIfConsumed(WechatCredentialRow credential) {
    if (credential.consumedAt() == null) return null;
    if (credential.consumedByUserId() == null && credential.failedAttempts() >= bindAttempts) {
      throw exhaustedCredential();
    }
    if (credential.consumedByUserId() != null) {
      UserIdentityRow identity = identityMapper.find(credential.provider(), credential.appid(), credential.openid());
      if (identity != null && identity.userId().equals(credential.consumedByUserId())) {
        UserRow user = userMapper.findById(identity.userId());
        if (user != null) return tokenIssuer.issue(user);
      }
    }
    throw invalidCredential();
  }

  private void linkIdentity(WechatCredentialRow credential, UserRow user) {
    // 先取凭证行锁，再按取得锁后的实际时刻核验有效期与消费状态；
    // 唯一约束冲突向外抛出，由调用方在事务回滚后区分相同绑定与真实冲突。
    WechatCredentialRow locked = credentialMapper.findByIdForUpdate(credential.id());
    if (locked == null || !locked.expiresAt().isAfter(Instant.now())) {
      throw invalidCredential();
    }
    if (locked.consumedAt() != null) {
      // 锁等待期间同一绑定已由并发请求完成：由调用方按幂等解析。
      throw new CredentialConsumedException();
    }
    identityMapper.insert(user.id(), credential.provider(), credential.appid(), credential.openid(), credential.unionid());
    if (credentialMapper.consume(credential.id(), user.id()) == 0) {
      throw new CredentialConsumedException();
    }
  }

  /** 事务失败后区分相同绑定、真实身份冲突与并发消费凭证的原因。 */
  private AuthResponse resolveBindConflict(WechatCredentialRow credential, UserRow user) {
    UserIdentityRow identity = identityMapper.find(credential.provider(), credential.appid(), credential.openid());
    if (identity != null && identity.userId().equals(user.id())) {
      consumeResolvedCredential(credential, user);
      return tokenIssuer.issue(user);
    }
    boolean conflictingIdentity = identity != null || identityMapper.listByUser(user.id()).stream()
        .anyMatch(bound -> bound.provider().equals(credential.provider()) && bound.appid().equals(credential.appid()));
    if (conflictingIdentity) {
      throw new ApiException(
          HttpStatus.CONFLICT, "IDENTITY_CONFLICT", "该微信身份已绑定其他账号，或当前账号已绑定其他微信。");
    }
    WechatCredentialRow latest = credentialMapper.findById(credential.id());
    if (latest != null && latest.consumedAt() != null && latest.consumedByUserId() == null
        && latest.failedAttempts() >= bindAttempts) {
      throw exhaustedCredential();
    }
    throw invalidCredential();
  }

  /**
   * 注册冲突同理：身份已经绑定成功（并发或重试）时消费当前凭证并返回对应账号的会话；
   * 身份不存在时是用户名冲突。
   */
  private WechatRegisterResponse resolveRegisterConflict(WechatCredentialRow credential) {
    UserIdentityRow identity = identityMapper.find(credential.provider(), credential.appid(), credential.openid());
    if (identity != null) {
      UserRow owner = userMapper.findById(identity.userId());
      if (owner != null) {
        consumeResolvedCredential(credential, owner);
        return new WechatRegisterResponse(tokenIssuer.issue(owner), false);
      }
    }
    throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被占用。");
  }

  /** 幂等路径也消费当前凭证；已被同一账号消费时保持幂等，其余情况视为无效。 */
  private void consumeResolvedCredential(WechatCredentialRow credential, UserRow user) {
    transactionTemplate.executeWithoutResult(transaction -> {
      WechatCredentialRow locked = credentialMapper.findByIdForUpdate(credential.id());
      if (locked == null || !locked.expiresAt().isAfter(Instant.now())) throw invalidCredential();
      if (locked.consumedAt() != null) {
        if (!user.id().equals(locked.consumedByUserId())) throw invalidCredential();
        return;
      }
      credentialMapper.consume(credential.id(), user.id());
    });
  }

  private ApiException invalidCredential() {
    return new ApiException(HttpStatus.BAD_REQUEST, "CREDENTIAL_INVALID", "身份确认凭证无效或已过期，请重新登录。");
  }

  private ApiException exhaustedCredential() {
    return new ApiException(HttpStatus.BAD_REQUEST, "CREDENTIAL_ATTEMPTS_EXCEEDED", "密码尝试次数已用尽，请重新验证微信身份。");
  }
}
