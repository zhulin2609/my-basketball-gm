# Current Plan

更新时间：2026-09-17

## 当前目标

在模拟对战结果中展示「本场最佳球员」（Player of the Game）：根据上场时间、得分、篮板、助攻、抢断、盖帽、投篮命中率（不区分两分和三分）与是否胜方计算表现分，从双方球员中选出分数最高者。

状态：开发完成，全部测试通过，等待提交。

## 已确认的决策

- 表现分公式：得分 ×1.0 + 篮板 ×1.2 + 助攻 ×1.5 + 抢断 ×2.0 + 盖帽 ×2.0 + 上场时间 ×0.3 +（2 × 投篮命中 − 投篮出手）+ 胜方 3 分加成。
- 效率项以出手数为乘数：命中率五成时等于命中数，高效多出手加分、低效多出手扣分；小样本高命中率无法获奖，因为产量项占主导。
- 抢断与盖帽场均只有 0–2 个，权重放大到 2.0，避免被得分淹没；上场时间只作辅助因子。
- 胜方加成 3 分，幅度有限：胜方球员可以因此胜过数据接近的败方球员，败方巨星仍可凭数据获奖。
- 公式内部以十分之一分为单位做整数运算再除以 10 返回，整数在双精度浮点下精确，平票比较才可靠。
- 平票决胜链：表现分 → 得分 → 上场时间 → 球员 ID 字典序，保证结果确定。
- 评选在前端展示层完成，本地战报与云端战报复用同一模块，战报数据结构不变，后端无需改动。

## 验收标准

- [x] 每场有统计数据的战报都选出唯一一名本场最佳球员。
- [x] 公式覆盖上场时间、得分、篮板、助攻、抢断、盖帽、投篮命中率与胜负。
- [x] 平票按得分、上场时间、球员 ID 依次决胜，结果确定。
- [x] 战报没有任何统计时不渲染卡片。
- [x] 卡片展示球员头像、姓名、所属阵容、主要数据与表现分。
- [x] 简体中文与英文文案齐全。
- [x] 前端测试、构建、格式检查全部通过。

## 实施步骤

1. `src/lib/player-of-the-game.ts`：`scorePlayerStat` 计算单行统计的表现分，`selectPlayerOfTheGame` 合并主客队统计、标记胜方并选出最高分。
2. `src/App.tsx` 的 `GameResult` 在记分牌与数据表之间渲染最佳球员卡片，头像与姓名优先使用战报快照字段。
3. `src/i18n/resources.ts` 新增 `battle.playerOfTheGame` 与 `battle.pogScore`（简体中文、英文）。
4. `src/styles.css` 新增 `.pog-card` 系列样式。
5. `src/lib/player-of-the-game.test.ts` 新增 8 项单元测试：公式加权、效率奖惩、小样本限制、跨队选择、胜方加成、三组平票决胜、空统计、真实引擎战报的 argmax 验证。
6. `src/App.test.tsx` 新增 1 项界面测试：本地模拟后展示最佳球员卡片。
7. 全部测试通过后更新 `docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md`、本文件。

## 测试方法

前端：

```bash
npm test
npm run build
npm run format:check
```

后端（本次无后端改动，回归用）：

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend
mvn test
```

后端测试需要本地 PostgreSQL 数据库 `basketball_gm_test`。连接配置位于 `backend/src/test/resources/application-test.yml`。

## 测试状态

2026-09-17 本场最佳球员功能完成后验证：

- `npm test`：9 个测试文件、35 项测试通过（含 8 项表现分公式单元测试与 1 项最佳球员卡片界面测试）。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。

## 当前 Git 状态

- 分支：`develop`，HEAD：`b6a8e1e docs: 更新 AGENTS.md 严谨直接在 main 分支上修改代码`。
- 本场最佳球员改动完成但未提交：`src/lib/player-of-the-game.ts`、`src/lib/player-of-the-game.test.ts` 新增，`src/App.tsx`、`src/App.test.tsx`、`src/i18n/resources.ts`、`src/styles.css` 修改。
