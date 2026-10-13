import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import {
  addLineupMember,
  changeLineupMember,
  createGuestStore,
  getLineupMembersForDisplay,
  getLineupStarterIds,
  loadLineupEditor,
  setLineupMemberToggle,
  validateDraft,
} from './guest-store';
import { createDiskStorage } from './testing/disk-storage';

function createScenario() {
  const { storage } = createDiskStorage();
  let now = new Date('2026-10-04T08:00:00Z');
  const deps = {
    storage,
    catalog: players,
    id: randomUUID,
    clock: () => now,
    randomSeed: () => 314159,
  };
  return {
    deps,
    store: createGuestStore(deps),
    advance: (date: string) => {
      now = new Date(date);
    },
  };
}

describe('小程序游客工作区', () => {
  function createFullLineup() {
    const scenario = createScenario();
    let lineup = scenario.store.createLineup();
    for (const player of players.slice(0, 15)) lineup = addLineupMember(lineup, player);
    for (const member of lineup.members.slice(0, 5)) {
      lineup = changeLineupMember(lineup, member.playerId, { starter: true });
    }
    scenario.store.saveLineup(lineup);
    return { ...scenario, lineup };
  }

  it('首发置顶展示保留组内顺序、原始成员和正式存储', () => {
    const { store, deps, lineup } = createFullLineup();
    const mixed = {
      ...lineup,
      members: lineup.members.map((member, index) => ({
        ...member,
        starter: [1, 3, 6, 8, 11].includes(index),
      })),
    };
    store.saveLineup(mixed);
    const original = structuredClone(mixed);
    const workspace = deps.storage.getItem('dream-court.guest-workspace.v1');
    const drafts = deps.storage.getItem('dream-court.lineup-drafts.v1');
    const restored = createGuestStore(deps);
    const saved = restored.getSnapshot().lineups.find((item) => item.id === mixed.id);
    if (!saved) throw new Error('正式阵容丢失');
    const editor = loadLineupEditor(restored, saved);
    if (editor.status !== 'ready') throw new Error('编辑状态读取失败');
    const displayed = getLineupMembersForDisplay(editor.lineup, getLineupStarterIds(editor.lineup));
    expect(displayed).toEqual(
      [1, 3, 6, 8, 11, 0, 2, 4, 5, 7, 9, 10, 12, 13, 14].map((index) => mixed.members[index]),
    );
    expect(displayed.slice(0, 5).every((member) => member.starter)).toBe(true);
    expect(editor.dirty).toBe(false);
    expect(mixed).toEqual(original);
    expect(editor.lineup.members).toEqual(original.members);
    expect(deps.storage.getItem('dream-court.guest-workspace.v1')).toBe(workspace);
    expect(deps.storage.getItem('dream-court.lineup-drafts.v1')).toBe(drafts);
  });

  it('恢复未保存草稿时将草稿首发置顶，保留正式阵容与草稿顺序', () => {
    const { deps, lineup, store } = createFullLineup();
    const draft = {
      ...lineup,
      members: lineup.members.map((member, index) => ({
        ...member,
        starter: index >= 8 && index < 13,
      })),
    };
    store.saveDraft(draft);
    const workspace = deps.storage.getItem('dream-court.guest-workspace.v1');
    const drafts = deps.storage.getItem('dream-court.lineup-drafts.v1');
    const restored = createGuestStore(deps);
    const editor = loadLineupEditor(restored, lineup);
    if (editor.status !== 'ready') throw new Error('草稿恢复失败');
    expect(editor.dirty).toBe(true);
    expect(
      getLineupMembersForDisplay(editor.lineup, getLineupStarterIds(editor.lineup)).map(
        (member) => member.playerId,
      ),
    ).toEqual(
      [8, 9, 10, 11, 12, 0, 1, 2, 3, 4, 5, 6, 7, 13, 14].map(
        (index) => draft.members[index].playerId,
      ),
    );
    expect(restored.readDraft(lineup.id)).toEqual(draft);
    expect(deps.storage.getItem('dream-court.guest-workspace.v1')).toBe(workspace);
    expect(deps.storage.getItem('dream-court.lineup-drafts.v1')).toBe(drafts);
  });

  it('页面内切换首发保留展示位置，重新进入时使用最新首发', () => {
    const { lineup } = createFullLineup();
    const starterIds = getLineupStarterIds(lineup);
    const released = setLineupMemberToggle(lineup, lineup.members[0].playerId, 'starter', false);
    if (released.status !== 'changed') throw new Error('取消首发失败');
    const selected = setLineupMemberToggle(
      released.lineup,
      lineup.members[9].playerId,
      'starter',
      true,
    );
    if (selected.status !== 'changed') throw new Error('设置首发失败');
    expect(
      getLineupMembersForDisplay(selected.lineup, starterIds).map((member) => member.playerId),
    ).toEqual(lineup.members.map((member) => member.playerId));
    expect(
      getLineupMembersForDisplay(selected.lineup, getLineupStarterIds(selected.lineup)).map(
        (member) => member.playerId,
      ),
    ).toEqual(
      [1, 2, 3, 4, 9, 0, 5, 6, 7, 8, 10, 11, 12, 13, 14].map(
        (index) => lineup.members[index].playerId,
      ),
    );
  });

  it('没有首发及空阵容保留原顺序，移除球员不留下展示项', () => {
    const { lineup } = createFullLineup();
    const noStarters = {
      ...lineup,
      members: lineup.members.map((member) => ({ ...member, starter: false })),
    };
    expect(getLineupMembersForDisplay(noStarters, getLineupStarterIds(noStarters))).toEqual(
      noStarters.members,
    );
    expect(
      getLineupMembersForDisplay({ ...lineup, members: [] }, getLineupStarterIds(lineup)),
    ).toEqual([]);
    const removed = { ...lineup, members: lineup.members.slice(1) };
    expect(getLineupMembersForDisplay(removed, getLineupStarterIds(lineup))).toEqual(
      removed.members,
    );
  });

  it('拒绝激活第 14 名球员，返回明确原因且不修改阵容或存储', () => {
    const { store, deps, lineup } = createFullLineup();
    const original = structuredClone(lineup);
    const workspace = deps.storage.getItem('dream-court.guest-workspace.v1');
    const drafts = deps.storage.getItem('dream-court.lineup-drafts.v1');
    expect(setLineupMemberToggle(lineup, lineup.members[13].playerId, 'active', true)).toEqual({
      status: 'blocked',
      toast: '激活人数已达上限',
      message: '最多激活 13 名球员，请先取消其他球员的激活状态',
    });
    expect(lineup).toEqual(original);
    expect(deps.storage.getItem('dream-court.guest-workspace.v1')).toBe(workspace);
    expect(deps.storage.getItem('dream-court.lineup-drafts.v1')).toBe(drafts);
    expect(store.readDraft(lineup.id)).toBeNull();
  });

  it.each([5, 13])('拒绝第 6 名首发（成员索引 %i），优先提示首发限制并保留已有草稿', (index) => {
    const { store, deps, lineup } = createFullLineup();
    store.saveDraft(lineup);
    const original = structuredClone(lineup);
    const drafts = deps.storage.getItem('dream-court.lineup-drafts.v1');
    expect(setLineupMemberToggle(lineup, lineup.members[index].playerId, 'starter', true)).toEqual({
      status: 'blocked',
      toast: '首发人数已达上限',
      message: '最多设置 5 名首发，请先取消其他球员的首发状态',
    });
    expect(lineup).toEqual(original);
    expect(store.readDraft(lineup.id)).toEqual(lineup);
    expect(deps.storage.getItem('dream-court.lineup-drafts.v1')).toBe(drafts);
  });

  it('自动激活并设置首发只保存一次完整草稿，重建服务恢复，正式保存清理草稿', () => {
    const { store, deps, lineup } = createFullLineup();
    const release = setLineupMemberToggle(lineup, lineup.members[0].playerId, 'active', false);
    if (release.status !== 'changed') throw new Error('取消激活失败');
    store.saveLineup(release.lineup);
    const targetId = lineup.members[13].playerId;
    let notifications = 0;
    const observations: unknown[] = [];
    store.subscribe(() => {
      notifications += 1;
      observations.push(store.readDraft(lineup.id));
    });
    const result = setLineupMemberToggle(release.lineup, targetId, 'starter', true);
    if (result.status !== 'changed') throw new Error('自动激活首发失败');
    expect(result.toast).toBe('已激活并设为首发');
    expect(result.lineup.members.filter((member) => !member.inactive)).toHaveLength(13);
    expect(result.lineup.members.filter((member) => member.starter)).toHaveLength(5);
    expect(result.lineup.members.find((member) => member.playerId === targetId)).toMatchObject({
      starter: true,
      inactive: false,
    });
    expect(release.lineup.members[13]).toMatchObject({ starter: false, inactive: true });
    store.saveDraft(result.lineup);
    expect(notifications).toBe(1);
    expect(observations).toEqual([result.lineup]);
    const restored = createGuestStore(deps);
    const saved = restored.getSnapshot().lineups.find((item) => item.id === lineup.id);
    if (!saved) throw new Error('正式阵容丢失');
    expect(saved.members[13]).toMatchObject({ starter: false, inactive: true });
    expect(loadLineupEditor(restored, saved)).toEqual({
      status: 'ready',
      lineup: result.lineup,
      dirty: true,
    });
    restored.saveLineup(result.lineup);
    expect(restored.readDraft(lineup.id)).toBeNull();
    expect(
      createGuestStore(deps)
        .getSnapshot()
        .lineups.find((item) => item.id === lineup.id)?.members[13],
    ).toMatchObject({ starter: true, inactive: false });
  });

  it('首发有名额但激活已满时，非激活球员设置首发被拒绝并提示激活限制', () => {
    const { lineup } = createFullLineup();
    const release = setLineupMemberToggle(lineup, lineup.members[0].playerId, 'starter', false);
    if (release.status !== 'changed') throw new Error('取消首发失败');
    const original = structuredClone(release.lineup);
    expect(
      setLineupMemberToggle(release.lineup, lineup.members[13].playerId, 'starter', true),
    ).toEqual({
      status: 'blocked',
      toast: '激活人数已达上限',
      message: '最多激活 13 名球员，请先取消其他球员的激活状态',
    });
    expect(release.lineup).toEqual(original);
  });

  it('已激活球员设置首发不会增加激活人数，取消首发保留激活状态', () => {
    const { lineup } = createFullLineup();
    const release = setLineupMemberToggle(lineup, lineup.members[0].playerId, 'starter', false);
    if (release.status !== 'changed') throw new Error('取消首发失败');
    const result = setLineupMemberToggle(
      release.lineup,
      lineup.members[5].playerId,
      'starter',
      true,
    );
    if (result.status !== 'changed') throw new Error('设置首发失败');
    expect(result.toast).toBeUndefined();
    expect(result.lineup.members.filter((member) => !member.inactive)).toHaveLength(13);
    expect(result.lineup.members.filter((member) => member.starter)).toHaveLength(5);
    expect(result.lineup.members[0]).toMatchObject({ starter: false, inactive: false });
  });

  it('释放激活名额后可以重试，重新激活不会自动恢复首发', () => {
    const { lineup } = createFullLineup();
    expect(setLineupMemberToggle(lineup, lineup.members[13].playerId, 'active', true).status).toBe(
      'blocked',
    );
    const release = setLineupMemberToggle(lineup, lineup.members[0].playerId, 'active', false);
    if (release.status !== 'changed') throw new Error('取消激活失败');
    expect(release.lineup.members[0]).toMatchObject({ starter: false, inactive: true });
    const retry = setLineupMemberToggle(
      release.lineup,
      lineup.members[13].playerId,
      'active',
      true,
    );
    if (retry.status !== 'changed') throw new Error('重试激活失败');
    expect(retry.lineup.members[13]).toMatchObject({ starter: false, inactive: false });
    expect(retry.lineup.members.filter((member) => !member.inactive)).toHaveLength(13);
    const reactivate = setLineupMemberToggle(
      release.lineup,
      lineup.members[0].playerId,
      'active',
      true,
    );
    if (reactivate.status !== 'changed') throw new Error('重新激活失败');
    expect(reactivate.lineup.members[0]).toMatchObject({ starter: false, inactive: false });
  });

  it('重复设置同一状态不产生修改，缺失球员立即报错', () => {
    const { lineup } = createFullLineup();
    expect(setLineupMemberToggle(lineup, lineup.members[0].playerId, 'starter', true)).toEqual({
      status: 'unchanged',
    });
    expect(setLineupMemberToggle(lineup, lineup.members[0].playerId, 'active', true)).toEqual({
      status: 'unchanged',
    });
    expect(setLineupMemberToggle(lineup, lineup.members[13].playerId, 'starter', false)).toEqual({
      status: 'unchanged',
    });
    expect(() => setLineupMemberToggle(lineup, 'missing-player', 'starter', true)).toThrow(
      '无法读取阵容球员',
    );
  });

  it('读取已保存阵容不产生草稿，选择页面没有修改时阵容仍可用于比赛', () => {
    const { store, deps } = createScenario();
    const home = store.getSnapshot().lineups[0];
    expect(loadLineupEditor(store, home)).toEqual({ status: 'ready', lineup: home, dirty: false });
    expect(deps.storage.getItem('dream-court.lineup-drafts.v1')).toBeNull();
    expect(store.runBattle(home.id, 'classic-five').homeLineupName).toBe(home.name);
  });

  it('草稿损坏时返回读取错误并保留原始存储，恢复数据后可重新读取', () => {
    const { store, deps } = createScenario();
    const home = store.getSnapshot().lineups[0];
    const key = 'dream-court.lineup-drafts.v1';
    store.saveDraft({ ...home, name: '待保存阵容' });
    const saved = deps.storage.getItem(key);
    if (!saved) throw new Error('缺少草稿数据');
    const workspace = deps.storage.getItem('dream-court.guest-workspace.v1');
    for (const invalid of ['{', '']) {
      deps.storage.setItem(key, invalid);
      const state = loadLineupEditor(store, home);
      expect(state.status).toBe('failed');
      if (state.status !== 'failed') throw new Error('读取损坏数据应当失败');
      expect(state.error).toBeInstanceOf(SyntaxError);
      expect(() => store.saveLineup({ ...home, name: '读取失败时不能写入' })).toThrow(SyntaxError);
      expect(deps.storage.getItem(key)).toBe(invalid);
      expect(deps.storage.getItem('dream-court.guest-workspace.v1')).toBe(workspace);
    }
    deps.storage.setItem(key, saved);
    const restored = loadLineupEditor(store, home);
    expect(restored.status).toBe('ready');
    if (restored.status !== 'ready') throw new Error('草稿未恢复');
    expect(restored.lineup.name).toBe('待保存阵容');
    expect(restored.dirty).toBe(true);
  });

  it('内置阵容不计进度，连续中文编辑的草稿在重启后恢复，保存后用于比赛', () => {
    const { store, deps } = createScenario();
    expect(store.getSnapshot().players).toHaveLength(416);
    expect(store.getSnapshot().hasUserProgress).toBe(false);
    const home = store.getSnapshot().lineups[0];
    for (const name of ['', '湖', '湖人', '湖人梦幻首发']) store.saveDraft({ ...home, name });
    const restored = createGuestStore(deps);
    const draft = restored.readDraft(home.id);
    expect(draft?.name).toBe('湖人梦幻首发');
    expect(restored.getSnapshot().lineups[0].name).toBe('梦幻首发');
    expect(() => restored.runBattle(home.id, 'classic-five')).toThrow('草稿保存');
    if (!draft) throw new Error('缺少已保存草稿');
    restored.saveLineup(draft);
    expect(restored.readDraft(home.id)).toBeNull();
    expect(restored.getSnapshot().hasUserProgress).toBe(true);
    const report = restored.runBattle(home.id, 'classic-five');
    expect(report.homeLineupName).toBe('湖人梦幻首发');
    expect(report.homeStats.reduce((total, stat) => total + stat.minutes, 0)).toBe(240);
    expect(report.awayStats.reduce((total, stat) => total + stat.minutes, 0)).toBe(240);
    expect(createGuestStore(deps).getSnapshot().reports[0].id).toBe(report.id);
  });

  it('草稿保存允许不完整阵容，重复球员和人数上限在写入前校验', () => {
    const { store } = createScenario();
    const draft = store.createLineup();
    expect(() => store.runBattle(draft.id, 'classic-five')).toThrow('五名首发');
    const first = addLineupMember(draft, players[0]);
    expect(() => addLineupMember(first, players[0])).toThrow('只能加入一次');
    let full = draft;
    for (const player of players.slice(0, 15)) full = addLineupMember(full, player);
    expect(full.members.filter((member) => !member.inactive)).toHaveLength(13);
    expect(() => addLineupMember(full, players[15])).toThrow('最多 15 人');
    expect(() => store.saveLineup(full)).not.toThrow();
    expect(() => validateDraft({ ...full, name: '' }, players)).toThrow('名称不能为空');
    expect(() =>
      validateDraft({ ...first, members: [first.members[0], first.members[0]] }, players),
    ).toThrow('只能加入一次');
    expect(() =>
      validateDraft(
        { ...first, members: [{ ...first.members[0], starter: true, inactive: true }] },
        players,
      ),
    ).toThrow('非激活球员');
  });

  it('比赛使用历史快照，最多保留 20 场，到期后详情数据清除', () => {
    const { store, deps, advance } = createScenario();
    const home = store.getSnapshot().lineups[0];
    const report = store.runBattle(home.id, 'classic-five');
    store.saveLineup({ ...home, name: '后来修改的名称' });
    expect(store.getSnapshot().reports[0].homeLineupName).toBe(report.homeLineupName);
    for (let index = 0; index < 20; index += 1) store.runBattle(home.id, 'classic-five');
    expect(createGuestStore(deps).getSnapshot().reports).toHaveLength(20);
    advance('2026-11-03T08:00:00Z');
    store.refresh();
    expect(store.getSnapshot().reports).toEqual([]);
    expect(createGuestStore(deps).getSnapshot().reports).toEqual([]);
  });
});
