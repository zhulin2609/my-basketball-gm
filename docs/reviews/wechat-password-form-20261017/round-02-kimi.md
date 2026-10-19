# wechat-password-form-20261017 Round 02 修复复核

## Metadata

- Task：`wechat-password-form-20261017`
- Round：`02`
- Mode：`verification`，同时审查本轮新增前端变更
- Reviewer：Kimi Code，`session_67628870-4bfd-4022-b1e6-9c3fbcac9e63`
- Implementer：Codex，`codex-stage4-takeover-20261016-01a1421b`
- Date：2026-10-19 21:15 CST（UTC+08:00）
- Source Branch：`mini-app-20261004`
- Review Branch：`review/wechat-password-form-20261017-round-02-kimi-ba80e11`
- Worktree：`/Users/zhulin/Workspace/my-basketball-gm/.cache/review-worktrees/wechat-password-form-20261017-round-02-kimi-ba80e11`
- Base Commit（增量基线）：`6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`
- Reviewed Commit：`ba80e115f72c48d81ded5d85fb607256f45361bb`
- Scope：`git diff 6c1d1ba1e2f3841964f9458c5c4be9ed773552b7 ba80e115f72c48d81ded5d85fb607256f45361bb`，共 9 个文件：后端 `WechatAuthService.java`、`WechatAuthApiTest.java`（R01 修复与并发测试），小程序 `constants/text.ts`、`constants/text.test.ts`、`platform/battle-error.ts`、`pages/battle/index.tsx`（M11 对战错误提示与按钮文案），以及 `docs/plans/current.md`、`docs/REVIEW_FEEDBACK.md`、`docs/reviews/wechat-password-form-20261017/issues.md`。`git diff --check` 无空白错误。
- Requirements：用户本轮复核指令（R01 两种锁顺序与错误码、M11 文案与回归、文档一致性）；Round 01 报告的 R01 及修复方向；`docs/plans/current.md` 的 R01 修复与 M11 验收条件；`docs/DECISIONS.md` D-006 的外部上游测试边界。
- Write Scope：仅本报告与本 worktree 内 Git 忽略的 `.cache` 验证材料。未修改业务代码、既有测试、原工作区、用户验收表、身份备份、历史报告及既有 Kimi worktree；未提交、未推送、未合并。
- Independent Context：审查者未参与本次实现与修复。本轮为修复后复核，已读取 Round 01 报告、本任务 issues.md、current plan、REVIEW_FEEDBACK；另发现 `.cache/review-worktrees/wechat-password-form-20261017-round-02-kimi` 中存在一份 2026-10-18 针对未提交快照 `wechat-password-form-r01-verify-20261018-kimi` 的同名复核报告（未提交，仅存在于该 worktree），已读取并记录。该快照轮次明确未覆盖前端完整测试与构建；本轮绑定已提交版本 `ba80e11`，验证资源（worktree、branch、数据库、日志）均为本轮新建。上述既有 worktree 及其未提交内容保持原状。

## R01 复核结论（来源 Round 01 R01，本任务 I001）

复核版本为已提交的 `ba80e11`。修复逻辑核对：`WechatAuthService.resolveBindConflict`（`backend/src/main/java/com/basketballgm/auth/WechatAuthService.java:208-227`）在事务失败后先查实际身份归属，相同绑定幂等返回会话；身份属于其他账号或目标账号已绑定同 provider/appid 身份时返回 409 `IDENTITY_CONFLICT`；无实际绑定时重新读取凭证，`consumed_at` 非空、`consumed_by_user_id` 为空且 `failed_attempts >= bindAttempts` 时返回 400 `CREDENTIAL_ATTEMPTS_EXCEEDED`，其余返回 400 `CREDENTIAL_INVALID`。`WechatCredentialMapper.markFailed` 在同一条条件 SQL 中原子递增次数并在达到上限时消费凭证（不写 `consumed_by_user_id`）。小程序 `services/account-auth.ts:28-39` 将 `CREDENTIAL_ATTEMPTS_EXCEEDED` 与 `CREDENTIAL_INVALID` 映射为 `renewCredential: true`，修复后耗尽场景可立即在原位置重新验证微信，Round 01 描述的 409 落入普通错误分支的界面后果消除。

- R01 / 第五次错误请求先取得锁：VERIFIED。`WechatAuthApiTest.realHttpFifthWrongAttemptLocksBeforeCorrectRequest` 通过真实 Spring Boot 随机端口 HTTP 与真实 PostgreSQL 行锁等待队列固定顺序：外部测试连接持有凭证行锁，观察到错误请求的 `markFailed` 排在锁等待队列后才放行。实际结果：两个请求均为 HTTP 400 `CREDENTIAL_ATTEMPTS_EXCEEDED`；`failed_attempts=5`；`user_identities` 为 0 条；凭证已消费且 `consumed_by_user_id` 为空；耗尽后正确密码重试仍返回 `CREDENTIAL_ATTEMPTS_EXCEEDED`。Round 01 复现的 409 误报已消除。
- R01 / 正确请求先取得锁：VERIFIED。`realHttpCorrectRequestLocksBeforeFifthWrongAttempt` 通过：正确请求返回 200 并携带目标账号会话、无错误码；随后错误请求返回 400 `CREDENTIAL_INVALID`；`failed_attempts=4`（已消费凭证上 `markFailed` 条件更新 0 行）；身份表恰好 1 条且归属目标账号；凭证由该账号消费；成功请求以同一凭证重试仍为 200 且返回同一用户。
- 无实际绑定且次数耗尽返回 `CREDENTIAL_ATTEMPTS_EXCEEDED`：VERIFIED。上述错误优先顺序用例与 `realHttpFinalWrongAttemptImmediatelyRequiresRenewalAndFreshCredentialWorks`（第五次失败立即 400 耗尽、换新凭证后成功）共同覆盖。
- 真实冲突保留 `IDENTITY_CONFLICT`：VERIFIED。新增 `realHttpIdentityConflictsInBothDirectionsRemainConflicts` 验证两个方向：他人已绑定同一微信身份、同一账号重复绑定同 appid 微信，均返回 409 `IDENTITY_CONFLICT`；被拒绝请求的凭证 `consumed_at` 为空且 `failed_attempts=0`，不增加失败次数、不消费自身凭证。
- 成功重试与普通错误后正确重试保持有效：VERIFIED。`realHttpWrongPasswordCanBeCorrectedWithoutReplacingCredential` 覆盖 401 后正确提交 200、成功请求重试 200 且同一用户；既有 `bindsAnExistingPasswordAccountAfterPasswordVerification` 保留并通过。
- 复核结论：R01 修复满足原触发路径与验收条件，建议汇总负责人据此将 I001 标记为 VERIFIED。

## M11 对战失败提示审查（本轮新增前端变更）

- 断网文案：`constants/text.ts` 的 `battleErrorMessage('none')` 返回“网络错误，请稍后重试。”；`platform/battle-error.ts` 仅在对战失败后调用 `Taro.getNetworkType()`，网络状态为 `none` 时显示该文案。符合用户确认文案。
- 其他网络状态及查询失败：`wifi/2g/3g/4g/5g/unknown` 及 `getNetworkType` 失败（映射为 `undefined`）均返回“暂时无法对战，请稍后重试。”。`constants/text.test.ts` 8 项用例覆盖全部分支，本轮实际执行通过。
- 底层错误不泄露：`pages/battle/index.tsx:34-35` 的 `catch` 不读取异常内容，仅展示映射文案，底层错误字符串不进入界面。
- 失败后保留阵容且可重试：`catch` 不触碰 `homeId`/`awayId` 选择状态，`finally` 复位 `running`，`run` 入口清空旧错误；按钮在失败后恢复可用，可再次提交。
- 按钮文案：`pages/battle/index.tsx:87` 为“开始对战”；构建产物 `dist/pages/battle/index.js` 含该文案（Unicode 转义形式），`dist/common.js` 含两条错误文案，旧文案“开始规则对战”在产物中无残留。
- 回归面：`errorMessage` 仍被其他页面正常使用，仅对战页改用专用映射；完整前端 140 项测试通过，无直接回归。

## Findings

本轮在审查范围内未发现新的可确认缺陷。

## Coverage

- 已核对：`ba80e11` 相对 `6c1d1ba` 的全部 9 个差异文件；R01 修复涉及的 `WechatCredentialMapper`、`UserIdentityMapper.listByUser`、`CredentialConsumedException` 及小程序错误码映射；M11 涉及的纯函数、平台封装、页面与测试；三份文档变更与实现的一致性。
- 文档差异（不影响结论的观察，留待汇总负责人处理）：
  - `docs/plans/current.md:535`（M11 验证记录）称“此前‘开始对战’按钮文案保留”，而增量基线 `6c1d1ba` 的实际文案为“开始规则对战”，“开始对战”首次出现于本次提交；该变更在 2026-10-19 任务条目与 `docs/REVIEW_FEEDBACK.md` 的待审范围中均有声明，当前实现与用户确认文案一致，仅该历史措辞与基线不符。
  - 已提交的 `issues.md:8` 仍写“当前 Reviewed Commit：待 Round 02 固定提交后的完整 SHA”；本轮已固定为 `ba80e115f72c48d81ded5d85fb607256f45361bb`，问题清单的状态与 SHA 更新属原工作区汇总范围，本轮未修改。
- 已核验 `issues.md:9` 声明的 Round 01 报告 SHA-256：`3cdaadcf18e87ee0d50d4e4cbe613a53c974225c3f7c71d93e8c963276855c94`，与实际文件一致。
- 历史阶段 4 的 I004、I007、I016、I017：按本轮指令未复核、未关闭。

## Validation

验证环境：Node.js 24.18.0、npm 11.16.0、OpenJDK 21.0.12.1、Maven 3.9.16、Docker 容器 `basketball-gm-test-pg`（PostgreSQL 16.10，127.0.0.1:5432）。数据库 `password_form_r02_kimi_20261019`（定向）与 `password_form_r02_kimi_full_20261019`（完整）均为本轮新建，未连接用户开发库，运行后两个数据库的微信测试用户、`test-appid` 身份与凭证残留均为 0。项目 API 验证使用真实 Spring Boot HTTP 与真实 PostgreSQL；微信上游仅按 D-006 由测试内本地契约 HTTP 服务扮演，未模拟本项目 API。日志位于本 worktree `.cache/review-logs/`。

| Command / 检查 | Result | 范围与证据 |
| --- | --- | --- |
| `git diff 6c1d1ba… ba80e11…` 与 `git diff --check` | PASS | 9 个文件，差异无空白错误；两个引用解析为完整 SHA |
| `npm ci --no-audit --no-fund` | PASS | 独立 worktree 按锁文件安装依赖 |
| `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r02_kimi_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=WechatAuthApiTest test`（backend） | PASS | 17 项，0 failures/errors/skipped；含两种锁顺序、双向冲突、耗尽与幂等重试，真实 HTTP 与行锁等待队列 |
| `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r02_kimi_full_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp test`（backend） | PASS | 完整后端 83 项，0 failures/errors/skipped；本轮未出现 2026-10-18 记录的 LLM HTTP 404 波动 |
| `npm test` | PASS | 27 个文件、140 项全部通过（含新增 8 项对战提示用例） |
| `npm run typecheck` | PASS | core、client、Web、miniprogram 四包 |
| `npm run build` | PASS | 含四包 typecheck 与 Web 生产构建，保留既有 500 kB 体积提示 |
| `MINI_API_BASE_URL=http://127.0.0.1:8088/api/v1 npm run build:weapp` | PASS | 含四包 typecheck、Taro 构建与产物地址校验；产物含“开始对战”与两条 M11 文案，无“开始规则对战”残留 |
| `node node_modules/prettier/bin/prettier.cjs --check`（本轮 4 个前端文件与 3 份 Markdown） | PASS | 格式符合项目配置 |
| 两个本轮数据库的测试残留计数查询 | PASS | 微信测试用户、`test-appid` 身份与凭证均为 0 |
| 保留范围核验 | PASS | 原工作区（现为 `86b6dd`，Codex 于本轮审查期间提交验收表）、round-01 与旧 round-02 worktree、AGENTS.md、验收表与身份备份均未被本轮修改 |

用户反馈（非本轮 Agent 证据，分开记录）：M01–M12、W01–W06 真机验收 PASS 为用户 2026-10-19 反馈；S01–S07 因等待注册普通小程序账号保持 BLOCKED。本轮未执行任何真机验收。

## Not Run / Unverified

- 真实微信平台（`jscode2session`、小程序码、扫码链路）、微信开发者工具与 iOS/Android 真机：NOT RUN；S01–S07 保持 BLOCKED。本轮后端与前端自动化证据不代替平台验收。
- 断网与网络状态查询失败的真实设备表现：NOT RUN；已由纯函数测试与代码路径覆盖，真机断网交互见用户验收反馈。
- 2026-10-18 完整后端首次运行的 `LlmSimulationClientRequestBodyTest` HTTP 404：本轮完整运行未复现，根因仍未确定，保留在 current plan 的 Open Questions。

## Conclusion

`PASS`

适用范围：Reviewed Commit `ba80e115f72c48d81ded5d85fb607256f45361bb` 相对增量基线 `6c1d1ba1e2f3841964f9458c5c4be9ed773552b7` 的 R01 修复复核、M11 前端变更与文档一致性。R01（I001）复核结果为 VERIFIED；本轮无新增问题。平台验收（M01–M12、W01–W06）依据用户反馈记录，S01–S07 保持 BLOCKED；历史阶段 4 的 I004、I007、I016、I017 不在本轮范围。本结论仅覆盖上述范围，不改变任何历史结论；问题清单与审查入口的更新由原工作区汇总负责人执行。
