import { describe, expect, it } from 'vitest';
import { players } from './data/players';
import { createClassicLineup, createStarterLineup } from './lineup-presets';
import { validateLineup } from './lineup-validation';
import {
  MatchupValidationError,
  validateMatchup,
  type MatchupIssueCode,
} from './matchup-validation';
import { simulate } from './simulator';
import type { Lineup } from './types';

const now = '2026-11-01T00:00:00.000Z';
const home = () => createStarterLineup({ id: 'home', name: '主队', description: '', now });
const away = () => createClassicLineup({ id: 'away', name: '客队', description: '', now });
const context = { id: 'report', seed: 42, now: new Date(now) };

function withBench(count: number, activeCount: number): Lineup {
  const lineup = home();
  const starterIds = new Set(lineup.members.map((member) => member.playerId));
  const bench = players.filter((player) => !starterIds.has(player.id)).slice(0, count - 5);
  lineup.members.push(
    ...bench.map((player, index) => ({
      playerId: player.id,
      position: player.defaultPosition,
      starter: false,
      inactive: index + 5 >= activeCount,
    })),
  );
  return lineup;
}

interface InvalidCase {
  name: string;
  lineup: () => Lineup;
  code: MatchupIssueCode;
}

const invalidCases: InvalidCase[] = [
  ...[0, 1, 2, 3, 4].map((count): InvalidCase => ({
    name: `${count} 名成员`,
    lineup: () => ({ ...home(), members: home().members.slice(0, count) }),
    code: 'memberCount',
  })),
  {
    name: '全部非激活',
    lineup: () => ({ ...home(), members: home().members.map((m) => ({ ...m, inactive: true })) }),
    code: 'starterFormation',
  },
  {
    name: '全部替补',
    lineup: () => ({ ...home(), members: home().members.map((m) => ({ ...m, starter: false })) }),
    code: 'starterFormation',
  },
  {
    name: '四名首发',
    lineup: () => ({
      ...home(),
      members: home().members.map((m, i) => ({ ...m, starter: i < 4 })),
    }),
    code: 'starterFormation',
  },
  {
    name: '六名首发',
    lineup: () => ({
      ...home(),
      members: withBench(6, 6).members.map((m) => ({ ...m, starter: true })),
    }),
    code: 'starterFormation',
  },
  {
    name: '首发位置重复且缺少 C',
    lineup: () => ({
      ...home(),
      members: home().members.map((m, i) => ({ ...m, position: i === 4 ? 'PG' : m.position })),
    }),
    code: 'starterFormation',
  },
  {
    name: '重复球员',
    lineup: () => ({
      ...home(),
      members: home().members.map((m, i) => ({ ...m, playerId: i === 4 ? 'curry' : m.playerId })),
    }),
    code: 'duplicatePlayers',
  },
  { name: '十四名激活球员', lineup: () => withBench(14, 14), code: 'activeCount' },
  { name: '十六名成员', lineup: () => withBench(16, 13), code: 'memberCount' },
  {
    name: '球员引用丢失',
    lineup: () => ({
      ...home(),
      members: home().members.map((m, i) => ({
        ...m,
        playerId: i === 4 ? 'unavailable-player' : m.playerId,
      })),
    }),
    code: 'missingPlayer',
  },
];

describe.each(['home', 'away'] as const)('%s 参赛资格', (side) => {
  it.each(invalidCases)('$name：界面校验与真实引擎一致拒绝', ({ lineup, code }) => {
    const invalid = { ...lineup(), id: side, name: '不合格阵容' };
    const h = side === 'home' ? invalid : home();
    const a = side === 'away' ? invalid : away();
    if (code !== 'missingPlayer')
      expect(validateLineup(invalid).isEligibleForSimulation).toBe(false);
    expect(validateMatchup(h, a, players)).toEqual({ code, side, lineupName: invalid.name });
    expect(() => simulate(h, a, players, context)).toThrow(MatchupValidationError);
    expect(() => simulate(h, a, players, context)).toThrow(new RegExp(code));
  });
});

describe('对战双方与人数边界', () => {
  it('拒绝丢失的选择及相同阵容 ID', () => {
    expect(validateMatchup(undefined, away(), players)?.code).toBe('missingLineup');
    expect(validateMatchup(home(), undefined, players)?.code).toBe('missingLineup');
    expect(validateMatchup(home(), home(), players)?.code).toBe('sameLineup');
    expect(() => simulate(home(), home(), players, context)).toThrow(MatchupValidationError);
  });

  it.each([5, 15])('%s 人的合格阵容保留真实统计规则', (count) => {
    const h = withBench(count, Math.min(count, 13));
    expect(validateMatchup(h, away(), players)).toBeNull();
    const report = simulate(h, away(), players, context);
    expect(report.homeStats).toHaveLength(Math.min(count, 13));
    for (const stats of [report.homeStats, report.awayStats]) {
      expect(stats.reduce((sum, row) => sum + row.minutes, 0)).toBe(240);
      expect(stats.every((row) => row.minutes > 0 && row.minutes <= 48)).toBe(true);
    }
    const inactiveIds = h.members.filter((m) => m.inactive).map((m) => m.playerId);
    expect(report.homeStats.some((row) => inactiveIds.includes(row.playerId))).toBe(false);
  });
});
