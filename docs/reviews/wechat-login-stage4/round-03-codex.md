# 微信登录阶段 4：修复复核报告

## Metadata

- Task：`wechat-login-stage4`；Round：03；Mode：verification。
- Reviewer / 汇总负责人：Codex，`codex-stage4-round03-20261014`；Implementer：Kimi Code，第二轮报告标识 `kimi-stage4-review-fix-20261014`。
- Date：2026-10-14（Asia/Shanghai）。
- 上下文：未参与本次业务实现；按用户要求读取第一轮原始报告及第二轮修复说明，属于针对性复核，不声称盲审。
- 来源 Branch：`mini-app-20261004`；原 Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- 验证及报告 Worktree：`/Users/zhulin/.codex/worktrees/stage4-review-024f7f4/my-basketball-gm`，detached HEAD。
- Base Commit：`b87d67f2eaba02f1db31abec822bda3c9f15e3bd`。
- Reviewed Commit：`024f7f4c472b0845928a144abd086d8cffd0bbd0`；本轮所有代码位置均指此版本。
- Scope：`git diff b87d67f2eaba02f1db31abec822bda3c9f15e3bd 024f7f4c472b0845928a144abd086d8cffd0bbd0`；逐项复核 I001–I017，并检查修复涉及的认证、数据源、草稿、票据、用户名、导入与历史战报路径。未进行其他产品模块的完整审查。
- Requirements：目标提交的 `AGENTS.md`、共享 code-review Skill、`docs/plans/wechat-miniprogram.md` 第 4.2、4.3、5、11 节、`docs/DECISIONS.md` D-005、相关架构与当前计划。
- Write Scope：本轮报告、`issues.md`、`docs/REVIEW_FEEDBACK.md`、必要的 `docs/plans/current.md`；独立工作区 Git 忽略目录内的验证辅助材料及构建输出。业务代码、测试、配置和历史报告不修改。

## 版本与环境核验

实际提交顺序与内容：

| Commit                                     | 内容                                                   |
| ------------------------------------------ | ------------------------------------------------------ |
| `ad1c4fc88139561eaef3fea0b7a6f5b4af502e7c` | 共享 Skill、仓库审查规则与第一、二轮审查材料，7 个文件 |
| `6d821413c272857b24d8c57ae4c6177c407be7f0` | 阶段 4 首次实现与修复，共 81 个文件                    |
| `3506fa1d497211afb72f6b28711c434dd622e967` | current plan 增加提交与推送记录                        |
| `024f7f4c472b0845928a144abd086d8cffd0bbd0` | 修改 AI_HANDOFF.md，但其正文仍描述旧的准备阶段         |

- `git ls-remote origin refs/heads/mini-app-20261004` 返回目标完整 SHA，与原工作区 HEAD 一致；没有执行推送。
- 原工作区没有已跟踪文件差异，仅有未跟踪 `阶段4验收用例.xlsx`。表格未读取、不作为本轮验收证据，SHA-256 为 `57198ae296bc6e56bc5a5c3a2bf9cf7605f75ad738894bd91d0f3f8676478033`。
- 首轮代码没有独立提交，报告未提供可还原的内容快照。无法精确还原首次实现到修复版本的差异；本轮比较范围包含首次实现。
- 原工作区 Owner 记录为 kimi，停止写入确认尚未取得，因此创建独立检出目录运行验证并写报告，原工作区保持只读。
- 验证使用 Node 24.18.0、Java 21.0.12.1、PostgreSQL 16.10。独立数据库为 `codex_stage4_review_20261014`，独立 API 端口为 18094，微信配置为空；没有修改运行中的产品服务、原测试数据库或真实微信数据。
- 使用现有 node_modules；workspace 包指向独立检出的源码，未安装或升级依赖。实际微信配置、原工作区 `.env` 与小程序私有配置未复制；构建不代表真实部署或设备验收。
- 第一轮报告 SHA-256 保持 `0d6573dd801e6cc6c3d653fc4dbbc3affa11f0b3e695a1e569356b992c1c4364`；第二轮保持 `42bac8d3e7f2bdbffbf1b7f4347e8391df406f17b127d80f752ca767dafba870`。

## I001–I017 逐项结论

以下 VERIFIED 仅适用于列出的原问题及本轮证据范围；平台验收缺口单独保留。

| 问题 | 状态                 | 目标版本证据与结论                                                                                                                                              |
| ---- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I001 | VERIFIED             | `api.ts:141–144` 改为请求头，Controller 要求该头；真实 API 查询成功、错误绑定返回 404。实际 Nginx main 日志格式不包含该请求头。新增跨域回归另记 I020。          |
| I002 | OPEN                 | 取消订阅只发生在新 store 加载完成后；真实磁盘探针复现加载期间旧数据恢复，旧刷新错误也缺少代次隔离。见 R01。                                                     |
| I003 | VERIFIED             | `account-store.ts:100–119` 按提交内容保护草稿；真实 API 保存 A 后，本地 B 草稿仍在，后端保存的是 A。页面以最新引用避免覆盖新编辑；新增 Hook 顺序缺陷另记 I019。 |
| I004 | OPEN                 | 只有刷新包装处理 401；保存、对战及其他直接 API 路径仍可能清除会话却保留账号快照。见 R02。                                                                       |
| I005 | VERIFIED             | 已完成初始化 Promise 释放，失败后使用 currentLoader；真实 JSON 存储读取失败、修复存储并重试后恢复 ready。旧通知覆盖状态的关联缺陷归 I002。                      |
| I006 | VERIFIED             | `auth/index.tsx:306–314` 改用 PageShell，认证组件已脱离 runtime ready 条件；原卸载重挂根因消除。保留挂载后暴露的 submitting 缺陷另记 I018；真实微信交互未执行。 |
| I007 | OPEN                 | 正常导入后已调用刷新并清理草稿，但清理前仍不校验当前会话和工作区版本；迟到导入可以删除新的游客数据。见 R03。                                                    |
| I008 | VERIFIED             | `hasGuestProgress` 与导入入口使用 peek；真实空磁盘查询返回 null，未创建文件或工作区。源码不再在该查询路径调用随机标识符。                                       |
| I009 | OPEN                 | 相同绑定冲突可以返回成功，但新凭证没有消费；真实 API 与 PostgreSQL 已复现。并发注册的事务外用户名检查仍有竞态。见 R04。                                         |
| I010 | OPEN                 | UPDATE 使用语句开始时刻，锁等待跨越到期时间后仍可消费；实际 PostgreSQL 复现。见 R05。                                                                           |
| I011 | FIXED_PENDING_REVIEW | 已移除领取前停止轮询的旧逻辑，处理 consumed、过期、拒绝并检查组件失效；缺少真实浏览器领取失败、重试及离开面板的运行验证，保留待复核。                           |
| I012 | VERIFIED             | 未配置微信时创建票据与 exchange 返回明确 503；独立真实应用/数据库测试通过，密码注册登录兼容。图片 onError 已设置可见失败状态；图片错误界面的平台交互未执行。    |
| I013 | OPEN                 | 目标提交 core 仍使用一–龥，Java/V15 已使用 U+4E00–U+9FFF；实际前端拒绝、API/数据库接受上边界。见 R06。                                                          |
| I014 | VERIFIED             | 真实后端生成 31 场战报，实际账号数据源读取全部 31 场并取得最早详情；现有真实应用测试覆盖分页、所有权与到期 404。该验证未覆盖并发新增记录期间的分页一致性。      |
| I015 | OPEN                 | 配额的 count/insert 非原子；同一票据的并发二维码请求与失败重试仍可重复调用微信。见 R07。                                                                        |
| I016 | OPEN                 | 增加边界注释后仍保留伪造微信和业务响应；与当前禁止 mock 的规则冲突。见 R08。                                                                                    |
| I017 | OPEN                 | Goal 等局部说明已更新，Plan、Open Questions、Completion 和交接仍有当前状态矛盾。见 R09。                                                                        |

历史 17 项：VERIFIED 7、OPEN 9、FIXED_PENDING_REVIEW 1。新增 I018–I020 均 OPEN；清单合计 20 项，OPEN 12、VERIFIED 7、FIXED_PENDING_REVIEW 1，其余状态 0。

## 未解决发现与新增回归

### R01 · blocker · I002：切换期间和迟到错误仍能影响当前数据源

- Location：`apps/miniprogram/src/services/guest-runtime.ts:32–60,92–104`；`apps/miniprogram/src/services/runtime.ts:104–112`。
- Trigger / Impact：A 的保存或刷新在 swap 已开始、新 store 尚未完成时返回，旧订阅仍可把快照改回 ready/A；新数据源加载失败后同样可能恢复 A。旧 A 刷新的 401/网络错误在 B 已加载后返回，refreshRuntimeAsync 无条件切换游客或设置失败，仍影响 B。
- Basis：产品第 4.3 节要求退出清理内存及异步响应校验所属会话。账号旧数据重新出现构成隔离缺陷。
- Evidence：实际 createGuestRuntime、两个实际游客 store、真实磁盘存储输出“切换完成前旧数据重新出现: true”“切换完成后隔离: true”“旧订阅覆盖失败状态: true”。迟到错误影响来自包装函数的明确调用路径，未运行真实微信多账号设备复现。
- Repair Direction：切换开始即使旧订阅失效；刷新成功、失败和全局状态更新均绑定发起时的数据源代次与会话，并覆盖切换进行中、切换失败和迟到 401。

### R02 · major · I004：写操作的 401 未触发账号退出状态

- Location：`packages/client/src/api.ts:45–61`；`apps/miniprogram/src/services/runtime.ts:104–112`；`apps/miniprogram/src/pages/lineup-editor/index.tsx:131–155`；`apps/miniprogram/src/services/account-store.ts:100–150`。
- Trigger / Impact：账号过期后直接保存阵容或发起对战，client 清除会话并抛出 401；页面只显示操作错误，runtime 继续保持账号数据源。只有经过 refreshRuntimeAsync 的请求才切回游客，保存/对战不经过该包装，旧账号数据与身份状态不一致。
- Basis：第 4.3、5.5 节及 A09 的会话失效与缓存清理要求。
- Evidence：源码路径确认；本轮未伪造 401 响应，未将后端密码测试当作小程序退出状态验证。详情读取的直接 api 调用也不经过该包装，失败被统一转为“战报已经到期或无法读取”。
- Repair Direction：将属于当前会话的失效处理覆盖全部认证请求，先验证代次再清理 runtime；保留未保存草稿与可恢复的错误状态。

### R03 · major · I007：迟到导入仍可清除更新后的游客工作区

- Location：`apps/miniprogram/src/services/runtime.ts:143–154`；`apps/miniprogram/src/pages/auth/index.tsx:72–81,143–156`。
- Trigger / Impact：导入等待期间离开认证页、退出账号或更新游客数据，原请求成功后仍无条件执行 workspace.clear 和 clearGuestDrafts。请求仅包含发起时的快照，后续新增的游客内容并未导入，却会被清除。
- Basis：第 4.3 节要求清空“对应”工作区、保留失败数据，并校验异步操作所属会话；第一轮 R07 已明确要求清理前校验工作区和会话。
- Evidence：源码确认读取发生在 await 前，删除发生在 await 后，之间没有会话、工作区 ID 或修改版本检查。正常导入的服务端事务测试通过，不能覆盖这个客户端时序。
- Repair Direction：将导入与清理绑定到发起时的会话、工作区和内容版本；失效 continuation 不继续清理或跳转，保留未导入的新编辑。

### R04 · major · I009：幂等成功路径遗漏凭证消费及并发注册重查

- Location：`backend/src/main/java/com/basketballgm/auth/WechatAuthService.java:127–148,178–210`。
- Trigger / Impact：同一身份的新凭证绑定到相同账号时，insert 触发唯一冲突；resolveBindConflict 返回会话，却没有消费本次凭证。注册冲突路径同样缺少消费。另有并发请求先读取未消费凭证、后看到另一请求已创建用户名的顺序，135–136 行会直接返回冲突，无法进入幂等结果解析。
- Basis：第 5.2 节、D-005 的成功事务消费凭证、相同绑定与成功重试幂等要求。
- Evidence：隔离 PostgreSQL 建立已绑定身份和未消费凭证作为服务状态输入，调用真实 bind API 成功；查询 consumed_at 仍为空。没有替代微信响应，此验证仅覆盖绑定服务状态。注册预检查竞态由控制流确认，未执行精确调度复现。
- Repair Direction：重复成功也在事务中校验并消费当前有效凭证；用户名冲突前重查同一凭证已完成结果，统一并发注册与绑定的过期、消费和归属语义。

### R05 · major · I010：语句开始时间无法覆盖行锁等待后的过期

- Location：`backend/src/main/java/com/basketballgm/auth/WebLoginTicketMapper.java:41–62`；`backend/src/main/java/com/basketballgm/auth/WechatCredentialMapper.java:62–65`。
- Trigger / Impact：UPDATE 在到期前开始并等待行锁，到期后取得锁；statement_timestamp 仍为语句开始时间，允许消费过期票据。相同条件用于批准、拒绝及身份凭证消费。
- Basis：第 5.2、5.4 节与第一轮 R10 明确要求实际判定时刻的有效期约束。
- Evidence：在独立库用实际迁移表和 mapper 的消费 SQL，另一连接锁定票据 8 秒，票据 6 秒后到期。输出 `consumed|t|2.1`、`UPDATE 1`；数据库实际已过期约 2.1 秒仍消费成功。探针进程退出 0 表示缺陷复现成功，业务判定 FAIL。
- Repair Direction：先取得所需锁，再使用实际时刻核验状态和有效期；验证全部状态转换的等待跨界行为，避免只测请求开始前已经过期的情况。

### R06 · major · I013：前端汉字范围修复未进入目标提交

- Location：`packages/core/src/username.ts:7–10`；对照 `backend/src/main/java/com/basketballgm/auth/UsernameRules.java:9` 与 V15 第 6 行。
- Trigger / Impact：用户名包含 U+9FA6–U+9FFF 时，后端和数据库接受，两端表单拒绝。同一合法账号可能无法通过密码表单登录或绑定。
- Basis：第 5.1 节、D-005 要求三处校验一致。
- Evidence：实际前端函数对“球员龥”返回 true，对“球员龦”“球员鿿”返回 false；真实 API 与 PostgreSQL 接受包含 U+9FFF 的用户名。目标 username.test.ts 没有第二轮报告所称的上边界新增用例。
- Repair Direction：统一前端正则与 HTML pattern 的范围，并用实际 Java API、数据库与两端规则执行一致的上下边界验证。

### R07 · major · I015：并发及失败路径仍可绕过微信调用保护

- Location：`backend/src/main/java/com/basketballgm/auth/WebLoginTicketService.java:65–73,117–124`。
- Trigger / Impact：并发创建先读取相同计数再各自插入，可以超过配额；同一有效票据同时请求二维码，在缓存填充前都会调用上游；上游失败不写缓存，继续请求仍可重复消耗配额。全局票据数量限制无法约束同票据重复请求。
- Basis：第 5.3、5.4 节及第一轮 R15 的并发安全、上游调用前限频要求。
- Evidence：count 与 insert 之间没有事务锁或原子配额操作；缓存是 get→上游请求→put，ConcurrentHashMap 不使整个序列原子。exchange 新增的调用前计数已核对，未对真实微信进行配额消耗测试。
- Repair Direction：原子预留创建额度，对同票据生成过程合并并发请求，并在上游调用前覆盖成功、失败及重试的频率限制。

### R08 · major · I016：测试仍生成替代认证和业务响应

- Location：`backend/src/test/java/com/basketballgm/auth/WechatAuthApiTest.java:55–82`、`WebLoginTicketApiTest.java:65–85`；`apps/miniprogram/src/services/account-store.test.ts:66–76,100–108`。
- Trigger / Impact：测试仍拼接 openid、返回固定微信 token/图片、预设阵容和保存响应；新增注释没有改变测试行为，无法满足当前禁止 mock 的规则，也不能证明真实微信及前后端协作。
- Basis：当前用户及仓库禁止 mock 的验证要求；第一轮 R16。
- Evidence：源码确认；第二轮将“测试边界说明”列为修复。本轮没有运行这些替代响应测试，也没有删除或更改它们；使用真实服务与隔离数据库补充有限范围验证。
- Repair Direction：保留有价值的断言，将业务协作验证连接实际服务与数据库；真实微信验证依赖实际平台条件，缺失继续记录 NOT RUN。规则变更须由用户决定。

### R09 · minor · I017：当前任务说明仍混有过期状态

- Location：目标 `docs/plans/current.md:101–108,314,625–629`；`docs/AI_HANDOFF.md:5–22,57–61`；目标审查入口与问题清单顶部。
- Trigger / Impact：接手者按 current plan 看到实施未勾选、验证“本轮 NOT RUN”、详情接口未新增及“未提交、未推送”；交接仍要求准备阶段且称尚未实现，与已提交代码及验证记录冲突。
- Basis：AGENTS.md 的状态一致性与可追溯交接要求。
- Evidence：目标提交文档逐项核对；实际已有详情接口、四次提交及远端目标 SHA。本轮绑定审查入口与清单，保留原始报告与交接文件，不能据本轮文档修改宣称目标提交的 I017 已修复。
- Repair Direction：区分当前任务状态与带日期的历史背景，更新现行 Plan、Open Questions、Completion 和交接索引，保留历史验证范围。

### R10 · major · 新增 I018：认证成功后后续按钮保持禁用

- Location：`apps/miniprogram/src/pages/auth/index.tsx:114–141,143–161,236–276`。
- Trigger / Impact：submit 开始设 submitting=true；绑定或注册成功后直接进入 import-choice 或 confirm-ticket，成功路径没有恢复 false。对应按钮 disabled={submitting}，处理函数也立即返回，已有账号导入选择和首次扫码确认无法继续。
- Basis：第 4.3 节、5.4 节的新账号/已有账号导入与主动扫码确认流程。
- Evidence：同一 AuthContent 状态持续挂载，成功路径与 disabled 条件形成确定控制流；未使用伪造微信响应执行页面测试，真实设备复现 NOT RUN。
- Repair Direction：为每个提交阶段完成成功和失败清理，使后续步骤可操作；验证绑定成功后的导入/跳过及注册完成后的扫码确认。

### R11 · major · 新增 I019：草稿恢复跨越条件 Hook

- Location：`apps/miniprogram/src/pages/lineup-editor/index.tsx:73–90`。
- Trigger / Impact：草稿读取失败时在 useRef(latestLineup) 之前返回；用户恢复存储并点击重新读取后，组件转为 ready，新增执行该 Hook，违反 Hook 调用顺序，React 将报告渲染 Hook 数量变化，恢复入口无法正常使用。ready→failed 同样改变数量。
- Basis：仓库 React Hooks 规则；第 4.2 节及 P04 的草稿错误恢复要求。
- Evidence：该 useRef 是本次差异新增，位于错误分支提前返回之后；现有 tsc 不检查 Hook 调用顺序。未进行小程序真实存储失败的界面验证。
- Repair Direction：将所有 Hook 放在条件返回之前，保持每次渲染的调用顺序，并验证真实存储失败到恢复的页面流程。

### R12 · major · 新增 I020：绑定请求头未加入 CORS 允许列表

- Location：`backend/src/main/java/com/basketballgm/config/WebConfig.java:11–15`；`packages/client/src/api.ts:141–144`。
- Trigger / Impact：使用配置允许的开发站点跨域访问 API 时，轮询增加 X-Login-Ticket-Binding 触发预检，该头不在 allowedHeaders 中，浏览器无法发送状态请求，扫码登录持续等待。同源 Nginx 部署不受这个 CORS 路径影响。
- Basis：I001 修复涉及的客户端/服务端协议兼容及既有 Web 入口回归。
- Evidence：对目标版本独立 API 发送 Origin=http://localhost:5173、请求方法 GET、请求头 x-login-ticket-binding 的真实 OPTIONS，返回 `403 Invalid CORS request`。
- Repair Direction：允许该受控请求头并验证完整预检及轮询；保持现有明确来源限制。

## 本轮验证与覆盖边界

所有命令在上述独立工作区运行，除明确注明的原工作区只读 Git/摘要核验。

| Command / 检查                                                                                                                                                                                                                  | Result            | 覆盖与限制                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short --branch`、`git rev-parse`、`git log`、各提交 `git show --stat`、`git ls-remote origin refs/heads/mini-app-20261004`                                                                                        | PASS              | 本地及远端版本、提交顺序和范围；未推送                                                                                                                                        |
| `npm run typecheck`                                                                                                                                                                                                             | PASS              | core、client、web、miniprogram 四包；首次独立依赖引用缺少 Taro 类型，补齐引用后通过                                                                                           |
| `node node_modules/vitest/vitest.mjs run packages/core/src packages/client/src/guest-workspace.test.ts apps/miniprogram/src/services/guest-store.test.ts --maxWorkers=1`                                                        | PASS              | 12 个文件、63 项；纯规则与实际磁盘游客存储，不覆盖微信认证页面                                                                                                                |
| `mvn --batch-mode --no-transfer-progress -Dspring.datasource.url=jdbc:postgresql://127.0.0.1:5432/codex_stage4_review_20261014 -Dtest=AuthApiTest,GuestImportApiTest,SimulationApiTest,WechatNotConfiguredTest test`（backend） | PASS              | 4 组、16 项；真实 Spring 服务及 PostgreSQL，新库 V1–V15 初始化；密码认证、用户名数据库规则、导入新键/幂等、详情与未配置微信。MockMvc 仅作为 HTTP 层测试工具，没有替换业务服务 |
| `runtime-probe.ts`（Vite SSR 执行）                                                                                                                                                                                             | FAIL（业务判定）  | 进程退出 0；真实 store/磁盘复现切换前泄露与失败状态被旧通知覆盖                                                                                                               |
| `account-probe.ts`（Vite SSR 执行）                                                                                                                                                                                             | PASS / 缺陷已复现 | 保存 A 保留 B、真实存储重试、只读 peek、真实生成并加载 31 场战报通过；CORS 返回 403，业务判定 FAIL                                                                            |
| `auth-probe.ts`（Vite SSR 执行）                                                                                                                                                                                                | PASS / 缺陷已复现 | 请求头绑定正确/错误行为通过；API/数据库接受上边界；同绑定成功后凭证未消费，业务判定 FAIL。身份和凭证为隔离库状态输入，不代表微信身份交换已验证                                |
| `node .cache/code-review-round03/expiry-probe.mjs`                                                                                                                                                                              | FAIL（业务判定）  | 进程退出 0，锁等待后过期消费成功；探针初次语法错误修正后运行，未修改业务文件                                                                                                  |
| `npm run build`                                                                                                                                                                                                                 | PASS              | Web 生产构建；主资源约 600.71 kB，保留体积提示                                                                                                                                |
| `npm run build:weapp`                                                                                                                                                                                                           | PASS              | 小程序构建；common.js 约 285 KiB。首次 workspace 依赖指向原目录导致编译失败，修正独立依赖引用后通过。未使用真实私有项目配置                                                   |
| 实际 Nginx 配置读取                                                                                                                                                                                                             | PASS              | 现有 main 日志格式仅记录 request 等字段，不记录新绑定请求头；未读取真实请求日志                                                                                               |
| 完整 `npm test` / 完整 `mvn test`                                                                                                                                                                                               | NOT RUN           | 其中包含 I016 的替代响应测试；本轮采用上述明确范围，未声称重跑 Kimi 的 124/73 项全量结果                                                                                      |
| 真实微信 exchange、二维码生成、浏览器完整扫码领取、iOS/Android 及存储失败页面恢复                                                                                                                                               | NOT RUN           | 无本轮隔离的实际微信登录与设备交互验证；I011 保留待复核，相关平台验收继续未完成                                                                                               |

验证辅助脚本和日志位于独立工作区 `.cache/code-review-round03/`，属于本地忽略材料，不保证其他机器可访问。Vite SSR 调用使用 `createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{"@catalog":process.cwd()+"/backend/src/main/resources"}}})`，执行相应脚本后关闭服务。服务启动只使用进程临时生成的签名/加密密钥，不保存到报告。独立数据库仅为本轮验证使用；收尾停止独立 API 并移除该数据库，产品容器保持运行。

## 文档差异与结论

收尾核验：四份输出通过 Prettier 检查，`git diff --check` 通过。`node .cache/code-review-round03/validate-docs.cjs` 使用现有 Markdown 解析器确认 I001–I020 状态与计数、59 个本地文档链接、目标完整 SHA、仅四份授权文档发生变化、原工作区已跟踪内容未变、未跟踪表格摘要不变、两份历史报告与目标提交逐字节一致。独立 API 已停止，18094 无监听；本轮隔离数据库已删除，查询 pg_database 返回匹配数量 0。独立检出目录与本地验证材料保留，便于查看报告；原工作区未写入本轮材料。

第二轮 I013 声称前端范围及边界测试已修复，与目标提交实际内容不符；I010 的过期保障声明被行锁复现否定；I016 的注释没有消除规则冲突。第二轮所有验证结果保持为其历史自报，本轮没有将其作为执行证据。

`CHANGES_REQUIRED`。目标版本仍有 9 项历史缺陷、3 项新增回归，另有 I011 等待必要运行验证。已验证的 7 项不表示阶段 4 整体通过；真实微信、浏览器扫码完整流程及两种手机平台验收均未完成。未获得任何风险延期批准。本轮没有修复业务代码、提交、推送、合并或发布。
