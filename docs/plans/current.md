# Current Plan

更新时间：2026-09-17

## 当前目标

球员库与我的阵容页面展示的球员列表按能力值（OVR）从高到低排序，方便新用户优先看到最好的球员。

状态：开发完成，全部测试通过，等待提交。

## 已确认的决策

- 球员库网格的排序控件默认就是「综合能力」降序，无需改动。
- 我的阵容页的候选球员列表此前按目录原序排列（精选球星在前、历史球员按字母序），改为按 `average`（11 项能力均值）降序。
- 阵容成员表保持首发状态与位置的结构性排序，它是阵容本身的编辑视图，不属于浏览用球员列表。
- 排序稳定性：同分球员保持目录原序（`Array.prototype.sort` 在原数组副本上稳定排序）。

## 验收标准

- [x] 球员库网格默认按能力值降序。
- [x] 我的阵容页候选球员列表按能力值降序。
- [x] 前端测试、构建、格式检查全部通过。

## 实施步骤

1. `src/App.tsx` 的 `availablePlayers` 追加 `average` 降序排序。
2. `src/App.test.tsx` 新增 2 项排序回归测试：球员库网格与阵容页候选列表都按 OVR 降序。
3. 全部测试通过后更新 `docs/AI_HANDOFF.md` 与本文件。

## 测试方法

```bash
npm test
npm run build
npm run format:check
```

## 测试状态

2026-09-17 排序功能完成后验证：

- `npm test`：9 个测试文件、37 项测试通过（含 2 项能力值排序回归测试）。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。

## 当前 Git 状态

- 分支：`develop`，基线提交：`c854c1e feat: 球员库补齐 1978-2026 年全部总决赛 FMVP`。
- 排序改动完成但未提交：`src/App.tsx`、`src/App.test.tsx`、`docs/plans/current.md`、`docs/AI_HANDOFF.md`。
