# Current Plan

更新时间：2026-09-20

## 当前目标

阵容成员展示顺序统一：激活的首发球员按 C→PF→SF→SG→PG 站位顺序排在前五位，替补与未激活成员保持原相对顺序。规则同时作用于阵容编辑表与社区帖子成员表，只改展示顺序，不改写成员的存储顺序。

## 已确认的决策

- 规则抽成 `src/lib/member-display-order.ts` 的 `orderMembersForDisplay` 共享函数，阵容编辑表与社区帖子成员表复用同一份比较逻辑，避免两处比较器日后分叉。
- 未激活的首发按替补对待（与阵容编辑表既有行为一致）。
- 纯前端展示层改动：成员的存储顺序（`slot_index` 与快照 jsonb 数组）不变，后端与数据库无改动。

## 验收标准

- [x] 社区帖子详情中五位激活首发排在前五位，按 C→PF→SF→SG→PG 顺序。
- [x] 阵容编辑表的展示顺序与改动前一致（同一规则抽取，无行为变化）。
- [x] 排序不修改传入数组本身。

## 实施步骤

1. 新增 `src/lib/member-display-order.ts` 与单元测试 `src/lib/member-display-order.test.ts`。
2. `src/App.tsx` 阵容编辑表与社区帖子成员表接入共享函数，删除原内联比较器与 `starterDisplayOrder` 常量。
3. 门禁：`npm test`、`npm run build`、`npm run format:check`。
4. 更新 `docs/AI_HANDOFF.md` 与本文件。

## 测试状态

2026-09-20 完成后验证：

- 前端：11 个测试文件、52 项测试全部通过（新增 2 项排序单元测试）。
- 生产构建：通过。Prettier：通过。
- 纯前端改动，Vite 热更新生效，无需重启服务。

## 当前 Git 状态

- 分支：`develop`，基线提交：`e9531f1 feat: 阵容编辑表与社区帖子成员表统一首发在前的展示顺序`。
- 工作区干净，无未提交改动；`main` 停在 `bd26b91`，落后 `develop` 一个提交。
