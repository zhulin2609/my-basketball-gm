package com.basketballgm.forum;

import com.basketballgm.config.ApiException;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Abuse limits for community writes. Counts come from the tables themselves inside the caller's
 * transaction, so a rejected write never consumes quota and limits survive an application restart.
 */
@Component
public class ForumWriteGuard {
  private static final Pattern LINK_PATTERN = Pattern.compile("(?i)(https?://|www\\.)");

  private final ForumMapper forumMapper;
  private final int commentPerSecond;
  private final int commentPerDay;
  private final int publishPerHour;
  private final int newAccountLinkHours;

  public ForumWriteGuard(
      ForumMapper forumMapper,
      @Value("${app.forum.rate-limit.comment-per-second}") int commentPerSecond,
      @Value("${app.forum.rate-limit.comment-per-day}") int commentPerDay,
      @Value("${app.forum.rate-limit.publish-per-hour}") int publishPerHour,
      @Value("${app.forum.new-account-link-hours}") int newAccountLinkHours
  ) {
    this.forumMapper = forumMapper;
    this.commentPerSecond = commentPerSecond;
    this.commentPerDay = commentPerDay;
    this.publishPerHour = publishPerHour;
    this.newAccountLinkHours = newAccountLinkHours;
  }

  public void checkComment(UUID authorId, String content) {
    if (forumMapper.countCommentsInLastSecond(authorId) >= commentPerSecond) throw rateLimited();
    if (forumMapper.countCommentsInLastDay(authorId) >= commentPerDay) throw rateLimited();
    checkLink(authorId, content);
  }

  /** Only brand-new posts consume publish quota; updating an existing post cannot bump its order. */
  public void checkPublish(UUID ownerId, String text) {
    if (forumMapper.countPostsInLastHour(ownerId) >= publishPerHour) throw rateLimited();
    checkLink(ownerId, text);
  }

  private void checkLink(UUID userId, String text) {
    if (text == null || !LINK_PATTERN.matcher(text).find()) return;
    OffsetDateTime createdAt = forumMapper.findUserCreatedAt(userId);
    if (createdAt != null && createdAt.isAfter(OffsetDateTime.now().minusHours(newAccountLinkHours))) {
      throw new ApiException(
          HttpStatus.FORBIDDEN,
          "LINK_RESTRICTED",
          "新账号注册满 " + newAccountLinkHours + " 小时后才能发布包含链接的内容。");
    }
  }

  private ApiException rateLimited() {
    return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "操作太频繁，请稍后再试。");
  }
}
