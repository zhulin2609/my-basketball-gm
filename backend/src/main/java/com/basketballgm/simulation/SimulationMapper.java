package com.basketballgm.simulation;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SimulationMapper {

  @Select("""
      insert into simulations (
        owner_id, home_lineup_id, away_lineup_id, home_lineup_name, away_lineup_name,
        random_seed, home_score, away_score, engine_version, created_at, expires_at
      ) values (
        #{ownerId}, cast(#{homeDatabaseId} as uuid), cast(#{awayDatabaseId} as uuid),
        #{homeName}, #{awayName}, #{seed}, #{homeScore}, #{awayScore}, #{engineVersion},
        now(), now() + interval '30 days'
      )
      returning id::text, created_at as "createdAt", expires_at as "expiresAt"
      """)
  SimulationIdentity insert(
      @Param("ownerId") UUID ownerId,
      @Param("homeDatabaseId") String homeDatabaseId,
      @Param("awayDatabaseId") String awayDatabaseId,
      @Param("homeName") String homeName,
      @Param("awayName") String awayName,
      @Param("seed") long seed,
      @Param("homeScore") int homeScore,
      @Param("awayScore") int awayScore,
      @Param("engineVersion") String engineVersion
  );

  @Select("""
      insert into simulations (
        owner_id, home_lineup_id, away_lineup_id, home_lineup_name, away_lineup_name,
        random_seed, home_score, away_score, engine_version, created_at, expires_at
      ) values (
        #{ownerId}, cast(#{homeDatabaseId} as uuid), cast(#{awayDatabaseId} as uuid),
        #{homeName}, #{awayName}, #{seed}, #{homeScore}, #{awayScore}, #{engineVersion},
        #{createdAt}, #{expiresAt}
      )
      returning id::text, created_at as "createdAt", expires_at as "expiresAt"
      """)
  SimulationIdentity insertImported(
      @Param("ownerId") UUID ownerId,
      @Param("homeDatabaseId") String homeDatabaseId,
      @Param("awayDatabaseId") String awayDatabaseId,
      @Param("homeName") String homeName,
      @Param("awayName") String awayName,
      @Param("seed") long seed,
      @Param("homeScore") int homeScore,
      @Param("awayScore") int awayScore,
      @Param("engineVersion") String engineVersion,
      @Param("createdAt") Instant createdAt,
      @Param("expiresAt") Instant expiresAt
  );

  @Insert({
      "<script>",
      "insert into simulation_player_stats (simulation_id, player_id, side, player_name, player_initials, player_accent, minutes, points, rebounds, assists, steals, blocks, fg_made, fg_attempted, three_made, three_attempted)",
      "<foreach collection='stats' item='stat' separator=' union all '>",
      "select cast(#{simulationId} as uuid), p.id, #{stat.side}, #{stat.playerName}, #{stat.playerInitials}, #{stat.playerAccent}, #{stat.minutes}, #{stat.points}, #{stat.rebounds}, #{stat.assists}, #{stat.steals}, #{stat.blocks}, #{stat.fgMade}, #{stat.fgAttempted}, #{stat.threeMade}, #{stat.threeAttempted} from players p where (p.catalog_key = #{stat.playerId} or p.id::text = #{stat.playerId}) and (p.is_custom = false or p.owner_id = #{ownerId})",
      "</foreach>",
      "</script>"
  })
  int insertStats(
      @Param("simulationId") String simulationId,
      @Param("ownerId") UUID ownerId,
      @Param("stats") List<SimulationStatWrite> stats
  );

  @Select("""
      select simulation.id::text as id,
             home.client_key as "homeLineupId",
             away.client_key as "awayLineupId",
             simulation.home_lineup_name as "homeLineupName",
             simulation.away_lineup_name as "awayLineupName",
             simulation.random_seed as seed,
             simulation.home_score as "homeScore",
             simulation.away_score as "awayScore",
             simulation.engine_version as "engineVersion",
             simulation.created_at as "createdAt",
             simulation.expires_at as "expiresAt"
      from simulations simulation
      join lineups home on home.id = simulation.home_lineup_id
      join lineups away on away.id = simulation.away_lineup_id
      where simulation.owner_id = #{ownerId}
        and simulation.expires_at > now()
      order by simulation.created_at desc
      limit #{limit}
      """)
  List<SimulationRow> list(@Param("ownerId") UUID ownerId, @Param("limit") int limit);

  @Select("""
      select stat.simulation_id::text as "simulationId",
             stat.side,
             coalesce(player.catalog_key, player.id::text) as "playerId",
             stat.player_name as "playerName",
             stat.player_initials as "playerInitials",
             stat.player_accent as "playerAccent",
             stat.minutes,
             stat.points,
             stat.rebounds,
             stat.assists,
             stat.steals,
             stat.blocks,
             stat.fg_made as "fgMade",
             stat.fg_attempted as "fgAttempted",
             stat.three_made as "threeMade",
             stat.three_attempted as "threeAttempted"
      from simulation_player_stats stat
      join simulations simulation on simulation.id = stat.simulation_id
      join players player on player.id = stat.player_id
      where simulation.owner_id = #{ownerId}
        and simulation.expires_at > now()
        and simulation.id in (
          select recent.id
          from simulations recent
          where recent.owner_id = #{ownerId}
            and recent.expires_at > now()
          order by recent.created_at desc
          limit #{limit}
        )
      order by simulation.created_at desc, stat.side, stat.points desc
      """)
  List<SimulationStatRow> listStats(
      @Param("ownerId") UUID ownerId,
      @Param("limit") int limit
  );

  @Select("select pg_try_advisory_xact_lock(2026091603)")
  boolean tryCleanupLock();

  @Delete("delete from simulations where expires_at <= now()")
  int deleteExpired();
}
