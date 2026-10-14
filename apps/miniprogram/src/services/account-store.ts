import type { Lineup, Player, Simulation } from '@dream-court/core';
import type { ApiClient, AuthUser, Clock, IdGenerator, StoragePort } from '@dream-court/client';
import { validateLineup } from '@dream-court/core';
import type { DataSnapshot, DataStore } from './data-store';
import { validateDraft } from './guest-store';

export interface AccountStoreDeps {
  api: ApiClient;
  storage: StoragePort;
  id: IdGenerator;
  clock: Clock;
  user: AuthUser;
}

/**
 * 登录账号的数据源：阵容与战报读取自服务器，修改经 API 顺序写入。
 * 同一账号的写操作串行执行，较早的响应不会覆盖较晚的编辑。
 * 草稿保存在本机，按账号 ID 隔离。
 */
export async function createAccountStore(deps: AccountStoreDeps): Promise<DataStore> {
  const draftsKey = `dream-court.lineup-drafts.v1.account.${deps.user.id}`;
  // 战报有效期在服务端校验之外再由本地按当前时间过滤，避免缓存中的过期内容继续展示。
  const activeReports = (reports: Simulation[]) =>
    reports.filter((report) => Date.parse(report.expiresAt) > deps.clock().getTime());
  const [players, lineups, reports] = await Promise.all([
    deps.api.listPlayers(),
    deps.api.listLineups(),
    listAllSimulations(deps.api),
  ]);

  let snapshot: DataSnapshot = {
    source: 'account',
    players,
    lineups,
    reports: activeReports(reports),
    hasUserProgress: true,
    user: deps.user,
  };
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const readDrafts = (): Record<string, Lineup> => {
    const saved = deps.storage.getItem(draftsKey);
    return saved === null ? {} : (JSON.parse(saved) as Record<string, Lineup>);
  };

  let queue: Promise<void> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  const refresh = async () => {
    const [nextPlayers, nextLineups, nextReports] = await Promise.all([
      deps.api.listPlayers(),
      deps.api.listLineups(),
      listAllSimulations(deps.api),
    ]);
    snapshot = {
      ...snapshot,
      players: nextPlayers,
      lineups: nextLineups,
      reports: activeReports(nextReports),
    };
    notify();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh,
    createLineup: () =>
      enqueue(async () => {
        const now = deps.clock().toISOString();
        const created: Lineup = {
          id: deps.id(),
          name: '新阵容',
          description: '',
          members: [],
          createdAt: now,
          updatedAt: now,
        };
        const saved = await deps.api.saveLineup(created);
        snapshot = { ...snapshot, lineups: [saved, ...snapshot.lineups] };
        notify();
        return saved;
      }),
    saveLineup: (lineup) =>
      enqueue(async () => {
        validateDraft(lineup, snapshot.players);
        const submitted = JSON.stringify(lineup);
        const saved = await deps.api.saveLineup({
          ...lineup,
          updatedAt: deps.clock().toISOString(),
        });
        // 保存期间可能已有更新的编辑写入草稿；只有草稿仍是本次提交的内容时才清理。
        const drafts = readDrafts();
        if (drafts[lineup.id] && JSON.stringify(drafts[lineup.id]) === submitted) {
          delete drafts[lineup.id];
          deps.storage.setItem(draftsKey, JSON.stringify(drafts));
        }
        const exists = snapshot.lineups.some((item) => item.id === saved.id);
        snapshot = {
          ...snapshot,
          lineups: exists
            ? snapshot.lineups.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...snapshot.lineups],
        };
        notify();
      }),
    readDraft: (id) => readDrafts()[id] ?? null,
    saveDraft: (lineup) => {
      deps.storage.setItem(draftsKey, JSON.stringify({ ...readDrafts(), [lineup.id]: lineup }));
      notify();
    },
    runBattle: (homeId, awayId) =>
      enqueue(async () => {
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
        const report = await deps.api.simulate(homeId, awayId, 'local');
        snapshot = { ...snapshot, reports: [report, ...snapshot.reports] };
        notify();
        return report;
      }),
  };
}

/** 分页读取账号全部有效历史战报，不使用固定上限截断。 */
async function listAllSimulations(api: ApiClient): Promise<Simulation[]> {
  const all: Simulation[] = [];
  for (let offset = 0; ; offset += 30) {
    const page = await api.listSimulations(offset);
    all.push(...page);
    if (page.length < 30) return all;
  }
}
