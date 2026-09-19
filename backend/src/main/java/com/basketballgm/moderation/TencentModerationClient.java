package com.basketballgm.moderation;

import com.basketballgm.config.ApiException;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.tms.v20201229.TmsClient;
import com.tencentcloudapi.tms.v20201229.models.TextModerationRequest;
import com.tencentcloudapi.tms.v20201229.models.TextModerationResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Tencent Cloud TMS text moderation. The client stays disabled until both credentials are
 * configured, which keeps local development and tests independent of the cloud service. When the
 * call fails or times out the write is rejected: unmoderated content never reaches the database.
 */
@Component
public class TencentModerationClient {
  private static final Logger LOGGER = LoggerFactory.getLogger(TencentModerationClient.class);
  private static final int TIMEOUT_SECONDS = 3;

  private final TmsClient client;

  public TencentModerationClient(
      @Value("${app.moderation.tencent.secret-id:}") String secretId,
      @Value("${app.moderation.tencent.secret-key:}") String secretKey,
      @Value("${app.moderation.tencent.region:ap-guangzhou}") String region
  ) {
    if (secretId.isBlank() || secretKey.isBlank()) {
      this.client = null;
      return;
    }
    HttpProfile httpProfile = new HttpProfile();
    httpProfile.setConnTimeout(TIMEOUT_SECONDS);
    httpProfile.setReadTimeout(TIMEOUT_SECONDS);
    httpProfile.setWriteTimeout(TIMEOUT_SECONDS);
    ClientProfile clientProfile = new ClientProfile();
    clientProfile.setHttpProfile(httpProfile);
    this.client = new TmsClient(new Credential(secretId, secretKey), region, clientProfile);
  }

  public void check(String text) {
    if (client == null) return;
    TextModerationRequest request = new TextModerationRequest();
    request.setContent(Base64.getEncoder().encodeToString(text.getBytes(StandardCharsets.UTF_8)));
    TextModerationResponse response;
    try {
      response = client.TextModeration(request);
    } catch (TencentCloudSDKException exception) {
      LOGGER.warn("Tencent moderation call failed: {}", exception.getMessage());
      throw unavailable();
    }
    String suggestion = response.getSuggestion();
    if ("Pass".equalsIgnoreCase(suggestion)) return;
    if ("Block".equalsIgnoreCase(suggestion) || "Review".equalsIgnoreCase(suggestion)) {
      throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY, "CONTENT_REJECTED", "内容包含违规信息，请修改后重新发布。");
    }
    LOGGER.warn("Tencent moderation returned an unknown suggestion: {}", suggestion);
    throw unavailable();
  }

  private ApiException unavailable() {
    return new ApiException(
        HttpStatus.SERVICE_UNAVAILABLE, "MODERATION_UNAVAILABLE", "内容审核服务暂时不可用，请稍后重试。");
  }
}
