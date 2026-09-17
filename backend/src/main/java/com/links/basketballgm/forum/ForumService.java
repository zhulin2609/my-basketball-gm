package com.links.basketballgm.forum;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.links.basketballgm.lineup.LineupMapper;
import com.links.basketballgm.lineup.LineupMemberResponse;
import com.links.basketballgm.lineup.LineupResponse;
import com.links.basketballgm.lineup.LineupRow;
import com.links.basketballgm.lineup.ShareBlockedPlayerRow;
import com.links.basketballgm.player.PlayerMapper;
import com.links.basketballgm.player.PlayerResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ForumService {
  static final int POSTS_MAX_PAGE_SIZE = 50;
  static final int COMMENTS_MAX_PAGE_SIZE = 100;

  private final ForumMapper forumMapper;
  private final PlayerMapper playerMapper;
  private final LineupMapper lineupMapper;
  private final ObjectMapper objectMapper = new ObjectMapper();

  public ForumService(ForumMapper forumMapper, PlayerMapper playerMapper, LineupMapper lineupMapper) {
    this.forumMapper = forumMapper;
    this.playerMapper = playerMapper;
    this.lineupMapper = lineupMapper;
  }

  public PagedResponse<PostSummary> listPosts(UUID viewerId, int page, int pageSize) {
    int safePage = Math.max(page, 1);
    int safePageSize = clampPageSize(pageSize, POSTS_MAX_PAGE_SIZE);
    List<PostSummary> items = forumMapper.listPosts(safePageSize, (safePage - 1) * safePageSize).stream()
        .map(row -> toSummary(row, viewerId))
        .toList();
    return new PagedResponse<>(items, forumMapper.countPosts(), safePage, safePageSize);
  }

  public PostDetail detail(String postId, UUID viewerId) {
    return toDetail(requirePost(postId), viewerId);
  }

  public PagedResponse<CommentResponse> listComments(String postId, UUID viewerId, int page, int pageSize) {
    requirePost(postId);
    int safePage = Math.max(page, 1);
    int safePageSize = clampPageSize(pageSize, COMMENTS_MAX_PAGE_SIZE);
    List<CommentResponse> items = forumMapper.listComments(postId, safePageSize, (safePage - 1) * safePageSize).stream()
        .map(row -> toCommentResponse(row, viewerId))
        .toList();
    return new PagedResponse<>(items, forumMapper.countComments(postId), safePage, safePageSize);
  }

  @Transactional
  public PublishResult publish(UUID ownerId, PublishPostRequest request) {
    OwnedLineupRow lineup = forumMapper.findOwnedLineup(ownerId, request.lineupId());
    if (lineup == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "未找到该阵容。");

    List<PublishMemberRow> members = forumMapper.listPublishMembers(ownerId, lineup.id());
    List<String> blockedNames = members.stream()
        .filter(member -> member.custom() || member.overridden())
        .map(PublishMemberRow::playerName)
        .distinct()
        .toList();
    if (!blockedNames.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "阵容包含自定义球员或编辑过的公共球员，不能公开：" + String.join("、", blockedNames)
      );
    }

    List<SnapshotMember> snapshot = members.stream()
        .map(this::toSnapshotMember)
        .toList();
    String membersJson = writeMembers(snapshot);

    PostRow existing = forumMapper.findPostBySource(lineup.id());
    if (existing == null) {
      String postId = forumMapper.insertPost(ownerId, lineup.id(), lineup.name(), lineup.description(), membersJson);
      return new PublishResult(true, toDetail(forumMapper.findPost(postId), ownerId));
    }
    forumMapper.updatePost(existing.id(), lineup.name(), lineup.description(), membersJson);
    return new PublishResult(false, toDetail(forumMapper.findPost(existing.id()), ownerId));
  }

  @Transactional
  public void deletePost(UUID ownerId, String postId) {
    PostRow post = requirePost(postId);
    if (!post.ownerId().equals(ownerId.toString())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能删除自己公开的阵容。");
    }
    forumMapper.deletePost(postId);
  }

  @Transactional
  public CommentResponse addComment(UUID authorId, String postId, CommentRequest request) {
    requirePost(postId);
    CommentRow parent = null;
    if (request.parentId() != null && !request.parentId().isBlank()) {
      parent = forumMapper.findComment(request.parentId());
      if (parent == null || !parent.postId().equals(postId) || parent.parentId() != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "只能回复该帖子下的一级评论。");
      }
    }
    String commentId = forumMapper.insertComment(postId, authorId, parent == null ? null : parent.id(), request.content());
    forumMapper.addCommentCount(postId, 1);
    return toCommentResponse(forumMapper.findComment(commentId), authorId);
  }

  @Transactional
  public void deleteComment(UUID authorId, String commentId) {
    CommentRow comment = forumMapper.findComment(commentId);
    if (comment == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "未找到该评论。");
    if (!comment.authorId().equals(authorId.toString())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能删除自己的评论。");
    }
    int removed = 1 + forumMapper.countReplies(commentId);
    forumMapper.deleteComment(commentId);
    forumMapper.addCommentCount(comment.postId(), -removed);
  }

  @Transactional
  public LineupResponse copyPost(UUID ownerId, String postId) {
    PostRow post = requirePost(postId);
    List<SnapshotMember> snapshot = readMembers(post.membersJson());

    String clientKey = UUID.randomUUID().toString();
    String lineupId = forumMapper.insertCopiedLineup(ownerId, clientKey, post.name(), post.description());
    for (int index = 0; index < snapshot.size(); index++) {
      SnapshotMember member = snapshot.get(index);
      String playerUuid = forumMapper.findCatalogPlayerUuid(member.playerId());
      if (playerUuid == null) {
        throw new IllegalStateException("快照中的球员已不在公共目录：" + member.playerId());
      }
      String role = member.inactive() ? "inactive" : member.starter() ? "starter" : "bench";
      forumMapper.insertCopiedMember(lineupId, playerUuid, member.position(), role, index);
    }
    forumMapper.incrementCopyCount(postId);

    LineupRow lineup = lineupMapper.find(ownerId, clientKey);
    List<LineupMemberResponse> members = snapshot.stream()
        .map(member -> new LineupMemberResponse(member.playerId(), member.position(), member.starter(), member.inactive()))
        .toList();
    List<String> shareBlockedPlayers = lineupMapper.listShareBlockedPlayers(ownerId).stream()
        .filter(row -> row.lineupId().equals(clientKey))
        .map(ShareBlockedPlayerRow::playerName)
        .toList();
    return new LineupResponse(
        lineup.id(),
        lineup.name(),
        lineup.description(),
        members,
        lineup.createdAt(),
        lineup.updatedAt(),
        null,
        shareBlockedPlayers
    );
  }

  private PostRow requirePost(String postId) {
    PostRow post = forumMapper.findPost(postId);
    if (post == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "未找到该帖子。");
    return post;
  }

  private SnapshotMember toSnapshotMember(PublishMemberRow member) {
    PlayerResponse player = playerMapper.find(member.playerUuid());
    if (player == null) {
      throw new IllegalStateException("阵容成员引用了不存在的球员：" + member.playerUuid());
    }
    return new SnapshotMember(
        member.playerId(),
        member.position(),
        "starter".equals(member.role()),
        "inactive".equals(member.role()),
        player
    );
  }

  private PostSummary toSummary(PostSummaryRow row, UUID viewerId) {
    return new PostSummary(
        row.id(),
        row.name(),
        row.description(),
        row.authorName(),
        row.memberCount(),
        row.commentCount(),
        row.copyCount(),
        isMine(row.ownerId(), viewerId),
        row.createdAt(),
        row.updatedAt()
    );
  }

  private PostDetail toDetail(PostRow row, UUID viewerId) {
    return new PostDetail(
        row.id(),
        row.name(),
        row.description(),
        row.authorName(),
        row.memberCount(),
        row.commentCount(),
        row.copyCount(),
        isMine(row.ownerId(), viewerId),
        row.createdAt(),
        row.updatedAt(),
        readMembers(row.membersJson())
    );
  }

  private CommentResponse toCommentResponse(CommentRow row, UUID viewerId) {
    return new CommentResponse(
        row.id(),
        row.authorName(),
        row.content(),
        row.parentId(),
        row.parentAuthorName(),
        isMine(row.authorId(), viewerId),
        row.createdAt()
    );
  }

  private boolean isMine(String ownerId, UUID viewerId) {
    return viewerId != null && ownerId.equals(viewerId.toString());
  }

  private int clampPageSize(int pageSize, int max) {
    return Math.min(Math.max(pageSize, 1), max);
  }

  private String writeMembers(List<SnapshotMember> members) {
    try {
      return objectMapper.writeValueAsString(members);
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("阵容快照序列化失败。", exception);
    }
  }

  private List<SnapshotMember> readMembers(String membersJson) {
    try {
      return objectMapper.readValue(membersJson, new TypeReference<>() {});
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("阵容快照解析失败。", exception);
    }
  }
}
