import { describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import { createGuestImportRequest, GuestImportDataError } from './guest-import';
import type { GuestWorkspace } from './guest-workspace';

const createdAt = '2026-09-17T00:00:00.000Z';
const samplePlayer = players[0];

const workspace: GuestWorkspace = {
  id: '1bc689f7-4578-4ca3-8afd-21d2382e187e',
  schemaVersion: 1,
  createdAt,
  updatedAt: createdAt,
  hasUserProgress: true,
  players: [],
  lineups: [
    {
      id: 'home',
      name: 'Home team',
      description: '',
      members: [],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'away',
      name: 'Away team',
      description: '',
      members: [],
      createdAt,
      updatedAt: createdAt,
    },
  ],
  simulations: [
    {
      id: 'report',
      homeLineupId: 'home',
      awayLineupId: 'away',
      seed: 42,
      homeScore: 101,
      awayScore: 99,
      homeStats: [
        {
          playerId: samplePlayer.id,
          minutes: 30,
          points: 20,
          rebounds: 6,
          assists: 8,
          steals: 1,
          blocks: 0,
          fgMade: 8,
          fgAttempted: 14,
          threeMade: 2,
          threeAttempted: 5,
        },
      ],
      awayStats: [],
      createdAt,
      expiresAt: '2026-10-17T00:00:00.000Z',
    },
  ],
};

describe('guest import request', () => {
  it('uses current player and lineup data to complete legacy report snapshots', () => {
    const request = createGuestImportRequest(workspace, [samplePlayer]);

    expect(request.guestWorkspaceId).toBe(workspace.id);
    expect(request.simulations[0]).toMatchObject({
      homeLineupName: 'Home team',
      awayLineupName: 'Away team',
      engineVersion: 'v1',
      homeStats: [
        {
          playerId: samplePlayer.id,
          playerName: samplePlayer.name,
          playerInitials: samplePlayer.initials,
          playerAccent: samplePlayer.accent,
        },
      ],
    });
  });

  it('reports the missing snapshot field without discarding the workspace', () => {
    const unknownPlayerWorkspace: GuestWorkspace = {
      ...workspace,
      simulations: [
        {
          ...workspace.simulations[0],
          homeStats: [{ ...workspace.simulations[0].homeStats[0], playerId: 'unknown-player' }],
        },
      ],
    };

    try {
      createGuestImportRequest(unknownPlayerWorkspace, [samplePlayer]);
      throw new Error('expected createGuestImportRequest to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(GuestImportDataError);
      expect((error as GuestImportDataError).field).toBe('playerName');
    }
  });
});
