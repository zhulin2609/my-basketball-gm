# 密码表单任务问题记录

- Task：`wechat-password-form-20261017`。
- 更新日期：2026-10-19（Asia/Shanghai）。
- 汇总与修复负责人：Codex，`codex-stage4-takeover-20261016-01a1421b`。
- Base Commit：`03c11587a11c28336693d64ee6f8e5d77e1a9a10`。
- 原 Reviewed Commit / 修复起点 HEAD：`6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`。
- 当前 Reviewed Commit：待 Round 02 固定提交后的完整 SHA，以交付提示词及 Git 核验为准。2026-10-18 历史修复 Snapshot：`wechat-password-form-r01-fix-20261018`。
- 原始报告：[Kimi Round 01](../../../.cache/review-worktrees/wechat-password-form-20261017-round-01-kimi/docs/reviews/wechat-password-form-20261017/round-01-kimi.md)。该报告仅在本地独立 worktree 中存在，保持原文；SHA-256 为 `3cdaadcf18e87ee0d50d4e4cbe613a53c974225c3f7c71d93e8c963276855c94`。
- 状态计数：`FIXED_PENDING_REVIEW` 1；`OPEN`、`VERIFIED`、`NEEDS_CONFIRMATION`、`DISMISSED`、`DEFERRED` 均为 0。
- 当前结论：`INCOMPLETE`，修复等待独立复核。原 Kimi 报告对原 Reviewed Commit 的 `CHANGES_REQUIRED` 结论保留。
- 历史范围：[阶段 4 问题清单](../wechat-login-stage4/issues.md)中的 I004、I007、I016、I017 保持 OPEN，本次未处理。

## I001 — 第五次密码失败与正确绑定并发时误报身份冲突

- 来源：上述 Kimi Round 01 `R01`；严重度 `major`。
- 状态：`FIXED_PENDING_REVIEW`。
- 适用版本：原 Reviewed Commit 中的 `WechatAuthService.resolveBindConflict`。
- 触发条件：凭证已有四次失败，第五次错误请求先消费凭证，已读取原凭证的正确请求随后取得行锁；没有实际绑定时返回 409 `IDENTITY_CONFLICT`，小程序无法立即显示重新验证微信入口。
- 核验：2026-10-18 在修复生产代码前运行新增两种顺序的真实 HTTP 测试。错误请求先取得锁的用例失败，期望 400、实际 409；正确请求先取得锁的用例通过。根因与 Kimi 报告一致。
- 实施者回复：保留相同绑定的幂等处理；仅在微信身份已属于其他账号或目标账号已绑定同一 provider/appid 的身份时返回冲突。无实际身份绑定时重新读取凭证，耗尽返回 `CREDENTIAL_ATTEMPTS_EXCEEDED`，其余无效状态返回 `CREDENTIAL_INVALID`。
- 修改文件：`backend/src/main/java/com/basketballgm/auth/WechatAuthService.java`；`backend/src/test/java/com/basketballgm/auth/WechatAuthApiTest.java`。前端、Mapper、迁移未修改。
- 修复版本：HEAD 上的未提交快照 `wechat-password-form-r01-fix-20261018`；源文件副本、`fix.patch` 与 `sha256.txt` 位于 `.cache/password-form-r01/snapshot/`，仅本机可用。补丁基于上述 HEAD，可重现两个代码文件的修改；没有删除项。
- 实现文件 SHA-256：`3da16c175d9a416c55cc5d6ddb9265417cf74619f0e0933f90ba78c3131fdb3e`。
- 测试文件 SHA-256：`dc0a56fa876eaa38ecafa8ce0b25142d2645e503fe60c4296f1d4952a002665e`。
- 排除项：用户验收表、本地身份备份、Kimi worktree、历史审查报告和本轮状态文档均不属于被测代码快照。数据库和本地运行日志不进入提交。
- 复核者与复核报告：待用户安排；实施者未将本项标记 VERIFIED。

### 并发与回归证据

新增测试使用真实 Spring Boot 随机端口、Java HttpClient 和 PostgreSQL。测试连接只持有凭证行锁，不改写失败次数或消费结果；先观察第一个请求被阻塞，再通过 `pg_blocking_pids` 确认第二个请求排在第一个请求之后，释放行锁后执行正常业务处理。轮询有明确超时，不靠固定延时猜测顺序。注册、exchange 和绑定均走真实 HTTP；仅微信上游按 D-006 使用本地契约服务。

| 顺序                   | 正确请求                             | 错误请求                             | failed_attempts | 最终绑定与消费结果                                |
| ---------------------- | ------------------------------------ | ------------------------------------ | --------------- | ------------------------------------------------- |
| 第五次错误请求先取得锁 | 400 / `CREDENTIAL_ATTEMPTS_EXCEEDED` | 400 / `CREDENTIAL_ATTEMPTS_EXCEEDED` | 5               | 身份表 0 条；凭证已消费，consumed_by_user_id 为空 |
| 正确请求先取得锁       | 200 / 正确账号会话，无错误码         | 400 / `CREDENTIAL_INVALID`           | 4               | 身份表恰好 1 条，归属目标账号；凭证由该账号消费   |

两个顺序均断言 HTTP 状态、错误码、失败次数、消费状态和身份归属。成功后重试仍为 200；耗尽后重试仍返回耗尽错误。普通错误后正确重试及成功重试、两个方向的真实身份冲突均通过真实 HTTP 验证；冲突请求不增加失败次数、不消费自身凭证。原有测试保留并完整执行。

### 实际验证（2026-10-18）

独立数据库位于已有测试容器 `basketball-gm-test-pg`（PostgreSQL 16.10，端口 5432），与用户开发库所在 Compose 容器隔离。本轮新建 `password_form_r01_20261018` 和 `password_form_r01_full_20261018`；没有连接用户开发库。以下 Maven 命令均在 `backend` 目录执行，日志位于 `.cache/password-form-r01/`。

- `docker exec basketball-gm-test-pg createdb -U zhulin password_form_r01_20261018` 及同命令创建 `password_form_r01_full_20261018`：PASS。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r01_20261018 mvn -Djava.io.tmpdir=../.cache/java-tmp '-Dtest=WechatAuthApiTest#realHttpFifthWrongAttemptLocksBeforeCorrectRequest+realHttpCorrectRequestLocksBeforeFifthWrongAttempt' test`：FAIL（预期复现）；修复前 2 项，1 项失败，正确请求实际 409。日志 `before-fix.log`。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r01_20261018 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=WechatAuthApiTest test`：PASS；17 项，0 failures/errors/skipped。日志 `targeted.log`。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r01_full_20261018 mvn -Djava.io.tmpdir=../.cache/java-tmp test`：首次 FAIL；83 项中 1 error，未修改的 `LlmSimulationClientRequestBodyTest` 收到 HTTP 404；WechatAuthApiTest 的 17 项通过。日志 `full.log`。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r01_full_20261018 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=LlmSimulationClientRequestBodyTest test`：PASS；独立复跑 1 项。日志 `unrelated-isolation.log`。
- 上述完整 `mvn test` 命令保持代码不变再次执行：PASS；83 项，0 failures/errors/skipped。日志 `full-rerun.log`。首次 LLM HTTP 404 的根因未确定，没有修改相关实现或测试。
- `npm run typecheck`：PASS；四包类型检查，日志 `typecheck.log`。
- `node node_modules/prettier/bin/prettier.cjs --check docs/plans/current.md docs/REVIEW_FEEDBACK.md docs/reviews/wechat-password-form-20261017/issues.md`、`git diff --check`：PASS；本轮状态文档与差异格式检查。
- `shasum -a 256 -c .cache/password-form-r01/preserved.sha256` 与快照目录的 `sha256.txt`：PASS；AGENTS.md、验收表、身份备份、Kimi 原始报告保持不变；验证后的实现、测试与必要配置摘要一致。
- 通过 `docker exec basketball-gm-test-pg psql -X -U zhulin -d <本轮数据库> -Atc <只读计数 SQL>` 核验清理：PASS；两个数据库中本轮微信测试用户、身份和凭证残留均为 0。原数据库保留供复核。
- 前端测试与两端构建：NOT RUN；本轮没有修改前端。
- 真实微信、开发者工具、iOS/Android、M06 页面交互和独立复核：NOT RUN；本次仅提供后端运行证据。

### 状态变化与下一步

2026-10-19：用户授权提交并推送当前增量，随后由 Kimi 执行独立复核；R01 / I001 保持 FIXED_PENDING_REVIEW。用户确认 M01–M12、W01–W06 真机验收 PASS，S01–S07 等待注册普通小程序账号而 BLOCKED；这些反馈不替代 R01 的独立代码复核。提交前重复验证见 current plan 的 2026-10-19 交付记录。

2026-10-18：确认 Kimi R01，按本任务编号登记为 I001 / OPEN；修复实现与上述验证完成后更新为 FIXED_PENDING_REVIEW。独立复核应绑定新的快照，检查两个锁顺序、真实冲突与幂等回归，确认后再决定是否标记 VERIFIED。
