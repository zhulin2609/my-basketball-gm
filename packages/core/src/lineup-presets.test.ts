import { describe, expect, it } from 'vitest';
import {
  CLASSIC_LINEUP_CLIENT_KEY,
  createClassicLineup,
  createStarterLineup,
} from './lineup-presets';

const input = {
  id: CLASSIC_LINEUP_CLIENT_KEY,
  name: '经典五人',
  description: '内置示例',
  now: '2026-01-01T00:00:00.000Z',
};

describe('built-in lineup presets', () => {
  it('keeps the classic lineup on its historical client key with five covering starters', () => {
    const lineup = createClassicLineup(input);

    expect(lineup.id).toBe('classic-five');
    expect(lineup.name).toBe('经典五人');
    expect(lineup.members.map((member) => member.playerId)).toEqual([
      'magic',
      'kobe',
      'bird',
      'garnett',
      'olajuwon',
    ]);
    expect(lineup.members.map((member) => member.position)).toEqual(['PG', 'SG', 'SF', 'PF', 'C']);
    expect(lineup.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('creates the starter lineup with caller-provided copy and identity', () => {
    const lineup = createStarterLineup({ ...input, id: 'fresh-uuid', name: '我的梦之队' });

    expect(lineup.id).toBe('fresh-uuid');
    expect(lineup.name).toBe('我的梦之队');
    expect(lineup.members.map((member) => member.playerId)).toEqual([
      'curry',
      'jordan',
      'lebron',
      'duncan',
      'shaq',
    ]);
  });
});
