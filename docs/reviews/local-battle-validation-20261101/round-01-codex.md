# 本地对战资格校验独立审查

## Metadata

- Task：`local-battle-validation-20261101`。
- Round：01。
- Mode：`independent`。
- Reviewer：Codex，`codex-local-battle-review-20261101`，独立审查上下文 `/root/local_battle_review`。
- Implementer：Codex，本次任务父会话 `/root`。
- Date：2026-11-01，Asia/Shanghai（UTC+08:00）。
- Branch：`develop`。
- Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit / HEAD：`fbdd5bcd83a389a04095928e6ca91c8ea5193b45`。
- Reviewed Commit：`N/A`，审查对象包含未提交变更。
- Snapshot ID：`local-battle-validation-01`。
- Requirements：用户本次授权范围由父会话传入，并核对固定快照中的 `docs/plans/current.md` 当前任务 Goal、Acceptance Criteria、Write Scope；规则采用固定快照 `AGENTS.md`、`validateLineup`，相关架构与 D-006 一并检查。
- Context：审查者未参与实现；独立发现期间未读取其他审查报告或实施者日志。按照仓库流程读取 current plan 时接触了实施者验证记录，包括此前全量测试失败与浏览器检查描述；这些记录不作为本轮 PASS 证据。本轮先完成源码检查，记录于 `.cache/local-battle-validation/reviewer/source-review.md`，随后核对实际验证结果。
- Write Scope：本报告、`.cache/local-battle-validation/reviewer/` 下审查记录和日志，以及既有测试工具正常使用的隔离资源。实施、测试源码、任务计划保持原样；无提交或推送。
- Ownership：实施者通过任务交接明确停止写入和测试进程，审查者串行取得该 worktree 的限定写入权。报告完成后停止写入并释放所有权，由父会话接收。

## Snapshot and Scope

实际比较命令：`git diff HEAD -- <范围内已跟踪文件>`；结合 `git status --short`、`git diff --cached --stat`、`git ls-files --others --exclude-standard` 检查全部四个新增源码或测试文件。暂存区为空，无删除项。

审查变更包括 Web 两个入口及发起对战的校验、中英文原因文案、共享资格校验与引擎防线、core/client/Web 回归测试，以及架构和当前任务记录。此前认证入口变更已经包含在 Base Commit，仅执行相关回归。后端、小程序页面源码和其他既有功能未纳入修改范围；检查小程序共享引擎调用路径以确认兼容性。

快照材料保存在 `.cache/local-battle-validation/review/`，本机可读取；该目录受 Git 忽略，后续跨机器复现需要单独传递归档。`inputs.tar.gz` 保存当前输入，`base.tar.gz` 保存基线；另有 `changes.patch` 与 `status.txt`。忽略配置中的真实凭据、依赖安装目录和生成产物不进入快照。未修改的其他源码由 Base Commit 确定。

| 材料 | SHA-256 |
| --- | --- |
| `review/manifest.sha256` | `82365a3fddf6ec4190716865e0f8a6e452d6fe5a13885780835109446d2f6ba5` |
| `review/inputs.tar.gz` | `7d2e13a1a1af8a1142ad89c49a61e696e679a908a29c52b2621d8d86f0a1c416` |
| `review/base.tar.gz` | `3a0c09c3a6a21f1dc72f2085e6578acb05837f25c50e27c45aa47262d50697f8` |

相对输入清单及逐文件 SHA-256 见 `.cache/local-battle-validation/review-files.txt` 和上述 `manifest.sha256`。清单包含以下 26 个文件：

- `AGENTS.md`、`package.json`、`package-lock.json`、`vitest.config.ts`。
- `apps/web/vite.config.ts`、`apps/web/tsconfig.json`、`packages/core/tsconfig.json`、`packages/client/tsconfig.json`、`apps/miniprogram/tsconfig.json`、`scripts/vitest-backend.ts`。
- `docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/plans/current.md`。
- `apps/web/src/App.tsx`、`apps/web/src/i18n/resources.ts`、`apps/web/src/lib/matchup-errors.ts`、`apps/web/src/local-battle-validation.test.tsx`。
- `packages/core/src/index.ts`、`packages/core/src/lineup-validation.ts`、`packages/core/src/types.ts`、`packages/core/src/simulator.ts`、`packages/core/src/simulator.test.ts`、`packages/core/src/matchup-validation.ts`、`packages/core/src/matchup-validation.test.ts`。
- `packages/client/src/battle-service.ts`、`packages/client/src/battle-service.test.ts`。

开始和结束均执行 `shasum -a256 -c .cache/local-battle-validation/review/manifest.sha256`，结果均为 26/26 `OK`，退出码 0。

## Findings

本轮未发现可确认缺陷。缺陷计数：blocker 0、major 0、minor 0。没有需要映射到问题清单的原始发现编号。

## Coverage

- `packages/core/src/matchup-validation.ts`：双方存在、双方 ID 不同；每方复用 `validateLineup` 检查 5–15 名成员、最多 13 名激活球员、五名激活首发覆盖 PG/SG/SF/PF/C、成员唯一性；所有成员的球员引用均须存在，包含非激活成员。
- `packages/core/src/simulator.ts:133`：任何统计计算前执行 `assertValidMatchup`，非法输入抛出带有结构化原因的 `MatchupValidationError`。合法输入的原计算过程未修改；现有固定比分、确定性和分钟数回归保持通过。
- `apps/web/src/App.tsx:1747`、`:2113`：阵容编辑快捷入口与梦幻对战入口使用同一资格结果；双方当前状态变化会重新计算。禁用按钮通过 `aria-describedby` 关联可见原因，中英文原因包含对应队伍与阵容名称。
- `apps/web/src/App.tsx:424`：发起对战时再次校验。成功后才修改 `games` 和 `game`；失败展示本地化原因。新增校验同时覆盖既有登录态的服务调用之前，真实 API 回归通过。
- `packages/client/src/battle-service.ts`：`runLocal` 在 `simulate` 成功返回后保存战报。新增测试先保存合法历史，再验证主队、客队或双方为空时存储原文不变，重建 repository 后历史数量不变。
- 空阵容创建与保存：`newLineup` 和 `persist` 未增加参赛门禁；真实 App DOM 测试覆盖新建空阵容、选择为空对手、阻止点击、重新挂载后空阵容和已有战报保留。
- 编辑回归：移除成员、取消首发、当前阵容切换后与对手相同、没有对手均不能参赛；重新选择合法对手后可以实际模拟并持久化，重新挂载恢复结果。
- 小程序兼容：检查 `apps/miniprogram/src/services/guest-store.ts:244` 调用路径。现有 `runBattle` 已检查双方、草稿、成员完整性和 `validateLineup`；新增引擎校验与这些条件一致。完整测试包含该服务回归，四包 typecheck 包含小程序。
- 架构文档：`docs/ARCHITECTURE.md` 新增说明与已检查实现一致。current plan 中此前测试与浏览器结果属于实施阶段记录，本轮报告提供新的独立执行结果。

## Validation

以下命令均针对 Snapshot `local-battle-validation-01` 实际执行。环境：Node.js `v24.18.0`、npm `11.16.0`、Vitest `5.0.0`；真实后端日志显示 Java `21.0.12.1`、Spring Boot `4.1.1`。

| Command | Result | 结果与边界 |
| --- | --- | --- |
| `npm test -- --maxWorkers=1` | PASS | 退出码 0，34 个文件、226 项测试全部通过；223.24 秒。包含新增 46 项、既有 Web 认证/社区、core/client 与小程序测试。未并发运行构建。 |
| `npm run typecheck` | PASS | 退出码 0，core、client、Web、小程序四包检查通过。 |
| `npx prettier --check apps/web/src/App.tsx apps/web/src/i18n/resources.ts apps/web/src/lib/matchup-errors.ts apps/web/src/local-battle-validation.test.tsx packages/core/src/index.ts packages/core/src/simulator.ts packages/core/src/simulator.test.ts packages/core/src/matchup-validation.ts packages/core/src/matchup-validation.test.ts packages/client/src/battle-service.test.ts docs/ARCHITECTURE.md` | PASS | 退出码 0，`All matched files use Prettier code style!`。 |
| `git diff --check` | PASS | 退出码 0，无空白错误。 |
| `shasum -a256 -c .cache/local-battle-validation/review/manifest.sha256` | PASS | 起始、结束各 26/26 一致。 |

测试日志：`.cache/local-battle-validation/reviewer/full-tests.log`；类型检查：`typecheck.log`；格式检查：`format.log`。

测试 globalSetup 实际构建并启动 Spring Boot，通过 PostgreSQL 容器 `basketball-gm-test-pg` 创建独立数据库 `stage4_frontend_1793466480490`，监听 `127.0.0.1:54835`。后端日志确认 17 项迁移完成。项目 API 请求通过既有透明转发器到达真实后端；微信外部上游沿用 D-006 允许的本地契约服务。未新增 mock、未更改断言、未扩大等待时限。

后端与隔离环境证据：`.cache/integration-tests/stage4_frontend_1793466480490/backend.log`、`environment.json`。测试完成后 teardown 正常停止本轮 Java 进程和契约服务；后端日志记录 `Graceful shutdown complete` 与 `HikariPool-1 - Shutdown completed`。

## 未覆盖项

- 本轮独立审查未重新执行 Web/小程序构建；实施阶段构建记录已接触，未计作本轮执行结果。
- 本轮未进行真实浏览器、屏幕尺寸与视觉验收；Web 交互由实际 App 的 jsdom DOM 测试覆盖。实施阶段浏览器记录未作为独立证据。
- 微信开发者工具及 iOS/Android 真机验收未执行；共享 TypeScript 引擎兼容性仅由源码、既有小程序服务测试与 typecheck 支持。
- 未执行后端 Maven 完整测试；本轮未修改后端源码，完整前端套件中的 API 集成路径使用真实后端与隔离数据库。
- 未重启当前本地产品服务或部署服务器；当前运行服务不因本报告而取得新代码。

## Conclusion

`PASS`：适用于 Base Commit `fbdd5bcd83a389a04095928e6ca91c8ea5193b45` 上的 Snapshot `local-battle-validation-01`，范围为本轮 Web 本地对战资格校验、共享引擎拒绝非法输入及相关持久化和调用方回归。没有需要用户批准延期的确认缺陷或例外。上述平台验收保持未执行状态。

本报告为独立原始结果；后续汇总与任务状态更新由父会话负责。审查者完成报告后停止全部测试与写入，并明确释放该 worktree 的限定写入权。
