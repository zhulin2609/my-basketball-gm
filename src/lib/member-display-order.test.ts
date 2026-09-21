import { describe, expect, it } from 'vitest';
import type { Position } from '@/types';
import { orderMembersForDisplay } from '@/lib/member-display-order';

interface FixtureMember {
  playerId: string;
  position: Position;
  starter: boolean;
  inactive: boolean;
}

const member = (
  playerId: string,
  position: Position,
  starter: boolean,
  inactive = false,
): FixtureMember => ({ playerId, position, starter, inactive });

describe('orderMembersForDisplay', () => {
  it('puts active starters first in court order and keeps the bench in original order', () => {
    const members = [
      member('jordan', 'SG', true),
      member('kobe', 'SG', false),
      member('payton', 'PG', true),
      member('paul', 'PG', false),
      member('duncan', 'C', false),
      member('garnett', 'PF', true),
      member('pippen', 'SF', false),
      member('olajuwon', 'C', true),
      member('bird', 'SF', true),
    ];

    expect(orderMembersForDisplay(members).map((entry) => entry.playerId)).toEqual([
      'olajuwon',
      'garnett',
      'bird',
      'jordan',
      'payton',
      'kobe',
      'paul',
      'duncan',
      'pippen',
    ]);
  });

  it('treats inactive starters as bench and keeps the input array untouched', () => {
    const members = [
      member('jordan', 'SG', true),
      member('shaq', 'C', true, true),
      member('curry', 'PG', true),
    ];

    expect(orderMembersForDisplay(members).map((entry) => entry.playerId)).toEqual([
      'jordan',
      'curry',
      'shaq',
    ]);
    expect(members.map((entry) => entry.playerId)).toEqual(['jordan', 'shaq', 'curry']);
  });
});
