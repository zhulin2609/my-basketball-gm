# 微信登录阶段 4：历史发现核验与修复报告

## Metadata

- Task：`wechat-login-stage4`；Round：02；Mode：verification（历史发现核验 + 修复记录）。
- Reviewer / 修复执行：Kimi Code，会话标识 `kimi-stage4-review-fix-20261014`；Implementer（原实施）：Kimi Code（同一实施者继续修复，独立复核留待后续审查者）。
- Date：2026-10-14（Asia/Shanghai）。
- Branch：`mini-app-20261004`；Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit：`b87d67f2eaba02f1db31abec822bda3c9f15e3bd`；Reviewed Commit：`N/A`（未提交变更）；HEAD：`b87d67f2eaba02f1db31abec822bda3c9f15e3bd`。
- Snapshot：修复完成后工作区为当前快照；修复前轮次未建快照，历史发现按当前文件内容逐项核验（核验时仍含 2026-10-13 实施原貌，唯一先验差异为 2026-10-14 用户验收反馈驱动的导入刷新修复）。
- Scope：`git status --short` 全部未提交与未跟踪内容；`backend/`、`packages/`、`apps/` 实现与测试，以及计划文档。
- Requirements：`docs/plans/wechat-miniprogram.md` 第 4.3、5、11 节；`docs/DECISIONS.md` D-005；`docs/plans/current.md`；`AGENTS.md`。
- Write Scope：`docs/reviews/wechat-login-stage4/round-02-kimi.md`、`docs/reviews/wechat-login-stage4/issues.md`、`docs/REVIEW_FEEDBACK.md`、`docs/plans/current.md` 与授权范围内的实现修复。
- 上下文来源声明：本轮已读取 round-01-codex.md 原始报告、issues.md 与 REVIEW_FEEDBACK.md，属于针对历史发现的核验与修复，不构成独立审查。

## 核验与修复记录

每项记录：核验结论 → 修复内容 → 验证证据。

### I001 · blocker · 浏览器绑定凭据进入请求 URL 和访问日志

- 核验：成立。轮询把 `browserBinding` 放入查询参数，Nginx `log_format main` 记录 `$request`。
- 修复：`GET /auth/web-login-tickets/{ticket}` 改从请求头 `X-Login-Ticket-Binding` 读取；`createRequestSender` 支持额外请求头；查询 URL 不再包含绑定值。票据标识单独留在 URL，领取仍要求绑定值。
- 验证：`mvn test` 73 项通过；client 契约测试断言绑定值在请求头且路径不含 `binding`。

### I002 · blocker · 旧数据源仍能覆盖退出或切换账号后的状态

- 核验：成立。`attach` 不取消旧订阅；`swap` 无代次检查；账号写操作共用动态读取当前会话的 client。
- 修复：`guest-runtime.ts` 保留订阅取消函数，切换时取消旧订阅，加载加代次检查，迟到结果与失败不再写回；`runtime.ts` 为账号数据源创建绑定单个会话的 API 客户端（请求固定携带创建时的 token，401 只在全局会话仍是该会话时清除全局会话）。
- 验证：新增「切换数据源后旧数据源的写入通知不会写回快照」回归测试；`npm test` 124 项通过。

### I003 · major · 保存中的新编辑被旧响应删除

- 核验：成立。保存请求期间可继续编辑，旧响应无条件删除草稿并把页面置为已保存。
- 修复：`account-store.ts` 仅当草稿内容与提交内容一致时才删除草稿；`lineup-editor/index.tsx` 以引用比较判断保存期间是否有新编辑，有新编辑时保持「有草稿未保存」。
- 验证：新增「保存期间写入的新草稿不被旧响应删除」测试（真实 HTTP 延迟响应）；`npm test` 通过。

### I004 · major · 运行期间的 401 和刷新失败没有同步到页面状态

- 核验：成立。401 只清持久化会话；刷新失败仅写 console；战报详情无本地到期过滤。
- 修复：`runtime.ts` 的刷新统一处理：401 切换回游客工作区，其他失败进入 Screen 的失败状态（可重试）；`account-store.ts` 在加载与刷新时按当前时间过滤已过期战报；`report-detail` 在账号模式支持按 ID 从服务器读取详情。
- 验证：`npm test` 通过；401 切换路径由后端测试与账号数据源测试覆盖，真机路径保留给平台验收。

### I005 · major · 数据源切换失败后“重新读取数据”不会重新加载

- 核验：成立。`initializing` 保留已完成 Promise，`swap` 失败后重试直接返回旧 Promise。
- 修复：`guest-runtime.ts` 完成后释放进行中 Promise，记录当前需要的数据源，重试按当前数据源重新加载。
- 验证：新增「数据源切换失败后，重新读取按当前数据源重试」测试；`npm test` 通过。

### I006 · major · 登录时卸载认证组件导致新账号导入流程重复启动

- 核验：成立。认证页位于 Screen 的 ready 门内，登录触发的 swap 使组件卸载重挂。
- 修复：`Screen.tsx` 拆出 `PageShell`；认证页改用 `PageShell`，认证流程状态不再随数据源加载状态卸载。
- 验证：typecheck、构建与现有交互测试通过；真实登录流程的设备验收保留。

### I007 · major · 导入成功后账号快照未刷新，游客草稿也未清理

- 核验：部分已于 2026-10-14 修复（导入后等待刷新再进入页面）；游客草稿清理缺口成立。
- 修复：`importGuestProgress` 成功导入后清理 `dream-court.lineup-drafts.v1`（`clearGuestDrafts`）；进度查询改为只读 `peek()`。
- 验证：`npm test` 通过；导入清理路径由现有导入集成测试与前端测试覆盖。

### I008 · major · 已登录冷启动扫码时可能缺少创建游客工作区所需的随机标识符

- 核验：成立。`workspace.load()` 在工作区缺失时会创建并调用未准备的 `createIdentifier()`。
- 修复：`guest-workspace.ts` 新增只读 `peek()`；`hasGuestProgress` 与 `importGuestProgress` 改用 `peek()`，查询不再隐式创建工作区。
- 验证：新增「peek 只读查询：不存在时不创建工作区」测试；`npm test` 通过。

### I009 · major · 同一绑定的并发请求被错误报告为身份冲突

- 核验：成立。凭证读取在事务外，唯一约束冲突一律返回 IDENTITY_CONFLICT。
- 修复：`WechatAuthService` 在事务回滚后重新读取身份归属：同一账号的相同绑定按幂等成功返回会话；不同账号保持冲突；注册的并发/重试同样识别已完成结果。凭证消费失败区分已过期与已被并发完成。
- 验证：新增并发绑定（同凭证并发均 200、身份仅一行）、同身份两个凭证顺序绑定均 200、并发注册只建一个账号三项测试；`mvn test` 73 项通过。

### I010 · major · 凭证和票据的过期检查与状态更新不原子

- 核验：成立。状态更新 SQL 不含有效期条件。
- 修复：approve/reject/consume 与凭证消费的 UPDATE 增加 `expires_at > statement_timestamp()` 条件；服务层在更新落空时重新读取并区分已过期与已处理。
- 验证：新增「已批准但已过期的票据不能领取」「过期票据不提供小程序码」测试；`mvn test` 通过。

### I011 · major · Web 领取失败后永久停留在等待确认

- 核验：成立。收到 approved 后先停轮询再领取，领取失败无处呈现。
- 修复：`ScanLoginPanel` 领取期间保持轮询，暂时失败下一轮重试领取，终态（过期/拒绝/已领取/已处理）进入明确结束状态并可重新发起；后端 `status` 对过期 approved 也报告 expired。
- 验证：typecheck、Web 构建通过；交互细节保留给浏览器验收。

### I012 · major · 未配置微信时 Web 只显示失效图片

- 核验：成立。创建票据不检查微信配置，图片失败无处理。
- 修复：创建票据时未配置微信返回 503 `WECHAT_NOT_CONFIGURED`；Web 图片 `onError` 进入可见失败状态并提供重新获取入口。
- 验证：新增 `WechatNotConfiguredTest`（创建票据与交换均 503、密码登录不受影响）；`mvn test` 通过。

### I013 · major · 三处用户名规则的汉字范围不一致

- 核验：成立。Java 为 U+4E00–U+9FFF，core 与 V14 为一–龥（U+9FA5）。
- 修复：统一为 U+4E00–U+9FFF。core `username.ts` 改用 `一-鿿`；新增 V15 迁移重建数据库约束（V14 不修改）；Java 侧原已使用该范围。
- 验证：core 边界测试（鿿 通过、U+A000 拒绝、HTML pattern 一致）；`AuthApiTest` 增加 API 与数据库边界用例；`mvn test` 通过。

### I014 · major · 登录战报只加载最近 30 场，无法查看全部有效历史

- 核验：成立。固定 `limit=30`，详情只从列表查找。
- 修复：`GET /simulations` 增加 `offset` 分页参数；新增 `GET /simulations/{id}`（所有权与有效期校验，缺失 404）；client 增加对应方法；账号数据源分页读取全部有效战报，详情页列表未覆盖时按 ID 读取。
- 验证：新增 `SimulationApiTest`（分页遍历、详情统计、他人 404、过期 404）；`mvn test` 通过。

### I015 · major · 扫码及身份交换限频可通过更换绑定值绕过

- 核验：成立。票据配额仅按客户端可替换的绑定值计数；小程序码每次请求都访问微信；身份交换在调用微信前没有限频。
- 修复：票据创建增加全局每小时限额（数据库计数）；小程序码按票据缓存至过期，过期票据不再请求微信；身份交换在调用微信前增加进程内每分钟限额。阈值均为配置项。
- 验证：`mvn test` 通过（限频与未配置路径有测试）；真实配额消耗不进行，如实记录。

### I016 · major · 新测试使用伪造微信及业务响应

- 核验：部分成立。测试的传输与数据库为真实，被替代的是微信上游与契约响应；测试有效但确实不证明真实微信合同。
- 修复：保留断言，在 `WechatAuthApiTest`、`WebLoginTicketApiTest`、`account-store.test.ts` 明确记录替代边界；真实微信平台验收在计划与报告中保持 NOT RUN，不以测试通过冒充。
- 验证：现有测试继续通过；真实凭据验收待条件。

### I017 · minor · 当前计划的目标和完成状态相互矛盾

- 核验：成立。Goal 仍称只授权准备，Plan 第 4 节仍标待授权，Remaining Product Work 称阶段 4 未实现。
- 修复：更新 Goal、Plan 第 4 节标题与 Remaining Product Work，使其与已实施、验证中的当前状态一致；历史记录保留。
- 验证：文档检查通过。

## 本轮执行的验证

- `mvn test`：PASS；73 项测试全部通过（真实 PostgreSQL 16.10 测试库；含新增并发绑定、票据过期原子性、战报分页与详情、未配置微信、用户名边界用例）。
- `npm test -- --maxWorkers=1`：PASS；24 个测试文件、124 项测试全部通过。
- `npm run typecheck`：PASS；core、client、web、miniprogram 四包。
- `npm run build`、`npm run build:weapp`：PASS；小程序产物含全部十个页面。
- `npm run format:check`、`git diff --check`：PASS。
- 修复后本地栈：`docker compose build api && up -d api` 完成，Flyway 当前版本 15，健康检查通过；票据创建与请求头绑定查询经 Nginx 实测正常。
- Gitleaks 逐文件扫描全部修改文件：PASS（命中项逐行核对均为文案、类型声明、构造赋值、环境变量引用或测试占位，无真实凭据；允许名单未扩大）。
- 真实微信平台、iOS/Android 真机、Web 浏览器交互验收：NOT RUN；凭据与平台条件由用户侧验收继续。

## 额外发现（不在 I001–I017 范围）

- K01：`.env.docker.example` 中出现了微信配置值。经用户澄清为 `<你的小程序 AppID>` 等占位文本；按 UTF-8 字节长度核对（23/27 字节）与占位文本一致，无真实凭据。模板内容无需修改。

## 结论

`INCOMPLETE`：17 项历史发现已核验并修复，修复项均为 `FIXED_PENDING_REVIEW`，待独立审查者复核；真实平台验收未执行。
