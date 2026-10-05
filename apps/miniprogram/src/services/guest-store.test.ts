import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { players } from '@dream-court/core/catalog';
import { addLineupMember, createGuestStore, loadLineupEditor, validateDraft } from './guest-store';
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
