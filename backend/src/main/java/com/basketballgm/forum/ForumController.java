package com.basketballgm.forum;

import com.basketballgm.lineup.LineupResponse;
import com.basketballgm.moderation.ModerationService;
import com.basketballgm.user.CurrentUser;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Community forum for shared lineups. The three GET endpoints also serve anonymous visitors,
 * so the JWT principal is nullable there and only personalizes the mine flag.
 */
@RestController
@RequestMapping("/api/v1/forum")
public class ForumController {
  private final ForumService service;
  private final CurrentUser currentUser;
  private final ModerationService moderation;

  public ForumController(ForumService service, CurrentUser currentUser, ModerationService moderation) {
    this.service = service;
    this.currentUser = currentUser;
    this.moderation = moderation;
  }

  @GetMapping("/posts")
  public PagedResponse<PostSummary> listPosts(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return service.listPosts(viewerId(jwt), page, pageSize);
  }

  @GetMapping("/posts/{id}")
  public PostDetail detail(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
    return service.detail(id, viewerId(jwt));
  }

  @GetMapping("/posts/{id}/comments")
  public PagedResponse<CommentResponse> listComments(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String id,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int pageSize
  ) {
    return service.listComments(id, viewerId(jwt), page, pageSize);
  }

  @PostMapping("/posts")
  public ResponseEntity<PostDetail> publish(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody PublishPostRequest request
  ) {
    UUID ownerId = currentUser.id(jwt);
    // Moderation runs before the write transaction so the cloud HTTP call never holds a
    // database connection.
    moderation.check(service.findPublishText(ownerId, request.lineupId()));
    PublishResult result = service.publish(ownerId, request);
    HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
    return ResponseEntity.status(status).body(result.post());
  }

  @DeleteMapping("/posts/{id}")
  public ResponseEntity<Void> deletePost(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
    service.deletePost(currentUser.id(jwt), id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/posts/{id}/comments")
  public ResponseEntity<CommentResponse> addComment(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String id,
      @Valid @RequestBody CommentRequest request
  ) {
    UUID authorId = currentUser.id(jwt);
    moderation.check(request.content());
    CommentResponse comment = service.addComment(authorId, id, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(comment);
  }

  @DeleteMapping("/comments/{id}")
  public ResponseEntity<Void> deleteComment(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
    service.deleteComment(currentUser.id(jwt), id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/posts/{id}/copy")
  public ResponseEntity<LineupResponse> copy(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
    LineupResponse lineup = service.copyPost(currentUser.id(jwt), id);
    return ResponseEntity.status(HttpStatus.CREATED).body(lineup);
  }

  private UUID viewerId(Jwt jwt) {
    return jwt == null ? null : currentUser.id(jwt);
  }
}
