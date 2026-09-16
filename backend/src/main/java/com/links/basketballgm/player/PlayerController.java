package com.links.basketballgm.player;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.links.basketballgm.user.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Player data is scoped to the authenticated user for custom players and overrides. */
@RestController
@RequestMapping("/api/v1/players")
public class PlayerController {
  private final PlayerMapper mapper;
  private final CurrentUser currentUser;

  public PlayerController(PlayerMapper mapper, CurrentUser currentUser) {
    this.mapper = mapper;
    this.currentUser = currentUser;
  }

  @GetMapping
  public List<PlayerResponse> list(@AuthenticationPrincipal Jwt jwt) {
    var ownerId = currentUser.id(jwt);
    return mapper.list(ownerId).stream()
        .map(player -> player.isCustom() ? player : overrideOrOriginal(ownerId, player))
        .toList();
  }

  @PostMapping
  @Transactional
  public ResponseEntity<PlayerResponse> create(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody PlayerPayload payload
  ) {
    var ownerId = currentUser.id(jwt);
    String id = mapper.insert(ownerId, payload);
    PlayerResponse saved = mapper.find(id);
    return ResponseEntity.created(URI.create("/api/v1/players/" + saved.id())).body(saved);
  }

  @PutMapping("/{id}")
  @Transactional
  public ResponseEntity<?> update(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String id,
      @Valid @RequestBody PlayerPayload payload
  ) {
    var ownerId = currentUser.id(jwt);
    PlayerResponse existing = mapper.find(id);
    if (existing == null) return ResponseEntity.status(404).body(Map.of("message", "未找到该球员。"));
    if (existing.isCustom()) {
      if (mapper.updateCustom(id, ownerId, payload) == 0) return ResponseEntity.status(404).body(Map.of("message", "未找到可编辑的自定义球员。"));
      return ResponseEntity.ok(mapper.find(id));
    }
    if (mapper.upsertOverride(id, ownerId, payload) == 0) {
      return ResponseEntity.status(404).body(Map.of("message", "未找到可编辑的预置球员。"));
    }
    return ResponseEntity.ok(overrideOrOriginal(ownerId, existing));
  }

  private PlayerResponse overrideOrOriginal(UUID ownerId, PlayerResponse original) {
    PlayerResponse override = mapper.findOverride(ownerId, original.id());
    return override == null ? original : override;
  }
}
