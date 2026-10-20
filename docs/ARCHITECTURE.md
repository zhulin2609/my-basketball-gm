# Architecture

描述当前模块、数据流和系统边界。长期设计理由见 `docs/DECISIONS.md`；当前任务与验收状态见 `docs/plans/current.md`。

## 系统边界

My Basketball GM 包含浏览器前端、微信小程序、Spring Boot API 和 PostgreSQL。

- 前端：React、TypeScript、Vite，位于 `apps/web`，入口为 `apps/web/src/main.tsx` 和 `apps/web/src/App.tsx`。
- 小程序：Taro 4.3.0、React 18.3.1，位于 `apps/miniprogram`，入口为 `src/app.tsx`；当前实现游客端，游客流程使用本地数据。
- 共享包：npm workspaces 管理 `packages/core` 与 `packages/client`。core 提供领域类型、球员目录、阵容校验、成员显示顺序、最佳球员、规则引擎与列表选择器，禁止依赖 React、DOM、存储、网络与 i18n；client 提供 REST 契约、会话、游客工作区、阵容保存队列与对战编排，存储、HTTP、ID、时钟与随机种子通过 `ports.ts` 由应用注入。
- 后端：Java 21、Spring Boot、MyBatis，入口为 `backend/src/main/java/com/basketballgm/BasketballGmApplication.java`。
- 数据库：PostgreSQL 16，结构由 `backend/src/main/resources/db/migration/` 中的 Flyway 迁移维护。

本地开发时，前端运行在 `127.0.0.1:5173`，Vite 将 `/api` 请求代理到后端 `127.0.0.1:8080`。

单机部署使用根目录 `compose.yaml`：`web` 容器构建并通过 Nginx 提供前端，同时把 `/api` 反向代理至 `api`；`api` 运行 Spring Boot 与 Flyway；`postgres` 运行 PostgreSQL 16，数据写入命名卷。生产环境变量由服务器上的 `.env` 注入，详细操作见 `docs/deployment.md`。

## 前端

### 页面和共享状态

`apps/web/src/App.tsx` 管理当前页面、认证会话、球员、阵容和战报的共享状态。主要页面包括球员库、我的阵容、梦幻对战、社区、AI 设置和登录或注册。

页面状态以 URL hash 为准（`apps/web/src/lib/hash-route.ts` 的 `useHashRoute`）：格式为 `#/players`、`#/lineups`、`#/battle`、`#/community`、`#/community/<帖子id>`、`#/ai-settings`、`#/auth`。挂载时从 hash 恢复当前页面，`navigate` 同步更新状态并写 hash，`hashchange` 监听支持浏览器前进/后退。无法识别的 hash 回退到球员库；`ai-settings` 要求登录、`community` 要求 API 启用，条件不满足时回退到球员库且 URL 保持不变。

球员库网格（每页 12 名）与我的阵容候选列表（每页 9 名）通过 `apps/web/src/lib/use-pagination.ts` 分页；搜索、过滤或排序条件变化时回到第 1 页。社区帖子列表（每页 10 帖）与评论（每页 20 条）由服务端分页，前端复用同一个分页组件。

页面文案位于 `apps/web/src/i18n/resources.ts`，当前支持简体中文和英文。

### 数据来源

- 公共球员目录由 `packages/core` 的 catalog 入口（`@dream-court/core/catalog`，含 `data/players.ts` 与 `data/historical-players.generated.ts`）提供；397 名历史球员的中文名称位于 `backend/src/main/resources/player-catalog-chinese-names.json`，通过 `@catalog` 别名在构建时打包；球员可带可选中文名称，简体中文界面用“英文名（中文名）”显示，并把中文名称纳入搜索。
- 游客数据的本地存取边界在 `packages/client/src/repository.ts`（阵容、战报 20 场上限与 30 天清理、球员覆盖），浏览器存储等平台能力由 `apps/web/src/lib/runtime.ts` 注入；目录与用户覆盖的合并在 core 的 `player-overrides.ts`。
- 公共 REST 契约与会话在 `packages/client`（`api.ts`、`session.ts`）；Web 专属的社区与 AI 接口在 `apps/web/src/lib/api.ts`。非 2xx 响应抛出携带 `status` 与 `code` 的 `ApiError`。
- `apps/web/src/lib/errors.ts` 把社区写操作的错误码映射为本地文案；无 code 的错误保持拼接后端 message 的既有行为。
- `packages/core` 的 `simulator.ts` 提供游客和登录用户都可以使用的本地规则引擎，seed、战报 ID 与创建时间由调用方传入。
- `packages/core` 的 `player-of-the-game.ts` 从战报统计中评选本场最佳球员，本地战报与云端战报复用同一公式。

### 游客数据

`packages/client/src/guest-workspace.ts` 把游客球员修改、阵容和战报保存在统一本地工作区。工作区使用稳定 UUID，并通过 `hasUserProgress` 区分示例数据和用户实际修改；内置阵容保留 `classic-five` 键。存储通过注入的 StoragePort 访问，旧浏览器存储键的一次性迁移由 `apps/web/src/lib/guest-legacy.ts` 提供并注入。

`packages/client/src/guest-import.ts` 把工作区转换为后端导入请求。注册会自动导入；登录已有账号时由用户决定是否导入。导入成功后才会清空工作区；快照字段无法恢复时抛出结构化错误（`GuestImportDataError`），文案映射留在 Web。

### 登录数据

存在有效认证会话时，球员、阵容、AI 设置和战报通过 `packages/client` 的 API 客户端访问后端。JWT 保存在 localStorage 的 `dream-court.auth-session.v1`，会话过期判断使用注入的时钟。登录页同时提供用户名密码与小程序扫码两种方式：扫码登录创建与当前浏览器绑定的短期票据并展示服务端生成的小程序码，用户在小程序中主动确认或拒绝后，浏览器凭绑定值一次性领取会话。

## 微信小程序

`apps/miniprogram/src/app.config.ts` 注册十个页面，底部入口为球员、阵容、对战、我的。球员浏览提供中文搜索、位置过滤和分页；独立编辑页与球员选择页处理阵容成员；战报列表与详情使用历史快照。`pages/auth` 提供微信登录、已有账号绑定、免密码新账号创建、游客导入选择与扫码登录确认。

`src/services/data-store.ts` 定义页面统一面对的数据源接口，修改类操作均为异步。`src/services/guest-store.ts` 实现游客本机数据源，`src/services/account-store.ts` 实现登录账号的 API 数据源（写操作串行执行，草稿按账号隔离保存在本机）。`guest-runtime.ts` 管理加载、失败、就绪与数据源切换；`runtime.ts` 连接平台实现、会话与 React 订阅，登录后切换为账号数据源，退出或会话失效恢复游客工作区。登录后阵容、规则对战（`simulationMode: 'local'` 表示服务端规则引擎）与战报读取调用后端；战报列表与详情按 `engineVersion` 标示“规则对战”或“AI 对战”。

`src/services/guest-store.ts` 通过 client 的游客 repository 读写工作区，复用 core 的目录、校验、模拟与最佳球员计算。游客数据协议保持稳定 UUID、schemaVersion、hasUserProgress、20 场上限与 30 天保留期。示例初始化不计入实际进度。编辑草稿使用独立存储键 `dream-court.lineup-drafts.v1`（账号模式下按账号 ID 加后缀隔离），逐次输入同步保存；正式保存通过校验后清理草稿，选中阵容仍有草稿时对战返回错误。

`src/services/guest-runtime.ts` 管理加载、失败和已就绪状态；初始化失败后允许重新读取，初始化进行中复用同一个请求，成功后复用游客服务。`runtime.ts` 连接平台实现与 React 订阅，并在初始化时校验 `MINI_API_BASE_URL`。`src/platform/storage.ts` 使用 Taro 同步存储并传播错误；`identifier.ts` 通过平台密码学随机数据与 uuid 提前准备 UUID；`http.ts` 实现公共 HttpPort。游客流程不调用后端。

client 的请求层按发起请求的 accessToken 处理 401，通知宿主后仅清除仍属于该请求的会话。小程序 `session-recovery.ts` 同步移除账号视图并恢复游客数据源；直接身份、详情请求和账号专属客户端共用这一流程。旧会话的迟到响应不能清除新会话；比对会话身份时不进行到期清理，确保在途请求跨过本地到期时间后仍会通知运行时。

小程序 `guest-import.ts` 在发送前拒绝未保存草稿；成功响应后比较完整工作区、草稿原文和会话，任何变化都保留本地数据。Web 导入同样核对会话与完整工作区。服务端拒绝内容不匹配的幂等重试时，客户端保留工作区并显示错误。已导入工作区继续编辑后不能覆盖此前导入内容，新增编辑保留在游客模式。

编辑页进入球员选择页时，只有存在未保存编辑才写入草稿。编辑页与选择页读取草稿失败后停止编辑、显示错误并提供重新读取入口；原始草稿和正式工作区数据保留。正式保存先读取草稿存储，通过读取与校验后再写入阵容。

小程序单独安装 React 18，并在 TypeScript 与 Webpack 中指向该版本；`react-dom` 由 Taro 框架插件解析为 `@tarojs/react` 小程序渲染器。共享源码进入 Taro 的编译范围，Web 使用自身的 React、ReactDOM 和 Vite 配置。仓库维护 `apps/miniprogram/project.config.example.json`，真实 `project.config.json` 与开发者工具私有配置保存在本地，并由 Git 和 Docker 忽略；Taro 构建读取本地真实配置。

## 后端

后端按业务模块组织：

- `auth`：注册、登录、JWT 颁发和当前用户；微信 code 交换、免密码注册、已有账号密码验证绑定与绑定状态查询；Web 扫码登录票据的创建、查询、确认、拒绝、领取与小程序码生成。用户名规则（汉字、英文字母、数字、下划线、连字符，2–32 字符，见 D-007）由 `UsernameRules` 与前端共享包及数据库约束保持一致。
- `player`：公共球员目录、用户属性覆盖和自定义球员。
- `lineup`：用户阵容与阵容成员。
- `simulation`：本地规则模拟、战报保存、查询和到期清理。
- `llm`：OpenAI 兼容接口配置、API Key 加密和 AI 模拟。
- `guest`：游客工作区导入、幂等控制和球员 ID 转换。
- `forum`：社区公开阵容的发布、浏览、评论和复制。
- `moderation`：社区写路径的内容审核（本地 DFA 词表加腾讯云 CMS）与滥用限频。
- `user`：当前用户解析与管理员名单（`AdminRegistry`）。
- `config`：Spring Security、统一错误响应和跨模块配置。

Controller 处理 HTTP 和认证边界，Service 执行业务规则与事务，MyBatis Mapper 负责 SQL。用户归属从 JWT 中读取，客户端不能指定 owner ID。

### 社区内容治理

公开阵容（名称与描述）和发表评论这两条写路径在写入前依次经过三层检查：

1. `ModerationService.check` 在 Controller 层、数据库事务之外执行：先过本地 DFA 词表（`moderation-words.txt`），配置腾讯云密钥后再同步调用 TMS `TextModeration`（3 秒超时）。词表命中返回 422，云服务失败或超时返回 503，未审内容不会写入数据库。
2. `ForumWriteGuard` 在 Service 事务内做计数限频：评论每秒钟 1 条、每天 50 条，发帖每小时 3 次（只计新建帖子；帖子列表按创建时间排序，更新公开内容不会顶帖，因此不占额度）。超限返回 429。
3. 同一 Guard 做新账号链接限制：注册不满 24 小时的账号发布含 `http://`、`https://`、`www.` 的内容返回 403。

审核失败不消耗限频额度（限频只统计已落库的行），限频失败不触发审核之外的写入。错误的结构化码（`CONTENT_REJECTED`、`RATE_LIMITED`、`MODERATION_UNAVAILABLE`、`LINK_RESTRICTED`）由 `ApiException` 携带，统一错误处理器输出 `{message, code}`；命中的词条不会出现在响应中。

管理员名单来自配置 `app.admin.usernames`（环境变量 `FORUM_ADMIN_USERNAMES`）。管理员可以删除任何人的帖子与评论；`/auth/me` 与登录、注册响应的用户对象带 `admin` 字段，前端据此对他人的内容显示删除按钮。

## 数据库

主要数据关系：

- `users` 拥有自定义球员、球员覆盖、阵容、战报、LLM 配置和游客导入记录。
- 公共球员目录由迁移写入，所有用户共享。
- `players.chinese_name` 保存可选中文名称；V12 初始化精选公共球员，V13 通过共享中文名称资源初始化历史公共球员；公共球员的英文名、中文名、缩写、身高和体重由目录维护，用户覆盖只保存可调节属性；自定义球员可以自行填写中文名称或留空。
- 阵容成员引用公共球员或当前用户的自定义球员。
- 战报保存阵容名称和球员显示快照，后续修改球员不会改写历史战报。
- 战报创建 30 天后失效，每天北京时间 03:00 清理。
- `guest_imports` 以游客工作区 UUID 为主键，阻止同一游客工作区进入两个账号；首次导入为每套阵容生成新的 client key，同事务重映射战报与自定义球员引用。V17 新增 `request_payload`，保存实际提交内容；同一账号仅在 JSONB 内容相等时获得幂等成功，不同内容或历史记录缺少内容时返回 409 `GUEST_IMPORT_CONTENT_CONFLICT`。历史记录保持 null，不根据现有业务表猜测原始输入。
- `user_identities` 保存微信身份绑定：`(provider, appid, openid)` 全局唯一，`(user_id, provider, appid)` 每账号最多一条。
- `wechat_auth_credentials` 保存微信身份确认凭证的摘要、过期时间、失败次数与消费状态；凭证明文只返回一次，不落库。
- `web_login_tickets` 保存 Web 扫码登录票据：票据与浏览器绑定值均只存摘要，状态机为 pending → approved/rejected → consumed，过期在读取时判定。
- `shared_lineups` 保存社区公开阵容：成员以 jsonb 快照冻结在公开时刻，`source_lineup_id` 部分唯一索引保证一套阵容最多一个公开帖，评论数与复制数作为计数器维护。
- `lineup_comments` 保存社区评论，`parent_id` 自引用支持一级回复，删除帖或评论时回复级联删除。

## 测试边界

- Vitest 覆盖共享包规则、保存队列、对战编排、游客存储与导入转换，以及 Web 入口交互、分页、社区界面与错误码映射。`scripts/vitest-backend.ts` 为每次运行创建独立 `stage4_frontend_<timestamp>` PostgreSQL 数据库，构建并启动真实 Spring Boot；测试代理仅转发或延迟真实响应，禁止注册预设项目 API 响应。微信外部接口依 D-006 使用本地契约服务。
- 前端集成测试要求 Docker 测试容器 `basketball-gm-test-pg` 在 127.0.0.1:5432 提供 PostgreSQL，用户名 zhulin，以及本机 Java 21、Maven。测试进程结束后关闭服务，数据库及 `.cache/integration-tests/<database>/` 日志保留，不能连接用户开发库。数据库故障触发器限定到测试账号或票据，并在 finally 中删除。
- 小程序游客服务测试把工作区和草稿真实写入 `.cache/miniprogram-tests`，通过新服务实例验证恢复、阵容约束、模拟、快照、容量与到期清理；该测试不代替微信平台运行验收。
- 后端 JUnit 覆盖比赛引擎、LLM 响应处理与加密、本地敏感词过滤。
- `GuestImportApiTest` 使用真实 PostgreSQL 与 MockMvc 验证导入事务、新 client key 和数据约束；小程序 `guest-import.test.ts` 通过真实 TCP HTTP 验证内容冲突、幂等、并发与本地清理。执行后端测试时通过 `SPRING_DATASOURCE_URL` 指定本轮独立数据库。
- `AuthApiTest` 使用同一测试库验证注册规则与数据库用户名约束；`WechatAuthApiTest` 与 `WebLoginTicketApiTest` 通过真实本地 HTTP 服务器替代微信接口，验证免密码注册、绑定、冲突、凭证消费与票据生命周期。
- `ForumApiTest` 使用同一测试库，通过 HTTP 层验证社区公开、评论、复制、权限与分页。
- `ForumModerationTest` 使用同一测试库，用收紧的限频配置真实触发词表拦截、秒级与天级限频、新账号链接限制、管理员删除与错误码响应体。

当前任务的执行命令和验证状态见 `docs/plans/current.md`。
