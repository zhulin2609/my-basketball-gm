import { describe, expect, it } from 'vitest';
import { validateLineup } from '@/lib/lineup-validation';
import type { Lineup } from '@/types';

const createLineup = (members: Lineup['members']): Lineup => ({
  id: 'test-lineup',
  name: '测试阵容',
  description: '',
  members,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('validateLineup', () => {
  it('rejects a lineup that has six active starters even when all positions are covered', () => {
    const lineup = createLineup([
      { playerId: 'curry', position: 'PG', starter: true, inactive: false },
      { playerId: 'jordan', position: 'SG', starter: true, inactive: false },
      { playerId: 'lebron', position: 'SF', starter: true, inactive: false },
      { playerId: 'duncan', position: 'PF', starter: true, inactive: false },
      { playerId: 'shaq', position: 'C', starter: true, inactive: false },
      { playerId: 'magic', position: 'PG', starter: true, inactive: false },
    ]);

    expect(validateLineup(lineup).isStarterFormationValid).toBe(false);
  });
});
