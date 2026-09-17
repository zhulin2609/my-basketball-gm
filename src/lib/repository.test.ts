// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { guestWorkspaceRepository } from '@/lib/guest-workspace';
import { bootstrapLineups, lineupRepository } from '@/lib/repository';

describe('guest repositories', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds playable lineups without treating examples as user progress', () => {
    const lineups = bootstrapLineups();

    expect(lineups).toHaveLength(2);
    expect(guestWorkspaceRepository.load().hasUserProgress).toBe(false);
  });

  it('records a user lineup change in the shared guest workspace', () => {
    const [lineup] = bootstrapLineups();

    lineupRepository.save({ ...lineup, name: 'My lineup' });

    expect(guestWorkspaceRepository.load()).toMatchObject({
      hasUserProgress: true,
      lineups: [expect.objectContaining({ name: 'My lineup' }), expect.any(Object)],
    });
  });
});
