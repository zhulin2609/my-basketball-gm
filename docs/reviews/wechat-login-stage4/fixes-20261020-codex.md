# I004、I007、I016 修复实施记录

日期：2026-10-20，Asia/Shanghai。本文件记录实施与自测，独立复核尚未执行。

## 版本与范围

- Task：`wechat-login-stage4`；实施任务：`wechat-login-stage4-fixes-20261020`。
- 实施者：Codex，`codex-stage4-takeover-20261016-01a1421b`；Owner codex / ACTIVE。
- Worktree：`/Users/zhulin/Workspace/my-basketball-gm`；Branch：`develop`。
- Base Commit / HEAD：`494c9ca5c7a45821dab2098964f5621c71b1cb53`；Reviewed Commit：N/A。
- Snapshot ID：`wechat-stage4-fixes-20261020-final`。完整输入保存在 `.cache/stage4-fixes-20261020-final/input/`；文件清单与 SHA-256 为同级 `snapshot.json`，工作区差异为 `changes.patch`，未跟踪输入同时保存在 input。快照包含源码、测试、配置、锁文件、需求、规则和文档；不包含 Git 忽略的凭据、身份备份、运行日志、依赖或构建产物。
- 比较：`git diff 494c9ca5c7a45821dab2098964f5621c71b1cb53`，并逐项读取 `git ls-files --others --exclude-standard`。HEAD 不代表本轮未提交修复。
- 需求依据：当前用户修复授权、AGENTS.md、D-005/D-006、第九轮报告中的 R01/R02/R03，以及问题清单 I004/I007/I016。I017 文档当前状态一并待独立复核。
- 保留：AGENTS.md、历史原始报告、用户验收表、本地身份备份、既有 Kimi worktree。没有提交、推送、合并或更新用户开发服务。

## 修改及覆盖

### I004

`packages/client/src/api.ts` 与 `session.ts` 将当前会话的 401 和本地到期通知宿主。响应按发起时的 token 核验归属；迟到的旧请求不能清除新会话。比较身份时不调用会清理过期值的 read，保证请求途中到期仍可触发恢复。

小程序新增 `services/session-recovery.ts`，集中创建会话专属客户端及恢复游客数据源。`runtime.ts` 的公共 API、账号专属 API 和数据源通知使用相同恢复函数；恢复同步取消账号订阅并进入加载状态。刷新不再对已处理或旧会话的 401 重复切换。

`session-recovery.test.ts` 使用真实注册会话、Spring Security 拒绝的无效凭据、透明代理延迟响应，覆盖身份、详情、写入、并发 401、匿名失败、请求前到期、在途到期、公共及会话专属客户端的迟到响应。测试不预设项目 API 状态或响应体。页面级 Taro 真机交互未执行。

### I007

`GuestImportService.java`、`GuestImportMapper.java` 与新增 V17 迁移将首次实际请求保存为 JSONB。重复请求先检查 owner，再检查请求内容：相同内容返回 alreadyImported；内容变化或历史记录没有 payload 时返回 409 `GUEST_IMPORT_CONTENT_CONFLICT`。同一事务中的唯一键冲突保证并发请求只导入一次。历史 Flyway 文件没有修改。

小程序新增 `services/guest-import.ts`，未保存草稿阻止导入，错误提示要求先保存。成功后只有会话、完整工作区和草稿原文均未变化才清理。`guest-store.ts` 导出草稿键，`runtime.ts` 使用该流程。Web `App.tsx` 同样按会话和完整快照保护清理。

`guest-import.test.ts` 覆盖首次成功、相同内容重试、已导入后继续编辑、同时间戳编辑、请求期间新增草稿、会话切换、未保存草稿、旧记录缺少 payload、跨账号冲突、相同及不同内容并发，以及含真实规则战报的导入。数据通过真实 Spring Boot HTTP 写入独立 PostgreSQL，本地工作区写入真实磁盘。既有刷新测试继续验证账号数据源读取服务端新数据。

行为边界：同一工作区首次成功导入后继续编辑，服务端不会覆盖首次结果或再次创建一套副本；未获确认的新增内容留在游客模式。V17 之前的历史记录缺少原始请求，也保留本地内容并拒绝幂等清理。该行为确保无法证明已上传的内容不被删除。

### I016

`scripts/vitest-backend.ts` 与 `vitest.config.ts` 为每次 Vitest 创建新数据库、构建并启动真实 Spring Boot，结束后停止服务并保留数据库和日志。JWT 与加密材料在运行时生成，不保存到报告。D-006 本地契约服务只提供外部微信接口。

`packages/client/src/testing/local-api-server.ts` 删除 respond 能力，改为真实服务透明代理。只能延迟原始响应；状态、响应头与内容均来自 Spring Boot。数据库写入失败通过限定账号的 PostgreSQL 触发器触发；票据领取首次失败通过限定票据的触发器和非事务 sequence 触发，finally 删除故障资源。

以下六个原测试文件全部迁移，原场景继续保留：

- `packages/client/src/api-wechat.test.ts`：6 项，真实凭证、绑定、注册、身份、票据领取、确认/拒绝及限流。
- `packages/client/src/lineup-service.test.ts`：3 项，保存顺序、新编辑保护、真实 500、恢复与 pending。
- `packages/client/src/battle-service.test.ts`：2 项，本地引擎不请求 API、等待真实保存后对战，并核对持久战报全部字段及球员统计。
- `apps/miniprogram/src/services/account-store.test.ts`：6 项，初始化、连续保存、草稿隔离、真实 500/401、新草稿保护及真实对战。
- `apps/miniprogram/src/services/guest-runtime.test.ts`：6 项，保留游客及订阅回归，真实 API 刷新；失败重试使用真实损坏磁盘内容。
- `apps/web/src/scan-login.test.tsx`：2 项，真实 App 领取失败后重试、真实数据库票据过期与重新发起。

后端原有测试全部保留。前端从 140 项增加到 158 项，新增 18 项来自 I004/I007 回归，没有用减少原场景来取得通过结果。

### I017 及文档

更新 `docs/plans/current.md` 的当前目标、基线、Owner、范围、状态、验证和完成情况；前次 develop 提交和推送根据 Git 与回执标记完成。历史段落保留并标明时间边界。更新 `docs/ARCHITECTURE.md`、当前审查入口和问题清单；旧 AI_HANDOFF 继续作为历史索引，当前没有交接。

## 实际验证

环境：Node 24.18、Java 21、Spring Boot 4.1.1、PostgreSQL 测试容器 `basketball-gm-test-pg`，端口 127.0.0.1:5432，数据库用户 zhulin。用户开发库位于另一容器，本轮没有访问。

在仓库根目录执行：

```sh
npm test
npm run typecheck
npm run build
MINI_API_BASE_URL=http://192.168.1.12:8088/api/v1 npm run build:weapp
git diff --check
```

- `npm test`：PASS，29 个文件、158 项。最终独立库 `stage4_frontend_1792454135057`，日志 `.cache/stage4-full-final.log`，服务日志与环境信息在 `.cache/integration-tests/stage4_frontend_1792454135057/`。
- `npm run typecheck`：PASS，四包；两端最终构建均再次执行四包类型检查。日志 `.cache/stage4-typecheck-final.log`。
- Web 构建：PASS，日志 `.cache/stage4-build-web.log`；存在大于 500 kB 的资源提示。
- 小程序构建及 verify-dist：PASS，日志 `.cache/stage4-build-mini.log`；存在 common.js 大于推荐大小及无异步分块提示。`ifconfig en0` 确认当前 IP 为 192.168.1.12，产物包含对应 API 地址。
- `git diff --check`：PASS。
- 文档及业务 TypeScript 格式检查：PASS；业务文件初检两处换行不符合 Prettier，手动编辑后重检通过。测试文件没有纳入这次格式检查。

后端命令：

```sh
docker exec basketball-gm-test-pg createdb -U zhulin stage4_backend_fix_20261020
cd backend
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/stage4_backend_fix_20261020 mvn --batch-mode --no-transfer-progress -Djava.io.tmpdir=/Users/zhulin/Workspace/my-basketball-gm/.cache/java-tmp test
```

- 建库及完整后端测试：PASS，83 项、0 failures/errors/skipped，包含 WechatAuthApiTest 17 项和 GuestImportApiTest 5 项。日志 `.cache/stage4-backend-full.log`。
- 前端 globalSetup 实际执行 `mvn --batch-mode --no-transfer-progress -Djava.io.tmpdir=<仓库>/.cache/java-tmp -DskipTests package`，并以显式独立数据库及运行时随机密钥启动 JAR；构建与健康请求 PASS。此 package 不计为后端测试执行，完整测试结果来自上一条命令。

首轮失败及处理：

- 四包类型检查首次 FAIL：Promise<Lineup> 不满足对战等待的 Promise<void>；改为等待保存完成。第二次 FAIL：Web ES2020 类型环境不支持 replaceAll；测试名称生成改为标准正则替换。后续 PASS。日志 `.cache/stage4-typecheck-first.log`、`.cache/stage4-typecheck-second.log`。
- 定向测试命令 `npm test -- packages/client/src/api-wechat.test.ts packages/client/src/lineup-service.test.ts apps/miniprogram/src/services/account-store.test.ts apps/web/src/scan-login.test.tsx`：首次 15 PASS、2 FAIL。删除账号后有效 JWT 的写请求实际触发外键错误 400；测试改为提交无效签名凭据，由真实 Spring Security 返回 401。战报详情与创建响应的同分球员统计顺序不同；断言仍比较全部字段、数量与统计内容，按照球员集合核对。日志 `.cache/stage4-targeted-first.log`，数据库 `stage4_frontend_1792453768480`。
- 中间完整执行 153、157 项分别 PASS，新增边界后最终 158 项 PASS；中间独立库 `stage4_frontend_1792453844531`、`stage4_frontend_1792453939187`、`stage4_frontend_1792454046870` 保留供追溯。

NOT RUN：本轮真实微信上游、手机扫码、iOS/Android 页面交互、S01–S07、Kimi 独立复核。历史 M01–M12、W01–W06 PASS 来自用户反馈，未被本轮自动化替代。

收尾核验：最终测试 API 端口 63767 已停止监听；独立数据库 V17 迁移成功，故障触发器残留为 0。AGENTS.md、AI_HANDOFF.md、DECISIONS.md、验收表及历史原始报告无差异，暂存区为空，HEAD 和 main 未变化。快照扫描匹配到两个既有测试加密常量，核对为 CredentialCipherTest 与 application-test.yml 的测试配置，没有新增真实凭据，未修改扫描规则。快照最终清单与源目录的摘要核对结果保存于同级 receipt.md。

## 交付状态

I004、I007、I016、I017 均为 FIXED_PENDING_REVIEW，汇总结论 INCOMPLETE。独立复核应针对快照执行，不能直接以旧 HEAD 代表修复。数据库和本机快照未随 Git 提交传播，其他机器需要取得快照后重新准备隔离环境。

建议下一轮：Kimi Round 10，Mode verification，报告路径 `docs/reviews/wechat-login-stage4/round-10-kimi.md`。在独立 worktree 中核验快照摘要，复核原触发条件、迟到响应、内容与草稿保护、真实 API 证据及 I017 当前文档一致性；执行完整测试并明确平台未验证范围。原工作区 Owner 继续 codex，不修改原工作区或既有 Kimi worktree。
