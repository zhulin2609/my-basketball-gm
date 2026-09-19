package com.links.basketballgm.moderation;

import com.links.basketballgm.config.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Synchronous write-path moderation: local word filter first, cloud moderation second. Controllers
 * run this before opening the write transaction so the cloud HTTP call never holds a database
 * connection.
 */
@Service
public class ModerationService {
  private final SensitiveWordFilter wordFilter;
  private final TencentModerationClient tencentClient;

  public ModerationService(SensitiveWordFilter wordFilter, TencentModerationClient tencentClient) {
    this.wordFilter = wordFilter;
    this.tencentClient = tencentClient;
  }

  public void check(String text) {
    if (text == null || text.isBlank()) return;
    if (wordFilter.contains(text)) {
      throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY, "CONTENT_REJECTED", "内容包含违规信息，请修改后重新发布。");
    }
    tencentClient.check(text);
  }
}
