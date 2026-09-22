package com.basketballgm.player;

import java.util.List;
import java.util.UUID;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface PlayerMapper {
  String COLUMNS = "coalesce(catalog_key, id::text) as id, is_custom as \"isCustom\", name, chinese_name as \"chineseName\", initials, peak_season as \"peakSeason\", peak_team as \"peakTeam\", default_position::text as \"defaultPosition\", height_feet as \"heightFeet\", height_inches as \"heightInches\", weight_lbs as \"weightLbs\", salary_usd as \"salaryUsd\", archetype, bio, accent, three_point as \"threePoint\", layup, mid_range as \"midRange\", inside_scoring as \"insideScoring\", dunk, offensive_rebound as \"offensiveRebound\", defensive_rebound as \"defensiveRebound\", handling, passing, defensive_iq as \"defensiveIQ\", offensive_iq as \"offensiveIQ\", speed, agility, vertical, strength, free_throw as \"freeThrow\", steal, block, stamina, shot_tendency as \"shotTendency\"";

  @Select("select " + COLUMNS + " from players where is_custom = false or owner_id = #{ownerId} order by is_custom, name")
  List<PlayerResponse> list(@Param("ownerId") UUID ownerId);

  @Select("select " + COLUMNS + " from players where catalog_key = #{id} or id::text = #{id} limit 1")
  PlayerResponse find(@Param("id") String id);

  @Select("select coalesce(p.catalog_key, p.id::text) as id, false as \"isCustom\", p.name, p.chinese_name as \"chineseName\", p.initials, po.peak_season as \"peakSeason\", po.peak_team as \"peakTeam\", po.default_position::text as \"defaultPosition\", p.height_feet as \"heightFeet\", p.height_inches as \"heightInches\", p.weight_lbs as \"weightLbs\", po.salary_usd as \"salaryUsd\", po.archetype, po.bio, po.accent, po.three_point as \"threePoint\", po.layup, po.mid_range as \"midRange\", po.inside_scoring as \"insideScoring\", po.dunk, po.offensive_rebound as \"offensiveRebound\", po.defensive_rebound as \"defensiveRebound\", po.handling, po.passing, po.defensive_iq as \"defensiveIQ\", po.offensive_iq as \"offensiveIQ\", po.speed, po.agility, po.vertical, po.strength, po.free_throw as \"freeThrow\", po.steal, po.block, po.stamina, po.shot_tendency as \"shotTendency\" from player_overrides po join players p on p.id = po.player_id where po.owner_id = #{ownerId} and (p.catalog_key = #{id} or p.id::text = #{id})")
  PlayerResponse findOverride(@Param("ownerId") UUID ownerId, @Param("id") String id);

  @Select("""
      insert into players (owner_id, is_custom, name, chinese_name, initials, peak_season, peak_team, default_position, height_feet, height_inches, weight_lbs, salary_usd, archetype, bio, accent, three_point, layup, mid_range, inside_scoring, dunk, offensive_rebound, defensive_rebound, handling, passing, defensive_iq, offensive_iq, speed, agility, vertical, strength, free_throw, steal, block, stamina, shot_tendency)
      values (#{ownerId}, true, #{p.name}, #{p.chineseName}, #{p.initials}, #{p.peakSeason}, #{p.peakTeam}, cast(#{p.defaultPosition} as court_position), #{p.heightFeet}, #{p.heightInches}, #{p.weightLbs}, #{p.salaryUsd}, #{p.archetype}, #{p.bio}, #{p.accent}, #{p.threePoint}, #{p.layup}, #{p.midRange}, #{p.insideScoring}, #{p.dunk}, #{p.offensiveRebound}, #{p.defensiveRebound}, #{p.handling}, #{p.passing}, #{p.defensiveIQ}, #{p.offensiveIQ}, #{p.speed}, #{p.agility}, #{p.vertical}, #{p.strength}, #{p.freeThrow}, #{p.steal}, #{p.block}, #{p.stamina}, #{p.shotTendency})
      returning id
      """)
  String insert(@Param("ownerId") UUID ownerId, @Param("p") PlayerPayload p);

  @Update("""
      update players set name=#{p.name}, chinese_name=#{p.chineseName}, initials=#{p.initials}, peak_season=#{p.peakSeason}, peak_team=#{p.peakTeam}, default_position=cast(#{p.defaultPosition} as court_position), height_feet=#{p.heightFeet}, height_inches=#{p.heightInches}, weight_lbs=#{p.weightLbs}, salary_usd=#{p.salaryUsd}, archetype=#{p.archetype}, bio=#{p.bio}, accent=#{p.accent}, three_point=#{p.threePoint}, layup=#{p.layup}, mid_range=#{p.midRange}, inside_scoring=#{p.insideScoring}, dunk=#{p.dunk}, offensive_rebound=#{p.offensiveRebound}, defensive_rebound=#{p.defensiveRebound}, handling=#{p.handling}, passing=#{p.passing}, defensive_iq=#{p.defensiveIQ}, offensive_iq=#{p.offensiveIQ}, speed=#{p.speed}, agility=#{p.agility}, vertical=#{p.vertical}, strength=#{p.strength}, free_throw=#{p.freeThrow}, steal=#{p.steal}, block=#{p.block}, stamina=#{p.stamina}, shot_tendency=#{p.shotTendency}, updated_at=now()
      where id=cast(#{id} as uuid) and is_custom=true and owner_id=#{ownerId}
      """)
  int updateCustom(@Param("id") String id, @Param("ownerId") UUID ownerId, @Param("p") PlayerPayload p);

  @Update("""
      insert into player_overrides (owner_id, player_id, name, initials, peak_season, peak_team, default_position, height_feet, height_inches, weight_lbs, salary_usd, archetype, bio, accent, three_point, layup, mid_range, inside_scoring, dunk, offensive_rebound, defensive_rebound, handling, passing, defensive_iq, offensive_iq, speed, agility, vertical, strength, free_throw, steal, block, stamina, shot_tendency)
      select #{ownerId}, id, name, initials, #{p.peakSeason}, #{p.peakTeam}, cast(#{p.defaultPosition} as court_position), height_feet, height_inches, weight_lbs, #{p.salaryUsd}, #{p.archetype}, #{p.bio}, #{p.accent}, #{p.threePoint}, #{p.layup}, #{p.midRange}, #{p.insideScoring}, #{p.dunk}, #{p.offensiveRebound}, #{p.defensiveRebound}, #{p.handling}, #{p.passing}, #{p.defensiveIQ}, #{p.offensiveIQ}, #{p.speed}, #{p.agility}, #{p.vertical}, #{p.strength}, #{p.freeThrow}, #{p.steal}, #{p.block}, #{p.stamina}, #{p.shotTendency} from players where catalog_key=#{id} or id::text=#{id}
      on conflict (owner_id, player_id) do update set name=excluded.name, initials=excluded.initials, peak_season=excluded.peak_season, peak_team=excluded.peak_team, default_position=excluded.default_position, height_feet=excluded.height_feet, height_inches=excluded.height_inches, weight_lbs=excluded.weight_lbs, salary_usd=excluded.salary_usd, archetype=excluded.archetype, bio=excluded.bio, accent=excluded.accent, three_point=excluded.three_point, layup=excluded.layup, mid_range=excluded.mid_range, inside_scoring=excluded.inside_scoring, dunk=excluded.dunk, offensive_rebound=excluded.offensive_rebound, defensive_rebound=excluded.defensive_rebound, handling=excluded.handling, passing=excluded.passing, defensive_iq=excluded.defensive_iq, offensive_iq=excluded.offensive_iq, speed=excluded.speed, agility=excluded.agility, vertical=excluded.vertical, strength=excluded.strength, free_throw=excluded.free_throw, steal=excluded.steal, block=excluded.block, stamina=excluded.stamina, shot_tendency=excluded.shot_tendency, updated_at=now()
      """)
  int upsertOverride(@Param("id") String id, @Param("ownerId") UUID ownerId, @Param("p") PlayerPayload p);
}
