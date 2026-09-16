package com.links.basketballgm.llm;

import com.links.basketballgm.lineup.LineupMemberRow;
import com.links.basketballgm.player.PlayerResponse;
import com.links.basketballgm.simulation.SimulationResult;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Keeps encrypted credentials and plaintext provider keys inside the LLM module. */
@Service
public class AiSimulationService {
  private final LlmCredentialService credentialService;
  private final LlmSimulationClient client;

  public AiSimulationService(
      LlmCredentialService credentialService,
      LlmSimulationClient client
  ) {
    this.credentialService = credentialService;
    this.client = client;
  }

  public AiSimulationResult simulateRequired(
      UUID ownerId,
      List<LineupMemberRow> homeMembers,
      List<LineupMemberRow> awayMembers,
      Map<String, PlayerResponse> players
  ) {
    // AI 是显式选项；选中后却没有配置时应明确报错，不应静默改用另一种引擎。
    LlmCredentialRow credential = credentialService.requiredForSimulation(ownerId);
    String apiKey;
    try {
      apiKey = credentialService.decryptApiKey(credential);
    } catch (IllegalStateException exception) {
      // 已保存的密钥无法解密时，不应把底层异常变成浏览器无法理解的裸 500。
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "已保存的模型 API Key 无法解密，请在 AI 设置中重新配置。",
          exception
      );
    }
    SimulationResult result = client.simulate(credential, apiKey, homeMembers, awayMembers, players);
    return new AiSimulationResult(result, "llm:" + credential.model());
  }

  public record AiSimulationResult(SimulationResult result, String engineVersion) {}
}
