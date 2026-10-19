# 阶段 4 第九轮：历史问题当前版本核验

## Metadata

- Task：`wechat-login-stage4`；执行标识 `wechat-login-stage4-round09-recheck-20261019`。
- Round：09；Mode：verification，附 Kimi 密码表单报告汇总。
- Reviewer / 汇总负责人：Codex，`codex-stage4-takeover-20261016-01a1421b`。
- Implementer：阶段 4 历史实施者 Kimi Code；后续密码表单修复及本轮文档整理为 Codex。本轮已读取前轮报告，属于历史问题核验，不声称独立于自身修改；I017 文档修改必须另行独立复核。
- Date：2026-10-19，Asia/Shanghai（UTC+08:00）。
- Branch：`mini-app-20261004`；Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit / Reviewed Commit：均为 `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`。这是固定提交的当前状态核验，没有待审实现增量；不据此声称完整实现通过审查。
- Scope：仅 I004、I007、I016、I017 的现存路径及直接相关证据。`git show HEAD:docs/plans/current.md` 固定修改前文档；开始和结束用 `git diff --exit-code -- apps packages backend AGENTS.md docs/DECISIONS.md 阶段4验收用例.xlsx` 检查源代码与保护文件未修改。
- Requirements：当前用户指令、上述提交的 AGENTS.md、DECISIONS.md D-005/D-006、current plan；历史来源为 round-05 R01–R04，round-08 的 19 VERIFIED 仅继承原证据。
- Write Scope：`docs/plans/current.md`、`docs/REVIEW_FEEDBACK.md`、本任务 `issues.md` 和本报告、密码表单任务 `issues.md` 和原样归档的 `round-02-kimi.md`。辅助验证写入 `.cache/` 和本轮独立测试数据库。业务代码、既有测试、验收表、身份备份、历史报告、Kimi worktree 不修改。不提交、不推送、不合并。
- 输入业务代码绑定上述提交；本轮未提交文档是核验后的输出，未将其作为已经独立审查的快照。I017 后续独立复核须固定届时提交或完整文档快照。

## R01 / I004 · major · 直接请求 401 后运行时保留账号状态

- Location：`packages/client/src/api.ts:58`；`apps/miniprogram/src/pages/account/index.tsx:46`；`apps/miniprogram/src/pages/report-detail/index.tsx:44`；`apps/miniprogram/src/services/runtime.ts:73`；`apps/miniprogram/src/services/account-store.ts:66`。
- Trigger：已进入账号数据源后，页面直接调用 `api.listIdentities()` 或 `api.getSimulation(id)`，服务器拒绝失效会话。
- 当前行为：公共请求发送器清除会话并抛出 ApiError；页面处理局部错误。直接请求未经过账号数据源的 guarded，也未触发 runtime 的 onUnauthorized 切换。
- 实际证据：真实 Spring Boot 注册账号并加载账号数据源，随后对测试会话签名作无效处理，由真实服务器产生 HTTP 401。两个直接请求均观察到 session=null、callbackCount=0、runtime=ready、source=account。对照调用 `account.saveLineup()` 同样收到真实 401，callbackCount=1。
- 证据边界：实际调用项目 client、account-store、guest-runtime 模块及真实磁盘；生产页面与 runtime.ts 的连接关系通过源码核验。没有执行完整 Taro 页面及真机显示流程。测试回调用于计数，不伪造 API 响应。
- Impact / Basis：持久会话与内存账号数据源不一致，页面可能继续保留已失效账号的数据；不满足退出失效会话、隔离账号状态的要求。保存路径已修复不覆盖直接请求路径。
- Repair Direction：所有受保护请求统一接入按会话标识检查的失效通知，清除对应账号内存并切回游客状态；避免旧会话迟到的 401 清除新账号会话。补充真实 API 验证 identities、详情、保存及 A→B 期间迟到响应，检查会话、runtime 和可见数据。
- Result：OPEN。复现命令 PASS 表示缺陷断言成立，业务行为判定 FAIL。

## R02 / I007 · major · 幂等导入重试和独立草稿可能导致本地内容丢失

- Location：`apps/miniprogram/src/services/runtime.ts:154`，特别是 164、168–172；`backend/src/main/java/com/basketballgm/guest/GuestImportService.java:43`；`apps/miniprogram/src/services/guest-store.ts:239`。
- Trigger：首次导入已在服务器成功，客户端因会话或工作区变化保留本地工作区；之后修改内容并使用同一个 workspace ID 再次导入。另一路径是在请求期间只修改独立草稿。
- 当前行为：服务器同一 workspace ID、同一 owner 的重复请求返回旧导入结果及 `alreadyImported=true`，不会再次处理新内容。客户端忽略返回结果，只检查本次请求前后的 session、id、updatedAt，相等即删除整个 workspace 和草稿。`saveDraft()` 不更新 workspace.updatedAt。
- 实际证据：首次真实导入 `alreadyImported=false`；保留本地工作区后修改阵容并重试，得到 `alreadyImported=true`。真实 API 和 PostgreSQL 查询确认仅有 `r09_initial_import`，没有 `r09_edit_after_import`；根据现有条件计算 cleanupAllowed=true。真实草稿写入后 workspace 版本未变化；调用现有清理函数后工作区与草稿都消失。
- 证据边界：保留首次导入结果后的本地工作区，是直接构造的合法客户端状态；没有执行首次导入期间的完整账号切换时序。当前 Taro `importGuestProgress()` 未整体执行；其判断与清理调用通过源码逐项核验，真实服务、序列化、导入幂等行为和存储删除均已执行。
- Impact / Basis：未被服务器确认导入的新编辑与草稿可能被清除，违反用户数据保留要求。服务器对同一幂等键返回旧结果符合当前契约，问题集中于客户端导入身份与清理依据。
- Repair Direction：将导入操作绑定到不可变内容版本，并保留服务器已确认版本和 ID 映射；同一版本重试沿用幂等标识，内容变化生成新的导入版本，避免把旧成功当成新内容的成功。清理仅覆盖服务器确认的内容及对应草稿版本；请求期间新增、修改的内容和草稿保留。验证丢失响应后的重试、首次导入成功后继续编辑、请求期间草稿变化、切换账号四条真实路径。
- Result：OPEN，业务行为判定 FAIL。

## R03 / I016 · major · 测试仍预设本项目 API 响应

- Location：`apps/web/src/scan-login.test.tsx:53`；`apps/miniprogram/src/services/account-store.test.ts:68`；`apps/miniprogram/src/services/guest-runtime.test.ts:181`；`packages/client/src/api-wechat.test.ts:40`；`packages/client/src/testing/local-api-server.ts:76`。
- Evidence：scan-login 预设本项目票据创建、轮询、领取、会话和业务列表；account-store、guest-runtime 预设球员、阵容和战报；api-wechat 预设 `/api/v1/auth/wechat/exchange` 等本项目接口。测试服务器查找 handler 后直接写入其 status/body，未经过项目 Spring Boot 处理。这些位置在 Reviewed Commit 中仍存在。
- Basis：D-006 Decision 只允许本地契约服务器扮演外部微信 `jscode2session`、`getwxacodeunlimit` 等；本系统传输、数据库、业务处理和断言必须真实。历史 D-006 的 Affected Areas 不能扩大用户限定的授权。
- Impact：这些前端测试可以验证局部消费响应的行为，但不能提供仓库要求的真实项目 API 验证，且其预设方式违反当前验证边界。后端真实测试通过不能消除前端测试本身的规则冲突。
- Repair Direction：将涉及项目 API 的集成路径接到实际 Spring Boot 与各轮独立 PostgreSQL，通过真实接口准备业务状态；外部微信替代限于 D-006 范围。保留有价值的既有断言和纯函数测试，补充真实会话、票据消费、错误和数据隔离证据，不删除或削弱测试来消除问题。
- Result：OPEN。代码路径已确认，本轮没有重新执行这些预设项目响应的测试，也没有据其成功推断产品有效。

## R04 / I017 · minor · 当前任务状态与历史记录缺少明确边界

- Location：Reviewed Commit 的 `docs/plans/current.md:15` 与 `:54`，以及 Current State、Completion；`docs/REVIEW_FEEDBACK.md:3`。
- Evidence：Task 仍称 M06 绑定“恢复另待用户指令”，Goal 已记录 M12 完成后恢复；Current State 最新条目仍使用 `6c1d1ba` 与“修复未提交”，Completion 仍称 R01 待独立复核。用户本轮要求汇总的 Kimi 报告已固定 `ba80e11` 并验证 R01。旧内容没有统一当前事实入口，容易被后续 Agent 当作当前动作要求。
- 判定边界：有明确日期、轮次的历史测试和状态记录可以保留；2026-10-17 的 AI_HANDOFF 是旧交接索引，文件日期较旧本身不构成缺陷。本轮没有正式交接，不要求刷新该文件或释放 Owner。历史第三轮/第四轮的具体冲突不自动当作当前新缺陷。
- 本轮文档处理：更新当前任务、基线、Owner 写入范围、验收状态、Current State、Progress、Open Questions、Validation、Completion；明确后续段落为历史 checkpoint。入口与两份清单同步 R01 VERIFIED、阶段 4 19 VERIFIED / 3 OPEN / 1 FIXED_PENDING_REVIEW。纠正 Kimi 指出的按钮文案基线描述，保留原始报告。
- 修复版本：Reviewed Commit 之后的本轮六份未提交文档输出，详见 Metadata 的 Write Scope。没有业务或测试文件改动。
- Repair Direction / Result：FIXED_PENDING_REVIEW；独立审查者需检查当前摘要、授权、版本、问题计数、平台验收和历史边界是否一致。本轮实施者不自行标记 VERIFIED。

## Kimi Round 02 归档及密码表单 R01

- 来源：`.cache/review-worktrees/wechat-password-form-20261017-round-02-kimi-ba80e11/docs/reviews/wechat-password-form-20261017/round-02-kimi.md`。
- 归档：`docs/reviews/wechat-password-form-20261017/round-02-kimi.md`；副本与原文 SHA-256 均为 `4882ebb164ab70fd5e85c61ec402638859635f9f78a1268b7ff14c51c2219707`。原 worktree 及旧快照 round-02 worktree 均保留。
- 独立审查者：Kimi Code，`session_67628870-4bfd-4022-b1e6-9c3fbcac9e63`；Base `6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`，Reviewed `ba80e115f72c48d81ded5d85fb607256f45361bb`。
- R01 两种行锁顺序、真实双向身份冲突、错误后正确重试、成功重试全部 VERIFIED；范围结论 PASS，没有新增可确认缺陷。当前 HEAD 相对该 Reviewed Commit 仅新增验收表，代码一致。密码表单 I001 / Kimi R01 据此更新为 VERIFIED。
- Kimi 独立日志中的 WechatAuthApiTest 17 项、完整后端 83 项、前端 140 项、四包 typecheck、两端构建成功属于 Kimi 的执行结果；本轮核对报告和日志，未计为 Codex 本轮重新执行。该局部 PASS 不关闭阶段 4 的问题。

## Validation

环境：真实 Spring Boot 4.1.1，PostgreSQL 16.10；独立库 `stage4_recheck_20261019`，测试容器 `basketball-gm-test-pg` 的 5432 端口。API 临时端口 18096。未访问用户开发库。脚本与日志保存于 Git 忽略目录 `.cache/stage4-recheck-20261019/`；真实磁盘测试存储由现有 helper 写入 `.cache/miniprogram-tests/`。

实际执行的核心命令（在仓库根目录执行，特别注明的除外）：

```sh
docker exec basketball-gm-test-pg createdb -U zhulin stage4_recheck_20261019
curl --fail --silent --show-error http://127.0.0.1:18096/api/v1/health
node .cache/stage4-recheck-20261019/run-probe.mjs
docker exec basketball-gm-test-pg psql -X -U zhulin -d stage4_recheck_20261019 -c "SELECT current_database(), name FROM lineups WHERE name LIKE 'r09_%';"
```

首次启动（backend 目录）为以下命令，FAIL：未载入测试资源密钥，JWT_SECRET 长度不足。数据库迁移完成，但服务未启动。日志 `api.log`。

```sh
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/stage4_recheck_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dspring-boot.run.useTestClasspath=true -Dspring-boot.run.profiles=test -Dspring-boot.run.arguments=--server.port=18096 spring-boot:run
```

补充仅用于独立验证进程的随机密钥后重新启动，PASS；未输出密钥。日志 `api-rerun.log`。

```sh
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/stage4_recheck_20261019 SPRING_DATASOURCE_USERNAME=zhulin JWT_SECRET=$(openssl rand -hex 32) LLM_CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -base64 32) mvn -Djava.io.tmpdir=../.cache/java-tmp -Dspring-boot.run.profiles=test -Dspring-boot.run.arguments=--server.port=18096 spring-boot:run
```

后端定向回归（backend 目录），PASS：AuthApiTest 7 项、GuestImportApiTest 5 项，合计 12，0 failures/errors/skipped；日志 `backend-targeted.log` 明确连接本轮独立库。

```sh
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/stage4_recheck_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=AuthApiTest,GuestImportApiTest test
```

| 检查                                                            | 结果    | 实际范围与限制                                                                                       |
| --------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| 建库、V1–V16 迁移                                               | PASS    | 新建隔离库，未使用用户开发库                                                                         |
| 首次健康请求与探针                                              | FAIL    | API 尚未就绪，ECONNREFUSED；`probe.log` 保留，随后健康请求成功                                       |
| `run-probe.mjs` 重跑                                            | PASS    | `probe-rerun.log`：两条真实 401、保存对照、两次真实导入、草稿版本与实际清理；I004/I007 业务判定 FAIL |
| SQL 导入结果检查                                                | PASS    | 只有首次导入内容，后续编辑未入库                                                                     |
| 定向后端测试                                                    | PASS    | 12 项，仅证明已有用例覆盖范围，不能否定新增复现证据                                                  |
| `git diff ba80e115f72c48d81ded5d85fb607256f45361bb HEAD --stat` | PASS    | 只有验收表新增，代码一致                                                                             |
| `shasum -a 256` 归档报告与源报告                                | PASS    | 摘要一致，原文保留                                                                                   |
| 完整前后端测试、typecheck、两端构建                             | NOT RUN | 本轮只改文档；没有重跑 I016 涉及的预设项目响应测试                                                   |
| 真机、微信上游、完整 Taro 页面流程                              | NOT RUN | 本轮不使用这些未经执行的结果支持结论；前述运行证据边界逐项列出                                       |

收尾记录：

- 格式初检 FAIL：审查入口存在多余结尾空行，本报告表格未符合 Prettier 格式；仅整理这两份 Markdown，原样归档的 Kimi 报告不作格式修改。
- `node node_modules/prettier/bin/prettier.cjs --check docs/REVIEW_FEEDBACK.md docs/plans/current.md docs/reviews/wechat-login-stage4/issues.md docs/reviews/wechat-login-stage4/round-09-codex.md docs/reviews/wechat-password-form-20261017/issues.md` 重检 PASS；`git diff --check` PASS。逐项状态计数为 19 VERIFIED、3 OPEN、1 FIXED_PENDING_REVIEW，与当前入口和计划一致；密码表单任务为 1 VERIFIED。
- 临时进程清理：`lsof -nP -iTCP:18096 -sTCP:LISTEN` 核实 Java PID 79454，与启动日志一致。普通权限下 `ps` 与 `kill -TERM 79454` 被沙箱拒绝；对已核实的本轮进程提升权限执行 `kill -TERM 79454` 成功。随后 18096 无监听；Maven 因主动终止子进程报告退出 143，不属于业务测试失败。隔离数据库保留以便复核，未停止 Docker 测试容器或用户开发服务。
- 四份既有文档与两份新增报告是全部未提交修改；暂存区为空，HEAD 不变。代码、测试、AGENTS.md、DECISIONS.md、AI_HANDOFF.md、验收表的差异检查为空；Kimi 源报告摘要一致，独立 worktree 与身份备份没有写入操作。
- 辅助目录 `git check-ignore` 检查 PASS；本轮探针与本地测试存储不会进入正常 Git 提交。日志和探针仅在本机 `.cache` 可用，跨机器复核须重新准备独立数据库与验证环境。

## Conclusion

`CHANGES_REQUIRED`。

Reviewed Commit 的 I004、I007、I016 仍存在。I017 当前文档已整理，等待独立复核。密码表单 R01 已经 Kimi 独立确认，归档为 VERIFIED。三项 OPEN 尚未获得修复授权或风险接受；本轮只提供处理建议。M01–M12、W01–W06 PASS 来自用户反馈，S01–S07 保持 BLOCKED，不由自动化验证替代。
