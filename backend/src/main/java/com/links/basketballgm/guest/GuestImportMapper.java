package com.links.basketballgm.guest;

import java.util.UUID;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface GuestImportMapper {
  @Insert("insert into guest_imports (guest_workspace_id, owner_id) values (#{workspaceId}, #{ownerId}) on conflict do nothing")
  int reserve(@Param("workspaceId") UUID workspaceId, @Param("ownerId") UUID ownerId);

  @Select("select guest_workspace_id as \"guestWorkspaceId\", owner_id as \"ownerId\", player_count as \"playerCount\", lineup_count as \"lineupCount\", simulation_count as \"simulationCount\" from guest_imports where guest_workspace_id = #{workspaceId}")
  GuestImportRow find(@Param("workspaceId") UUID workspaceId);

  @Update("update guest_imports set player_count=#{playerCount}, lineup_count=#{lineupCount}, simulation_count=#{simulationCount} where guest_workspace_id=#{workspaceId} and owner_id=#{ownerId}")
  int finish(
      @Param("workspaceId") UUID workspaceId,
      @Param("ownerId") UUID ownerId,
      @Param("playerCount") int playerCount,
      @Param("lineupCount") int lineupCount,
      @Param("simulationCount") int simulationCount
  );
}
