import {
  CLASSIC_LINEUP_CLIENT_KEY,
  createClassicLineup,
  createStarterLineup,
  mergePlayerCatalog,
  simulate,
  validateLineup,
  type Lineup,
  type LineupMember,
  type Player,
  type Simulation,
} from '@dream-court/core';
import {
  createGuestRepositories,
  type GuestWorkspaceDeps,
  type RandomSeed,
} from '@dream-court/client';
import type { DataSnapshot } from './data-store';

const DRAFTS_KEY = 'dream-court.lineup-drafts.v1';

/** 游客草稿与游客工作区同属一份本地数据：成功导入后一并清理。 */
export function clearGuestDrafts(storage: { removeItem(key: string): void }): void {
  storage.removeItem(DRAFTS_KEY);
}

export type GuestSnapshot = DataSnapshot;

export interface GuestStoreDeps extends GuestWorkspaceDeps {
  catalog: Player[];
  randomSeed: RandomSeed;
}

export interface GuestStore {
  getSnapshot(): GuestSnapshot;
  subscribe(listener: () => void): () => void;
  refresh(): void;
  createLineup(): Lineup;
  saveLineup(lineup: Lineup): void;
  readDraft(id: string): Lineup | null;
  saveDraft(lineup: Lineup): void;
  runBattle(homeId: string, awayId: string): Simulation;
}

export type LineupEditorState =
  { status: 'ready'; lineup: Lineup; dirty: boolean } | { status: 'failed'; error: unknown };

/** 读取草稿只需要同步存储入口，游客与账号数据源都满足。 */
export function loadLineupEditor(
  store: { readDraft(id: string): Lineup | null },
  initial: Lineup,
): LineupEditorState {
  try {
    const draft = store.readDraft(initial.id);
    return { status: 'ready', lineup: draft ?? initial, dirty: Boolean(draft) };
  } catch (error: unknown) {
    return { status: 'failed', error };
  }
}

export function getLineupStarterIds(lineup: Lineup): Set<string> {
  return new Set(
    lineup.members.filter((member) => member.starter).map((member) => member.playerId),
  );
}

export function getLineupMembersForDisplay(
  lineup: Lineup,
  starterIds: ReadonlySet<string>,
): LineupMember[] {
  return [
    ...lineup.members.filter((member) => starterIds.has(member.playerId)),
    ...lineup.members.filter((member) => !starterIds.has(member.playerId)),
  ];
}

export function validateDraft(lineup: Lineup, players: Player[]): void {
  if (!lineup.name.trim() || lineup.name.length > 120) {
    throw new Error('阵容名称不能为空，最多 120 个字符');
  }
  if (lineup.description.length > 1000) throw new Error('阵容描述最多 1000 个字符');
  const validation = validateLineup(lineup);
  if (validation.hasDuplicatePlayers) throw new Error('同一球员只能加入一次');
  if (lineup.members.length > 15) throw new Error('阵容最多 15 人');
  if (validation.activeCount > 13) throw new Error('激活球员最多 13 人');
  if (validation.starterCount > 5) throw new Error('首发球员最多 5 人');
  if (lineup.members.some((member) => member.inactive && member.starter)) {
    throw new Error('非激活球员不能设为首发');
  }
  if (lineup.members.some((member) => !players.some((player) => player.id === member.playerId))) {
    throw new Error('阵容包含无法读取的球员');
  }
}

export function addLineupMember(lineup: Lineup, player: Player): Lineup {
  if (lineup.members.some((member) => member.playerId === player.id)) {
    throw new Error('同一球员只能加入一次');
  }
  if (lineup.members.length >= 15) throw new Error('阵容最多 15 人');
  const activeCount = lineup.members.filter((member) => !member.inactive).length;
  const member: LineupMember = {
    playerId: player.id,
    position: player.defaultPosition,
    starter: false,
    inactive: activeCount >= 13,
  };
  return { ...lineup, members: [...lineup.members, member] };
}

export function changeLineupMember(
  lineup: Lineup,
  playerId: string,
  changes: Partial<LineupMember>,
): Lineup {
  return {
    ...lineup,
    members: lineup.members.map((member) =>
      member.playerId === playerId ? { ...member, ...changes } : member,
    ),
  };
}

export type LineupMemberToggle = 'active' | 'starter';

export type LineupMemberToggleResult =
  | { status: 'changed'; lineup: Lineup; toast?: string }
  | { status: 'unchanged' }
  | { status: 'blocked'; toast: string; message: string };

export function setLineupMemberToggle(
  lineup: Lineup,
  playerId: string,
  toggle: LineupMemberToggle,
  enabled: boolean,
): LineupMemberToggleResult {
  const member = lineup.members.find((item) => item.playerId === playerId);
  if (!member) throw new Error(`无法读取阵容球员：${playerId}`);
  const checked = toggle === 'starter' ? member.starter : !member.inactive;
  if (checked === enabled) return { status: 'unchanged' };

  if (enabled) {
    if (toggle === 'starter' && lineup.members.filter((item) => item.starter).length >= 5) {
      return {
        status: 'blocked',
        toast: '首发人数已达上限',
        message: '最多设置 5 名首发，请先取消其他球员的首发状态',
      };
    }
    if (member.inactive && lineup.members.filter((item) => !item.inactive).length >= 13) {
      return {
        status: 'blocked',
        toast: '激活人数已达上限',
        message: '最多激活 13 名球员，请先取消其他球员的激活状态',
      };
    }
  }

  const changes =
    toggle === 'starter'
      ? { starter: enabled, inactive: enabled ? false : member.inactive }
      : { inactive: !enabled, starter: enabled ? member.starter : false };
  return {
    status: 'changed',
    lineup: changeLineupMember(lineup, playerId, changes),
    toast: toggle === 'starter' && enabled && member.inactive ? '已激活并设为首发' : undefined,
  };
}

export function removeLineupMember(lineup: Lineup, playerId: string): Lineup {
  return { ...lineup, members: lineup.members.filter((member) => member.playerId !== playerId) };
}

export function createGuestStore(deps: GuestStoreDeps): GuestStore {
  const repositories = createGuestRepositories(deps);
  if (!repositories.lineups.list().length) {
    const now = deps.clock().toISOString();
    repositories.bootstrap([
      createStarterLineup({ id: deps.id(), name: '梦幻首发', description: '跨时代明星阵容', now }),
      createClassicLineup({
        id: CLASSIC_LINEUP_CLIENT_KEY,
        name: '经典五人',
        description: '五个位置的经典搭配',
        now,
      }),
    ]);
  }

  const listeners = new Set<() => void>();
  const readSnapshot = (): GuestSnapshot => ({
    source: 'guest',
    players: mergePlayerCatalog(deps.catalog, repositories.players.list()),
    lineups: repositories.lineups.list(),
    reports: repositories.simulations.list(),
    hasUserProgress: repositories.workspace.load().hasUserProgress,
    user: null,
  });
  let snapshot = readSnapshot();
  const refresh = () => {
    snapshot = readSnapshot();
    listeners.forEach((listener) => listener());
  };
  const readDrafts = (): Record<string, Lineup> => {
    const saved = deps.storage.getItem(DRAFTS_KEY);
    return saved === null ? {} : (JSON.parse(saved) as Record<string, Lineup>);
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh,
    createLineup() {
      const now = deps.clock().toISOString();
      const lineup: Lineup = {
        id: deps.id(),
        name: '新阵容',
        description: '',
        members: [],
        createdAt: now,
        updatedAt: now,
      };
      repositories.lineups.save(lineup);
      refresh();
      return lineup;
    },
    saveLineup(lineup) {
      validateDraft(lineup, snapshot.players);
      const drafts = readDrafts();
      delete drafts[lineup.id];
      repositories.lineups.save({ ...lineup, updatedAt: deps.clock().toISOString() });
      deps.storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      refresh();
    },
    readDraft(id) {
      return readDrafts()[id] ?? null;
    },
    saveDraft(lineup) {
      deps.storage.setItem(DRAFTS_KEY, JSON.stringify({ ...readDrafts(), [lineup.id]: lineup }));
      snapshot = { ...snapshot };
      listeners.forEach((listener) => listener());
    },
    runBattle(homeId, awayId) {
      refresh();
      if (homeId === awayId) throw new Error('请选择两套不同的阵容');
      if (readDrafts()[homeId] || readDrafts()[awayId]) {
        throw new Error('请先进入阵容编辑页面，完成草稿保存');
      }
      const home = snapshot.lineups.find((lineup) => lineup.id === homeId);
      const away = snapshot.lineups.find((lineup) => lineup.id === awayId);
      if (!home || !away) throw new Error('所选阵容已经无法读取');
      for (const lineup of [home, away]) {
        validateDraft(lineup, snapshot.players);
        if (!validateLineup(lineup).isEligibleForSimulation) {
          throw new Error(`${lineup.name}需要五名首发，覆盖 PG、SG、SF、PF、C`);
        }
      }
      const report = simulate(home, away, snapshot.players, {
        id: deps.id(),
        seed: deps.randomSeed(),
        now: deps.clock(),
      });
      repositories.simulations.save(report);
      refresh();
      return report;
    },
  };
}
