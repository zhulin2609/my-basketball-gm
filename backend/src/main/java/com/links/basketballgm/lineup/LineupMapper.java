package com.links.basketballgm.lineup;

import java.util.List;
import java.util.UUID;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface LineupMapper {
  @Select("select client_key as id, name, description, created_at as \"createdAt\", updated_at as \"updatedAt\" from lineups where owner_id = #{ownerId} order by updated_at desc")
  List<LineupRow> list(@Param("ownerId") UUID ownerId);

  @Select("select client_key as \"lineupId\", coalesce(p.catalog_key, p.id::text) as \"playerId\", lp.position::text as position, lp.role::text as role, lp.sort_order as \"sortOrder\" from lineup_players lp join lineups l on l.id = lp.lineup_id join players p on p.id = lp.player_id where l.owner_id = #{ownerId} order by l.updated_at desc, lp.sort_order")
  List<LineupMemberRow> listMembers(@Param("ownerId") UUID ownerId);

  @Select("select l.client_key as \"lineupId\", s.id::text as \"postId\" from shared_lineups s join lineups l on l.id = s.source_lineup_id where l.owner_id = #{ownerId}")
  List<SharedPostIdRow> listSharedPostIds(@Param("ownerId") UUID ownerId);

  @Select("select l.client_key as \"lineupId\", p.name as \"playerName\" from lineup_players lp join lineups l on l.id = lp.lineup_id join players p on p.id = lp.player_id where l.owner_id = #{ownerId} and (p.is_custom or exists (select 1 from player_overrides po where po.owner_id = l.owner_id and po.player_id = lp.player_id))")
  List<ShareBlockedPlayerRow> listShareBlockedPlayers(@Param("ownerId") UUID ownerId);

  @Update("""
      insert into lineups (owner_id, client_key, name, description)
      values (#{ownerId}, #{id}, #{p.name}, #{p.description})
      on conflict (owner_id, client_key) do update
      set name = excluded.name, description = excluded.description, updated_at = now()
      """)
  int upsert(@Param("ownerId") UUID ownerId, @Param("id") String id, @Param("p") LineupPayload payload);

  @Select("select id::text from lineups where owner_id = #{ownerId} and client_key = #{id}")
  String findDatabaseId(@Param("ownerId") UUID ownerId, @Param("id") String id);

  @Select("select client_key as id, name, description, created_at as \"createdAt\", updated_at as \"updatedAt\" from lineups where owner_id = #{ownerId} and client_key = #{id}")
  LineupRow find(@Param("ownerId") UUID ownerId, @Param("id") String id);

  @Select("select l.client_key as \"lineupId\", coalesce(p.catalog_key, p.id::text) as \"playerId\", lp.position::text as position, lp.role::text as role, lp.sort_order as \"sortOrder\" from lineup_players lp join lineups l on l.id = lp.lineup_id join players p on p.id = lp.player_id where l.owner_id = #{ownerId} and l.client_key = #{id} order by lp.sort_order")
  List<LineupMemberRow> findMembers(@Param("ownerId") UUID ownerId, @Param("id") String id);

  @Delete("delete from lineup_players where lineup_id = cast(#{databaseId} as uuid)")
  int deleteMembers(@Param("databaseId") String databaseId);

  @Insert({
      "<script>",
      "insert into lineup_players (lineup_id, player_id, position, role, sort_order)",
      "<foreach collection='members' item='member' separator=' union all '>",
      "select cast(#{databaseId} as uuid), p.id, cast(#{member.position} as court_position), cast(#{member.role} as lineup_role), #{member.sortOrder} from players p where (p.catalog_key = #{member.playerId} or p.id::text = #{member.playerId}) and (p.is_custom = false or p.owner_id = #{ownerId})",
      "</foreach>",
      "</script>"
  })
  int insertMembers(
      @Param("databaseId") String databaseId,
      @Param("ownerId") UUID ownerId,
      @Param("members") List<LineupMemberWrite> members
  );
}
