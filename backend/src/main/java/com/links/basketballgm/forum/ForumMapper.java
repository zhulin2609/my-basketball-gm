package com.links.basketballgm.forum;

import java.util.List;
import java.util.UUID;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ForumMapper {
  String POST_COLUMNS = "s.id::text as id, s.owner_id::text as \"ownerId\", u.username as \"authorName\", "
      + "s.name, s.description, jsonb_array_length(s.members) as \"memberCount\", "
      + "s.comment_count as \"commentCount\", s.copy_count as \"copyCount\", "
      + "s.created_at as \"createdAt\", s.updated_at as \"updatedAt\"";

  String COMMENT_COLUMNS = "c.id::text as id, c.shared_lineup_id::text as \"postId\", c.author_id::text as \"authorId\", "
      + "u.username as \"authorName\", c.content, c.parent_id::text as \"parentId\", "
      + "pu.username as \"parentAuthorName\", c.created_at as \"createdAt\"";

  String COMMENT_JOINS = "from lineup_comments c "
      + "join users u on u.id = c.author_id "
      + "left join lineup_comments pc on pc.id = c.parent_id "
      + "left join users pu on pu.id = pc.author_id";

  @Select("select " + POST_COLUMNS + " from shared_lineups s join users u on u.id = s.owner_id "
      + "order by s.created_at desc, s.id limit #{limit} offset #{offset}")
  List<PostSummaryRow> listPosts(@Param("limit") int limit, @Param("offset") int offset);

  @Select("select count(*) from shared_lineups")
  int countPosts();

  @Select("select " + POST_COLUMNS + ", s.members::text as \"membersJson\" from shared_lineups s "
      + "join users u on u.id = s.owner_id where s.id = cast(#{id} as uuid)")
  PostRow findPost(@Param("id") String id);

  @Select("select " + POST_COLUMNS + ", s.members::text as \"membersJson\" from shared_lineups s "
      + "join users u on u.id = s.owner_id where s.source_lineup_id = cast(#{sourceLineupId} as uuid)")
  PostRow findPostBySource(@Param("sourceLineupId") String sourceLineupId);

  @Select("""
      insert into shared_lineups (owner_id, source_lineup_id, name, description, members)
      values (#{ownerId}, cast(#{sourceLineupId} as uuid), #{name}, #{description}, cast(#{membersJson} as jsonb))
      returning id::text
      """)
  String insertPost(
      @Param("ownerId") UUID ownerId,
      @Param("sourceLineupId") String sourceLineupId,
      @Param("name") String name,
      @Param("description") String description,
      @Param("membersJson") String membersJson
  );

  @Update("""
      update shared_lineups
      set name = #{name}, description = #{description}, members = cast(#{membersJson} as jsonb), updated_at = now()
      where id = cast(#{id} as uuid)
      """)
  int updatePost(
      @Param("id") String id,
      @Param("name") String name,
      @Param("description") String description,
      @Param("membersJson") String membersJson
  );

  @Delete("delete from shared_lineups where id = cast(#{id} as uuid)")
  int deletePost(@Param("id") String id);

  @Select("""
      select id::text as id, client_key as "clientKey", name, description
      from lineups
      where owner_id = #{ownerId} and client_key = #{clientKey}
      """)
  OwnedLineupRow findOwnedLineup(@Param("ownerId") UUID ownerId, @Param("clientKey") String clientKey);

  @Select("""
      select lp.player_id::text as "playerUuid",
             coalesce(p.catalog_key, p.id::text) as "playerId",
             p.name as "playerName",
             p.is_custom as "custom",
             exists(select 1 from player_overrides po where po.owner_id = #{ownerId} and po.player_id = lp.player_id) as "overridden",
             lp.position::text as position,
             lp.role::text as role
      from lineup_players lp
      join players p on p.id = lp.player_id
      where lp.lineup_id = cast(#{lineupId} as uuid)
      order by lp.sort_order
      """)
  List<PublishMemberRow> listPublishMembers(@Param("ownerId") UUID ownerId, @Param("lineupId") String lineupId);

  @Select("select " + COMMENT_COLUMNS + " " + COMMENT_JOINS + " "
      + "where c.shared_lineup_id = cast(#{postId} as uuid) "
      + "order by c.created_at asc, c.id limit #{limit} offset #{offset}")
  List<CommentRow> listComments(@Param("postId") String postId, @Param("limit") int limit, @Param("offset") int offset);

  @Select("select count(*) from lineup_comments where shared_lineup_id = cast(#{postId} as uuid)")
  int countComments(@Param("postId") String postId);

  @Select("select " + COMMENT_COLUMNS + " " + COMMENT_JOINS + " where c.id = cast(#{id} as uuid)")
  CommentRow findComment(@Param("id") String id);

  @Select("""
      insert into lineup_comments (shared_lineup_id, author_id, parent_id, content)
      values (cast(#{postId} as uuid), #{authorId}, cast(#{parentId,jdbcType=VARCHAR} as uuid), #{content})
      returning id::text
      """)
  String insertComment(
      @Param("postId") String postId,
      @Param("authorId") UUID authorId,
      @Param("parentId") String parentId,
      @Param("content") String content
  );

  @Select("select count(*) from lineup_comments where parent_id = cast(#{id} as uuid)")
  int countReplies(@Param("id") String id);

  @Select("select count(*) from lineup_comments where author_id = #{authorId} and created_at > now() - interval '1 second'")
  int countCommentsInLastSecond(@Param("authorId") UUID authorId);

  @Select("select count(*) from lineup_comments where author_id = #{authorId} and created_at > now() - interval '1 day'")
  int countCommentsInLastDay(@Param("authorId") UUID authorId);

  @Select("select count(*) from shared_lineups where owner_id = #{ownerId} and created_at > now() - interval '1 hour'")
  int countPostsInLastHour(@Param("ownerId") UUID ownerId);

  @Select("select created_at from users where id = #{id}")
  java.time.OffsetDateTime findUserCreatedAt(@Param("id") UUID id);

  @Delete("delete from lineup_comments where id = cast(#{id} as uuid)")
  int deleteComment(@Param("id") String id);

  @Update("update shared_lineups set comment_count = comment_count + #{delta} where id = cast(#{postId} as uuid)")
  int addCommentCount(@Param("postId") String postId, @Param("delta") int delta);

  @Update("update shared_lineups set copy_count = copy_count + 1 where id = cast(#{postId} as uuid)")
  int incrementCopyCount(@Param("postId") String postId);

  @Select("""
      insert into lineups (owner_id, client_key, name, description, is_preset)
      values (#{ownerId}, #{clientKey}, #{name}, #{description}, false)
      returning id::text
      """)
  String insertCopiedLineup(
      @Param("ownerId") UUID ownerId,
      @Param("clientKey") String clientKey,
      @Param("name") String name,
      @Param("description") String description
  );

  @Select("select id::text from players where catalog_key = #{catalogKey} and is_custom = false")
  String findCatalogPlayerUuid(@Param("catalogKey") String catalogKey);

  @Insert("""
      insert into lineup_players (lineup_id, player_id, position, role, sort_order)
      values (cast(#{lineupId} as uuid), cast(#{playerUuid} as uuid), cast(#{position} as court_position), cast(#{role} as lineup_role), #{sortOrder})
      """)
  int insertCopiedMember(
      @Param("lineupId") String lineupId,
      @Param("playerUuid") String playerUuid,
      @Param("position") String position,
      @Param("role") String role,
      @Param("sortOrder") int sortOrder
  );
}
