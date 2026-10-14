# 工作区代码审查

- 审查日期：2026-10-13。
- 工作区：`/Users/zhulin/Workspace/my-basketball-gm`。
- 分支：`mini-app-20261004`。
- 基线及当前 HEAD：`b87d67f2eaba02f1db31abec822bda3c9f15e3bd`。
- 范围：`git status --short`、相对基线的完整 diff，以及未跟踪的实现与测试文件。暂存区为空。已有产品决策与交接文档作为背景；审查重点为 `backend/`、`packages/`、`apps/`。
- 已按要求依次读取仓库规则、产品文档第 4.3、5、11 节、D-005、当前计划和相关架构章节。以下产品条款均指 `docs/plans/wechat-miniprogram.md`。
- 本次仅新增本文件；没有修改实现、测试、既有文档或 Git 提交。未跟踪的 `阶段4验收用例.xlsx` 未逐项核验，不作为执行过验收的证据。

## 审查发现

### R01 · blocker · 浏览器绑定凭据进入请求 URL 和访问日志

- **位置**：`packages/client/src/api.ts:137–140`；`backend/src/main/java/com/basketballgm/auth/WebLoginTicketController.java:35–42`。
- **问题**：轮询把完整 `browserBinding` 放入 `?binding=`，同一 URL 同时包含票据。领取接口只需要这两个值及已批准状态，读取访问日志的人可以在用户确认后抢先领取 JWT。已读取当前 Web 容器的 Nginx 配置，`log_format main` 记录 `$request`；仓库 `deploy/nginx/default.conf` 没有针对该接口移除查询参数。数据库只保存摘要无法避免这条日志泄露路径。
- **违反规则**：第 5.2 节禁止完整登录凭据进入日志；第 5.4 节及 A12 要求领取绑定发起浏览器。
- **修复方向**：将绑定值移至受控的请求头、请求体或适当保护的 Cookie，并保证代理与应用日志不记录其原文；保留服务端摘要校验。验证真实代理日志中无法同时取得领取所需材料。
- **证据**：客户端、服务端和实际 Nginx 配置确认；没有执行窃取会话操作。

### R02 · blocker · 旧数据源仍能覆盖退出或切换账号后的状态

- **位置**：`apps/miniprogram/src/services/guest-runtime.ts:28–45`；`apps/miniprogram/src/services/account-store.ts:43–60`。
- **问题**：`attach` 没有保存和调用订阅取消函数，回调无条件把原 store 写回全局快照；`swap` 也没有会话代次检查。账号 A 的刷新或写入在退出、登录 B 后完成，可以重新显示 A 的数据。写入队列还共用动态读取当前 token 的 API client，A 尚未开始的任务可能携带 B 的 token 执行。旧请求的 401 同样可能清除 B 的会话（`packages/client/src/api.ts:44–55`）。
- **违反规则**：第 4.3 节、A09：退出及切换账号时清理会话数据，旧请求不能显示上一账号数据或污染新账号。
- **修复方向**：切换时取消旧订阅，使旧 loader、刷新结果及排队写操作失效；请求发送、响应应用和清理会话均校验所属会话。避免旧任务自动取得新账号 token。
- **证据**：使用实际 `createGuestRuntime`、两个实际游客 store、真实磁盘存储和球员目录运行复现。切换 B 后输出 `after swap uses B: true`；刷新 A 后输出 `old refresh restores A: true`。账号队列影响由同一实现路径确认，未执行跨账号破坏性请求。

### R03 · major · 保存中的新编辑被旧响应删除

- **位置**：`apps/miniprogram/src/services/account-store.ts:89–95`；`apps/miniprogram/src/pages/lineup-editor/index.tsx:129–156`。
- **问题**：提交阵容 A 后，输入框和成员编辑仍然可用。用户编辑为 B 时会写入新草稿；A 的请求成功后，store 无条件删除该 ID 的最新草稿，页面又用提交时捕获的 A 设置 `dirty: false`。这会丢失 B，并显示保存成功。
- **违反规则**：第 4.2 节、P04 的草稿保留与真实保存状态要求；第 4.3 节的数据保留要求。
- **修复方向**：以编辑版本关联保存请求，仅清理与成功提交内容匹配的草稿；响应不得覆盖更新的编辑版本，更新期间的草稿继续显示未保存。
- **证据**：异步执行顺序和可编辑控件确认；未执行真机输入复现。

### R04 · major · 运行期间的 401 和刷新失败没有同步到页面状态

- **位置**：`apps/miniprogram/src/services/guest-runtime.ts:77–80`；`apps/miniprogram/src/services/runtime.ts:55–64`；`packages/client/src/api.ts:54–55`。
- **问题**：401 只清除持久化会话；切回游客的处理仅存在于首次初始化。运行期间刷新失败只写 `console.error`，页面继续显示账号快照，后续请求却已经没有 token，用户也看不到有效重试提示。战报详情直接使用缓存（`apps/miniprogram/src/pages/report-detail/index.tsx:15`），刷新失败后没有本地到期过滤，已过期战报仍可展示。
- **违反规则**：第 4.3、5.5 节，A09、P06、P10、P11，以及异步错误处理规则。
- **修复方向**：集中处理属于当前会话的 401，清除账号快照并恢复游客数据源；网络失败通过状态通知页面并提供重试；展示层同时遵守战报到期时间。旧会话的失败处理须遵守 R02 的隔离要求。
- **证据**：初始化、刷新、API 错误及页面读取路径确认。

### R05 · major · 数据源切换失败后“重新读取数据”不会重新加载

- **位置**：`apps/miniprogram/src/services/guest-runtime.ts:55–75`；`apps/miniprogram/src/components/Screen.tsx:23–32`。
- **问题**：首次初始化成功后 `initializing` 一直保留已完成的 Promise。后续登录触发 `swap`，如果账号数据加载失败，快照变为 `failed`；重试按钮调用 `initialize` 时直接返回旧 Promise，没有再次请求数据，所有依赖 Screen 的页面持续停留在失败状态。
- **违反规则**：P06 的登录数据切换要求，以及仓库关于错误处理、可验证恢复行为的规则。
- **修复方向**：统一初始化与切换的加载生命周期，完成后释放进行中的 Promise，失败后重试当前需要的数据源，同时处理并发加载代次。
- **证据**：Promise 生命周期与按钮调用关系确认。

### R06 · major · 登录时卸载认证组件导致新账号导入流程重复启动

- **位置**：`apps/miniprogram/src/pages/auth/index.tsx:75–104,118–123,295–296`；`apps/miniprogram/src/components/Screen.tsx:36`；`apps/miniprogram/src/services/runtime.ts:75–77`。
- **问题**：认证页面位于只在 runtime 为 `ready` 时渲染的 Screen 中。`loginWithSession` 发起异步切换时变为 `loading`，使 `AuthContent` 卸载；加载完成后重新挂载并再次执行 `startLogin`。新实例看到已保存的会话，按已有账号路径处理，可能显示导入选择；旧实例的 continuation 同时按 `newAccount` 自动导入。旧实例的错误或扫码确认状态更新已无法呈现，导入、跳过和页面跳转也可能相互竞争。
- **违反规则**：第 4.3 节及 A06 对新账号自动导入、已有账号主动选择、失败保留并重试的要求。
- **修复方向**：使认证流程状态独立于数据源加载引起的页面卸载，保留唯一且可恢复的登录后 continuation，统一完成导入与扫码确认步骤。
- **证据**：React 挂载条件与异步调用关系确认；真实微信登录尚未执行。

### R07 · major · 导入成功后账号快照未刷新，游客草稿也未清理

- **位置**：`apps/miniprogram/src/services/runtime.ts:95–107`；`apps/miniprogram/src/services/guest-store.ts:20,169–180`。
- **问题**：账号快照在导入前加载，导入完成仅执行 `workspace.clear()`。随后的账号页面、阵容页面没有加载导入结果，用户返回后看不到导入阵容，需要额外触发应用刷新或进入战报页。独立保存的 `dream-court.lineup-drafts.v1` 也未清理；退出账号重新创建游客工作区后，固定 ID `classic-five` 会关联上一工作区的旧草稿。
- **违反规则**：第 4.3 节、A06、P06：成功导入后使用账号数据并清空对应游客工作区，退出后恢复独立游客工作区。
- **修复方向**：导入完成后更新当前账号快照，并清理属于已成功导入工作区的草稿；清理前核验工作区和会话仍对应本次操作，失败或跳过时保留数据。
- **证据**：导入、存储键、游客初始化及页面刷新入口确认。

### R08 · major · 已登录冷启动扫码时可能缺少创建游客工作区所需的随机标识符

- **位置**：`apps/miniprogram/src/services/runtime.ts:43–52,86–92`；`apps/miniprogram/src/platform/identifier.ts:4,25–27`。
- **问题**：`prepareIdentifiers` 只在游客加载路径执行。成功导入清空游客工作区后，保持登录冷启动小程序并进入扫码认证页，会直接走账号加载；`hasGuestProgress()` 调用 `workspace.load()` 创建缺失的游客工作区，进而调用尚未准备的 `createIdentifier()`，抛出“创建数据前必须准备平台随机标识符”。重新登录按钮仍重复该路径。
- **违反规则**：第 4.3、5.4 节及 A12 的登录后扫码确认流程要求。
- **修复方向**：保证所有会创建工作区的调用都先完成平台随机值准备；进度查询可以采用无写入的读取接口，避免查询时隐式创建工作区。
- **证据**：冷启动初始化顺序与工作区缺失分支确认；平台运行未验证。

### R09 · major · 同一绑定的并发请求被错误报告为身份冲突

- **位置**：`backend/src/main/java/com/basketballgm/auth/WechatAuthService.java:93–107,162–170`。
- **问题**：凭证读取及成功重试判断在事务外，事务内始终插入身份。两个相同绑定并发读取未消费凭证后，第一个成功，第二个触发唯一约束并返回 `IDENTITY_CONFLICT`。同一身份已签发的两个有效凭证依次绑定同一账号，也会把第二次绑定报告为冲突。注册并发重试还可能先被用户名检查拒绝。约束能阻止重复记录，但所需的幂等成功行为没有覆盖这些路径。
- **违反规则**：D-005、第 5.2 节、A04/A05，以及本次预期“重复同一绑定幂等成功”。
- **修复方向**：在事务中锁定或原子处理凭证，重新检查已完成结果与双向身份归属；精确区分已有相同绑定和其他账号/身份冲突。并发唯一约束失败后需在可用事务中识别成功结果。
- **证据**：事务边界、唯一约束和插入顺序确认；当前测试主要验证顺序重试，本次未进行数据库并发压力复现。

### R10 · major · 凭证和票据的过期检查与状态更新不原子

- **位置**：`backend/src/main/java/com/basketballgm/auth/WebLoginTicketMapper.java:41–59`；`backend/src/main/java/com/basketballgm/auth/WechatCredentialMapper.java:54–58`。
- **问题**：approve、reject、consume 的 UPDATE 只检查状态，没有检查 `expires_at`。服务层提前读取和检查时间后，请求可能在密码校验、调度或数据库锁等待中跨过到期时间，随后仍成功确认、绑定或领取 JWT。单次消费的状态条件防止两次成功领取，无法保证实际消费时仍有效。
- **违反规则**：第 5.2、5.4 节，A12，以及身份凭证短期有效、票据过期明确结束的要求。
- **修复方向**：在取得相应锁后的同一事务中校验有效期与状态，或使用带有效期条件的原子更新；数据库时间取值应反映实际判定时刻，避免使用等待前固定的事务时间。
- **证据**：SQL 与服务时间检查位置确认；锁等待跨越到期边界的动态验证未执行。

### R11 · major · Web 领取失败后永久停留在等待确认

- **位置**：`apps/web/src/App.tsx:871–885`；`backend/src/main/java/com/basketballgm/auth/WebLoginTicketService.java:130–132`。
- **问题**：收到 `approved` 后先设置 `stopped = true` 并停止轮询，再执行领取。领取遇到网络失败、过期或重复领取时，catch 因 `stopped` 直接返回，页面持续显示等待。轮询本身也不处理 `consumed`，且后端只把过期的 `pending` 转为 `expired`，过期的 `approved` 会进入上述失败路径。领取等待期间退出面板后，成功响应仍会调用 `onAuthenticated`。
- **违反规则**：第 5.4 节、A12：到期、拒绝、重复领取均明确结束；异步异常必须处理。
- **修复方向**：分别管理组件失效、领取进行中和终态；处理所有终态及网络失败，显示重新发起入口；响应应用前检查当前面板和票据仍有效。
- **证据**：Web 状态机及服务端状态转换确认。

### R12 · major · 未配置微信时 Web 只显示失效图片，缺少明确反馈

- **位置**：`backend/src/main/java/com/basketballgm/auth/WebLoginTicketService.java:51–60,103–105`；`apps/web/src/App.tsx:902–906`。
- **问题**：创建票据不检查微信配置，仍返回成功。后续图片请求才触发 `WECHAT_NOT_CONFIGURED`，但 `<img>` 没有错误处理，也无法把该结构化错误交给创建票据的 catch，用户看到失效图片并持续等待至票据过期。
- **违反规则**：第 5.2 节要求缺少微信配置时明确显示该登录能力未配置。
- **修复方向**：创建扫码流程时检查能力配置，并为实际小程序码获取失败提供可见错误和恢复入口，保留密码登录入口。
- **证据**：配置检查调用链和图片渲染路径确认。

### R13 · major · 三处用户名规则的汉字范围不一致

- **位置**：`backend/src/main/java/com/basketballgm/auth/UsernameRules.java:9`；`packages/core/src/username.ts:7–10`；`backend/src/main/resources/db/migration/V14__add_wechat_identity_and_login_tickets.sql:9`。
- **问题**：Java 使用 U+4E00–U+9FFF，core 和 V14 使用“一–龥”，终点为 U+9FA5。例如“球员龦”（最后一个字符 U+9FA6）通过 Java 规则，却被 core 与 PostgreSQL 约束拒绝。直接注册请求最终可能被统一包装成“用户名已被占用”，与实际原因不符。
- **违反规则**：D-005、第 5.1 节、A11 和本次三处规则必须一致的明确要求。
- **修复方向**：明确统一的汉字范围，三处采用相同边界，并添加上下边界、字符数与非法字符的跨层验证；数据库约束失败需准确分类。
- **证据**：实际 core 和 PostgreSQL 对“球员龦”“球员鿿”返回 false，对“球员龥”返回 true；Java 源码范围明确不同。补充 JShell 探针返回前两项 true，但其退出阶段发生 preferences 存储错误，未将该进程记录为通过验证。

### R14 · major · 登录战报只加载最近 30 场，无法查看全部有效历史

- **位置**：`apps/miniprogram/src/services/account-store.ts:22–25,53–58`；`packages/client/src/api.ts:167`；`apps/miniprogram/src/pages/report-detail/index.tsx:15`。
- **问题**：新增账号数据源依赖固定 `limit=30` 的列表，页面没有分页，详情也只从该列表查找。账号存在 31 场未过期战报时，较早记录无法进入列表；新比赛或刷新还会使已经打开的有效详情消失。
- **违反规则**：第 5.5 节明确允许查看账号全部有效历史战报；P11。
- **修复方向**：提供可遍历全部有效记录的分页协议，并支持按 ID 读取经过所有权和有效期检查的详情。单纯扩大固定上限仍无法满足要求。
- **证据**：实际调用参数、列表渲染、详情查找以及后端列表接口确认。

### R15 · major · 扫码及身份交换限频可通过更换绑定值绕过

- **位置**：`backend/src/main/java/com/basketballgm/auth/WebLoginTicketService.java:51–59,103–105`；`backend/src/main/java/com/basketballgm/auth/WechatAuthService.java:73–84`。
- **问题**：票据配额只按客户端任意提交的 `browserBinding` 计数，Web 每次创建恰好都生成新值，因此连续创建不会触发同一个配额。小程序码接口无领取者绑定、有效期或频率限制，每次请求都访问微信接口，包括已过期票据。身份交换的计数发生在上游请求之后，非法 code 和已绑定身份的请求均不受该计数限制，无法保护微信调用配额。
- **违反规则**：第 5.3 节的接口限频要求、第 5.4 节的扫码限频要求。
- **修复方向**：对实际请求来源和相关身份设置并发安全的额度，在调用微信前限制请求；小程序码遵守票据生命周期并避免重复生成。客户端可任意替换的随机值不能独立承担来源限频。
- **证据**：计数键、调用顺序和 Web 创建逻辑确认；未对微信发起配额消耗测试。

### R16 · major · 新测试使用伪造微信及业务响应，违反仓库验证规则

- **位置**：`backend/src/test/java/com/basketballgm/auth/WechatAuthApiTest.java:50–75`；`backend/src/test/java/com/basketballgm/auth/WebLoginTicketApiTest.java:42–75`；`apps/miniprogram/src/services/account-store.test.ts:66–71,94–101,163–166`。
- **问题**：测试服务器把 `code-*` 拼成 openid，返回固定 access token 和 1×1 PNG；账号 store 测试则返回预设阵容、战报和保存结果。传输经过真实 HTTP，但认证、二维码和业务响应均由测试替身生成。这些测试没有验证真实微信合同，也没有验证前端与实际后端的账号隔离和业务结果。当前测试通过不能补足 R02–R15 的行为验证。
- **违反规则**：AGENTS.md 明确禁止 mock 和伪造方式；第 11.4 节要求真实平台验证，并遵守禁止 mock 的规则。
- **修复方向**：保留有价值的断言，改为真实 PostgreSQL、真实应用服务及实际业务结果的验证；微信接口使用真实凭据、开发者工具和真机验证，缺少条件的项目如实记录 NOT RUN。补充真实并发绑定、单次领取、会话切换和失败恢复用例，不能通过删除测试规避要求。
- **证据**：已检查响应生成代码，并实际运行现有测试。此项针对验证实现与规则冲突，不把 `MockMvc` 测试工具本身等同于被替换的业务服务。

### R17 · minor · 当前计划的目标和完成状态相互矛盾

- **位置**：`docs/plans/current.md:29,102–111,210`，对照同文件 `9–15,35–44`。
- **问题**：Task 和 Status 已写明授权实施、实施完成，但 Goal 仍称只授权准备，Plan 仍有待授权标题及本轮验证 NOT RUN，Remaining Product Work 又称阶段 4 尚未实现。部分已勾选验收也与本次发现冲突，下一位接手者无法据此确定当前任务边界。
- **违反规则**：AGENTS.md 要求 current plan 保存一致的当前任务状态，历史证据注明对应阶段并与当前事实区分。
- **修复方向**：由实施者更新当前目标、执行状态及受本次发现影响的验收项；保留并明确标注历史准备、交接和验证记录。本次没有修改这些文档。
- **证据**：同文件不同当前状态字段直接冲突；上一轮已确认的 D-005 和交接内容未作为新增实现缺陷列举。

## 已核对的实现

- `WechatExchangeRequest` 接收 code，身份由服务端 `jscode2session` 获取；未发现客户端 openid 被用于认证。新微信账号保存空 `password_hash`，密码登录明确拒绝空密码摘要。
- V14 包含两种身份唯一约束；注册账号、插入身份和消费凭证位于同一事务。身份确认凭证和浏览器绑定值在数据库中保存摘要。R01、R09、R10 分别描述日志、幂等与过期边界的问题。
- 扫码确认和拒绝接口要求认证，领取使用状态条件更新；两个并发领取无法都成功更新 `approved` 状态。公开状态响应不返回 JWT，小程序码参数包含票据标识。
- 游客导入在事务中预留工作区归属，生成新的阵容 client key，并重映射战报阵容及自定义球员引用；同工作区重试和跨账号冲突有实现与测试。现有导入集成测试通过，未发现该事务内的部分成功提交路径。
- 小程序账号对战调用规则模式，战报按 `engineVersion` 区分类型，读取历史战报不触发模型调用。
- V1–V13 相对基线没有修改；数据库新增文件为 V14。
- 已检查相关配置与响应构造，未发现明文 AppSecret 或微信 session key 写入本次源码和小程序构建产物。构建产物检查是指定标记检索，不构成对任意未知秘密的穷举证明。

## 本次执行的验证

- **PASS** — `npm test -- --maxWorkers=1`：24 个测试文件，119 个测试通过；包含 R16 所述测试替身限制。
- **PASS** — `npm run typecheck`：core、client、Web、小程序四个包检查通过。
- **PASS** — `npm run build`：Web 构建成功；仍有大于 500 kB 的产物体积提示。
- **PASS** — `npm run build:weapp`：Taro 4.3.0 微信小程序构建成功。
- **PASS** — `docker start basketball-gm-test-pg`：启动已存在的测试 PostgreSQL 容器。
- **PASS** — 在 `backend/` 执行 `mvn test`：真实 PostgreSQL 16.10；63 个测试，0 failures、0 errors、0 skipped；BUILD SUCCESS。
- **PASS** — `git diff --check b87d67f`：已跟踪变更无空白错误。
- **PASS** — `git diff --name-only b87d67f -- backend/src/main/resources/db/migration`：无输出，既有迁移未修改；新增 V14 由未跟踪文件清单确认。
- **FAIL（行为缺陷）** — 使用 Vite SSR 加载真实 runtime、guest store 和磁盘存储，切换 B 后刷新 A：进程正常退出，R02 的旧 store 恢复被实际复现。
- **FAIL（规则不一致）** — core 与 PostgreSQL 用户名边界探针：R13 的边界结果与 Java 规则不同；JShell 退出异常另行说明，未计为 PASS。
- **PASS** — 在 `apps/miniprogram/dist` 检索 `WECHAT_MINI_SECRET`、`WECHAT_MINI_APPID`、`JWT_SECRET`、`session_key`、`credential-encryption-key`、测试秘密标记：`rg -l` 无匹配，退出码 1 表示未命中。
- **PASS** — 读取当前 Web 容器 `/etc/nginx/nginx.conf` 及仓库代理配置：确认访问日志包含完整 `$request`，支持 R01。
- **NOT RUN** — 新库初始化、V13 升级 V14：本次 Maven 连接的数据库已为 V14；本次仅校验 14 份迁移，历史升级记录未计为本次结果。
- **NOT RUN** — 真实微信 code 交换、小程序码扫码、iOS/Android 与跨客户端验收：本次没有配置并执行真实微信平台及设备流程。
- **NOT RUN** — Web 完整浏览器交互回归、全部故障与并发场景动态复现：自动化通过仅覆盖现有测试；其余发现已标明代码路径证据。

## 真机验收结论

**当前不可以进入真机验收。** R01、R02 涉及领取凭据泄露和账号状态隔离，必须先修复；其余 major 问题也会影响身份绑定、扫码终态、游客导入、数据保存及验收证据。应完成修复和对应真实服务验证，再进入设备与微信平台验收。现有测试、类型检查和构建通过不足以确认这些产品行为正确。
