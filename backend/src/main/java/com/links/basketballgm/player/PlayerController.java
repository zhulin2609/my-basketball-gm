package com.links.basketballgm.player;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Local API facade. Production writes will obtain the owner from Spring Security. */
@RestController
@Profile("local")
@RequestMapping("/api/v1/players")
public class PlayerController {
  private final PlayerMapper mapper;
  private final UUID ownerId;

  public PlayerController(PlayerMapper mapper, @Value("${app.local-dev-owner-id}") UUID ownerId) {
    this.mapper = mapper;
    this.ownerId = ownerId;
  }

  @GetMapping
  public List<PlayerResponse> list() {
    return mapper.list(ownerId).stream()
        .map(player -> player.isCustom() ? player : overrideOrOriginal(player))
        .toList();
  }

  @PostMapping
  @Transactional
  public ResponseEntity<PlayerResponse> create(@Valid @RequestBody PlayerPayload payload) {
    String id = mapper.insert(ownerId, payload);
    PlayerResponse saved = mapper.find(id);
    return ResponseEntity.created(URI.create("/api/v1/players/" + saved.id())).body(saved);
  }

  @PutMapping("/{id}")
  @Transactional
  public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody PlayerPayload payload) {
    PlayerResponse existing = mapper.find(id);
    if (existing == null) return ResponseEntity.status(404).body(Map.of("message", "未找到该球员。"));
    if (existing.isCustom()) {
      if (mapper.updateCustom(id, ownerId, payload) == 0) return ResponseEntity.status(404).body(Map.of("message", "未找到可编辑的自定义球员。"));
      return ResponseEntity.ok(mapper.find(id));
    }
    if (mapper.upsertOverride(id, ownerId, payload) == 0) {
      return ResponseEntity.status(404).body(Map.of("message", "未找到可编辑的预置球员。"));
    }
    return ResponseEntity.ok(overrideOrOriginal(existing));
  }

  private PlayerResponse overrideOrOriginal(PlayerResponse original) {
    PlayerResponse override = mapper.findOverride(ownerId, original.id());
    return override == null ? original : override;
  }
}
