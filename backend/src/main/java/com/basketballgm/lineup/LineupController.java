package com.basketballgm.lineup;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.basketballgm.user.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Persists lineup drafts under the authenticated owner.
 */
@RestController
@RequestMapping("/api/v1/lineups")
public class LineupController {
  private final LineupMapper mapper;
  private final CurrentUser currentUser;

  public LineupController(LineupMapper mapper, CurrentUser currentUser) {
    this.mapper = mapper;
    this.currentUser = currentUser;
  }

  @GetMapping
  public List<LineupResponse> list(@AuthenticationPrincipal Jwt jwt) {
    var ownerId = currentUser.id(jwt);
    return assemble(
        mapper.list(ownerId),
        mapper.listMembers(ownerId),
        mapper.listSharedPostIds(ownerId),
        mapper.listShareBlockedPlayers(ownerId)
    );
  }

  @PutMapping("/{id}")
  @Transactional
  public ResponseEntity<?> save(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String id,
      @Valid @RequestBody LineupPayload payload
  ) {
    var ownerId = currentUser.id(jwt);
    String validationMessage = payload.validationMessage();
    if (validationMessage != null) return ResponseEntity.badRequest().body(Map.of("message", validationMessage));

    mapper.upsert(ownerId, id, payload);
    String databaseId = mapper.findDatabaseId(ownerId, id);
    mapper.deleteMembers(databaseId);

    List<LineupMemberWrite> members = toWrites(payload.members());
    if (!members.isEmpty() && mapper.insertMembers(databaseId, ownerId, members) != members.size()) {
      throw new IllegalArgumentException("阵容包含不存在或无权使用的球员。");
    }

    LineupRow lineup = mapper.find(ownerId, id);
    return ResponseEntity.ok(assemble(
        List.of(lineup),
        mapper.listMembers(ownerId),
        mapper.listSharedPostIds(ownerId),
        mapper.listShareBlockedPlayers(ownerId)
    ).getFirst());
  }

  private List<LineupMemberWrite> toWrites(List<LineupMemberPayload> members) {
    List<LineupMemberWrite> writes = new ArrayList<>();
    for (int index = 0; index < members.size(); index++) {
      LineupMemberPayload member = members.get(index);
      String role = member.inactive() ? "inactive" : member.starter() ? "starter" : "bench";
      writes.add(new LineupMemberWrite(member.playerId(), member.position(), role, index));
    }
    return writes;
  }

  private List<LineupResponse> assemble(
      List<LineupRow> lineups,
      List<LineupMemberRow> members,
      List<SharedPostIdRow> sharedPosts,
      List<ShareBlockedPlayerRow> blockedPlayers
  ) {
    Map<String, List<LineupMemberResponse>> membersByLineup = new HashMap<>();
    for (LineupMemberRow member : members) {
      LineupMemberResponse response = new LineupMemberResponse(
          member.playerId(),
          member.position(),
          "starter".equals(member.role()),
          "inactive".equals(member.role())
      );
      membersByLineup.computeIfAbsent(member.lineupId(), ignored -> new ArrayList<>()).add(response);
    }
    Map<String, String> postByLineup = new HashMap<>();
    for (SharedPostIdRow shared : sharedPosts) {
      postByLineup.put(shared.lineupId(), shared.postId());
    }
    Map<String, List<String>> blockedByLineup = new HashMap<>();
    for (ShareBlockedPlayerRow blocked : blockedPlayers) {
      blockedByLineup.computeIfAbsent(blocked.lineupId(), ignored -> new ArrayList<>()).add(blocked.playerName());
    }
    return lineups.stream()
        .map(lineup -> new LineupResponse(
            lineup.id(),
            lineup.name(),
            lineup.description(),
            membersByLineup.getOrDefault(lineup.id(), List.of()),
            lineup.createdAt(),
            lineup.updatedAt(),
            postByLineup.get(lineup.id()),
            blockedByLineup.getOrDefault(lineup.id(), List.of())
        ))
        .toList();
  }
}
