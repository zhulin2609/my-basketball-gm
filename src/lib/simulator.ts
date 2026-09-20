import type { Lineup, Player, PlayerStat, Simulation } from '@/types';

// 线性同余随机数：相同 seed 会产生相同随机序列，因此战报可以被复现与分享。
const seeded = (seed: number) => {
  let n = seed >>> 0;
  return () => (n = (n * 1664525 + 1013904223) >>> 0) / 4294967296;
};
// 非激活球员不会获得分钟数，也不会出现在技术统计中。
const active = (lineup: Lineup) => lineup.members.filter((item) => !item.inactive);

// 球队总上场时间 = 240 + 25 × 加时次数（48 分钟 × 5 人，每次加时 5 分钟 × 5 人）。
// 单人上场时间上限 = 48 + 5 × 加时次数。
// V1 不提供加时战报，加时次数恒为 0；公式保留在参数里，未来支持加时时直接传入。
const REGULATION_TEAM_MINUTES = 240;
const OVERTIME_TEAM_MINUTES = 25;
const REGULATION_PLAYER_MINUTES = 48;
const OVERTIME_PLAYER_MINUTES = 5;

// 最大余数法把球队总分钟归一化到目标值：先按原始分钟的比例取整并钳制到单人上限，
// 余数按小数部分从大到小分配给未达到上限的球员。平手按数组顺序，保证同一种子结果可复现。
function distributeTeamMinutes(rawMinutes: number[], overtimePeriods: number): number[] {
  const target = REGULATION_TEAM_MINUTES + OVERTIME_TEAM_MINUTES * overtimePeriods;
  const playerCap = REGULATION_PLAYER_MINUTES + OVERTIME_PLAYER_MINUTES * overtimePeriods;
  const rawTotal = rawMinutes.reduce((sum, value) => sum + value, 0);
  if (rawTotal <= 0) return rawMinutes;
  const bases = rawMinutes.map((value) =>
    Math.min(playerCap, Math.max(1, Math.floor((value * target) / rawTotal))),
  );
  let remainder = target - bases.reduce((sum, value) => sum + value, 0);
  const order = rawMinutes
    .map((value, index) => ({
      index,
      fraction: (value * target) / rawTotal - bases[index],
    }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const result = [...bases];
  let progress = true;
  while (remainder > 0 && progress) {
    progress = false;
    for (const entry of order) {
      if (remainder <= 0) break;
      if (result[entry.index] < playerCap) {
        result[entry.index] += 1;
        remainder -= 1;
        progress = true;
      }
    }
  }
  return result;
}

function makeStats(
  lineup: Lineup,
  playerMap: Map<string, Player>,
  rand: () => number,
): PlayerStat[] {
  // 统计模型 V1：按出手倾向分配球队出手，再用能力值和随机数生成个人数据。
  const members = active(lineup);
  const totalUsage = members.reduce(
    (sum, m) => sum + (playerMap.get(m.playerId)?.shotTendency ?? 70),
    0,
  );
  // 先按角色生成原始分钟并归一化，派生统计全部基于归一化后的分钟，保持数据内部一致。
  const rawMinutes = members.map((member) =>
    Math.max(10, Math.round((member.starter ? 32 : 18) + (rand() - 0.5) * 8)),
  );
  const minutesList = distributeTeamMinutes(rawMinutes, 0);
  return members
    .map((member, index) => {
      const p = playerMap.get(member.playerId)!;
      const minutes = minutesList[index];
      // 48 is a team-level shot budget distributed by offensive role; the remainder is
      // represented by the small random term and free throws, keeping V1 scores credible.
      const share = p.shotTendency / totalUsage;
      const attempts = Math.max(3, Math.round(48 * share * (minutes / 30) + rand() * 3));
      const threeAttempted = Math.min(
        attempts,
        Math.round(attempts * (0.13 + p.threePoint / 180) * (0.8 + rand() * 0.4)),
      );
      const threeMade = Math.min(
        threeAttempted,
        Math.round(threeAttempted * (0.24 + p.threePoint / 210) * (0.88 + rand() * 0.24)),
      );
      const twoAttempted = attempts - threeAttempted;
      const finishing = (p.layup + p.midRange + p.insideScoring) / 3;
      const twoMade = Math.min(
        twoAttempted,
        Math.round(twoAttempted * (0.31 + finishing / 260) * (0.9 + rand() * 0.2)),
      );
      const freeThrows = Math.round((p.shotTendency / 26 + rand() * 3) * (p.freeThrow / 100));
      return {
        playerId: p.id,
        playerName: p.name,
        playerInitials: p.initials,
        playerAccent: p.accent,
        minutes,
        points: twoMade * 2 + threeMade * 3 + freeThrows,
        rebounds: Math.max(
          0,
          Math.round(
            ((p.offensiveRebound + p.defensiveRebound) / 2 / 12) * (minutes / 30) * (0.55 + rand()),
          ),
        ),
        assists: Math.max(0, Math.round((p.passing / 18) * (minutes / 30) * (0.5 + rand()))),
        steals: Math.max(0, Math.round((p.steal / 62) * (minutes / 30) * (0.4 + rand()))),
        blocks: Math.max(0, Math.round((p.block / 56) * (minutes / 30) * (0.3 + rand()))),
        fgMade: twoMade + threeMade,
        fgAttempted: attempts,
        threeMade,
        threeAttempted,
      };
    })
    .sort((a, b) => b.points - a.points);
}

export function simulate(
  home: Lineup,
  away: Lineup,
  source: Player[],
  seed = Math.floor(Math.random() * 2 ** 31),
): Simulation {
  // playerMap 将多次按 ID 查找从数组扫描降为常数时间；两队共享同一随机序列。
  const map = new Map(source.map((p) => [p.id, p]));
  const rand = seeded(seed);
  const homeStats = makeStats(home, map, rand);
  const awayStats = makeStats(away, map, rand);
  let homeScore = homeStats.reduce((sum, stat) => sum + stat.points, 0);
  let awayScore = awayStats.reduce((sum, stat) => sum + stat.points, 0);
  // V1 不提供加时战报，因此平局时用一次可复现的随机选择决出 3 分胜者。
  if (homeScore === awayScore) {
    if (rand() > 0.5) homeScore += 3;
    else awayScore += 3;
  }
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: crypto.randomUUID(),
    homeLineupId: home.id,
    awayLineupId: away.id,
    homeLineupName: home.name,
    awayLineupName: away.name,
    seed,
    homeScore,
    awayScore,
    homeStats,
    awayStats,
    engineVersion: 'v1',
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}
