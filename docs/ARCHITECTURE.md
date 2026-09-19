# Architecture

## 系统边界

Dream Court 由浏览器前端、Spring Boot API 和 PostgreSQL 三部分组成。

- 前端：React、TypeScript、Vite，入口为 `src/main.tsx` 和 `src/App.tsx`。
- 后端：Java 21、Spring Boot、MyBatis，入口为 `backend/src/main/java/com/basketballgm/BasketballGmApplication.java`。
- 数据库：PostgreSQL 16，结构由 `backend/src/main/resources/db/migration/` 中的 Flyway 迁移维护。

本地开发时，前端运行在 `127.0.0.1:5173`，Vite 将 `/api` 请求代理到后端 `127.0.0.1:8080`。

## 前端

### 页面和共享状态

`src/App.tsx` 管理当前页面、认证会话、球员、阵容和战报的共享状态。主要页面包括球员库、我的阵容、梦幻对战、社区、AI 设置和登录或注册。

页面状态以 URL hash 为准（`src/lib/hash-route.ts` 的 `useHashRoute`）：格式为 `#/players`、`#/lineups`、`#/battle`、`#/community`、`#/community/<帖子id>`、`#/ai-settings`、`#/auth`。挂载时从 hash 恢复当前页面，`navigate` 同步更新状态并写 hash，`hashchange` 监听支持浏览器前进/后退。无法识别的 hash 回退到球员库；`ai-settings` 要求登录、`community` 要求 API 启用，条件不满足时回退到球员库且 URL 保持不变。

球员库网格（每页 12 名）与我的阵容候选列表（每页 9 名）通过 `src/lib/use-pagination.ts` 分页；搜索、过滤或排序条件变化时回到第 1 页。社区帖子列表（每页 10 帖）与评论（每页 20 条）由服务端分页，前端复用同一个分页组件。

页面文案位于 `src/i18n/resources.ts`，当前支持简体中文和英文。

### 数据来源

- 公共球员目录由 `src/data/players.ts` 和 `src/data/historical-players.generated.ts` 提供。
- `src/lib/repository.ts` 是组件与浏览器存储之间的边界。
- `src/lib/api.ts` 是组件与后端 REST API 之间的边界，同时负责 JWT 会话读写；非 2xx 响应抛出携带 `status` 与 `code` 的 `ApiError`。
- `src/lib/errors.ts` 把社区写操作的错误码映射为本地文案；无 code 的错误保持拼接后端 message 的既有行为。
- `src/lib/simulator.ts` 提供游客和登录用户都可以使用的本地规则引擎。
- `src/lib/player-of-the-game.ts` 从战报统计中评选本场最佳球员，本地战报与云端战报复用同一公式。

### 游客数据

`src/lib/guest-workspace.ts` 把游客球员修改、阵容和战报保存在统一 localStorage 工作区。工作区使用稳定 UUID，并通过 `hasUserProgress` 区分示例数据和用户实际修改。

`src/lib/guest-import.ts` 把浏览器工作区转换为后端导入请求。注册会自动导入；登录已有账号时由用户决定是否导入。导入成功后才会清空浏览器工作区。

### 登录数据

存在有效认证会话时，球员、阵容、AI 设置和战报通过 `src/lib/api.ts` 访问后端。JWT 保存在 localStorage 的 `dream-court.auth-session.v1`。

## 后端

后端按业务模块组织：

- `auth`：注册、登录、JWT 颁发和当前用户。
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
- 阵容成员引用公共球员或当前用户的自定义球员。
- 战报保存阵容名称和球员显示快照，后续修改球员不会改写历史战报。
- 战报创建 30 天后失效，每天北京时间 03:00 清理。
- `guest_imports` 以游客工作区 UUID 为主键，保证同一账号重试安全，并阻止同一游客工作区进入两个账号。
- `shared_lineups` 保存社区公开阵容：成员以 jsonb 快照冻结在公开时刻，`source_lineup_id` 部分唯一索引保证一套阵容最多一个公开帖，评论数与复制数作为计数器维护。
- `lineup_comments` 保存社区评论，`parent_id` 自引用支持一级回复，删除帖或评论时回复级联删除。

## 测试边界

- Vitest 覆盖前端规则、游客存储、导入转换、入口交互、分页、社区界面与社区错误码映射。
- 后端 JUnit 覆盖比赛引擎、LLM 响应处理与加密、本地敏感词过滤。
- `GuestImportApiTest` 使用真实本地 PostgreSQL 数据库 `basketball_gm_test`，通过 HTTP 层验证游客导入事务。
- `ForumApiTest` 使用同一测试库，通过 HTTP 层验证社区公开、评论、复制、权限与分页。
- `ForumModerationTest` 使用同一测试库，用收紧的限频配置真实触发词表拦截、秒级与天级限频、新账号链接限制、管理员删除与错误码响应体。

具体执行命令和当前测试状态见 `docs/AI_HANDOFF.md` 与 `docs/plans/current.md`。
