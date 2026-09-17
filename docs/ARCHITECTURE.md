# Architecture

## 系统边界

Dream Court 由浏览器前端、Spring Boot API 和 PostgreSQL 三部分组成。

- 前端：React、TypeScript、Vite，入口为 `src/main.tsx` 和 `src/App.tsx`。
- 后端：Java 21、Spring Boot、MyBatis，入口为 `backend/src/main/java/com/links/basketballgm/BasketballGmApplication.java`。
- 数据库：PostgreSQL 16，结构由 `backend/src/main/resources/db/migration/` 中的 Flyway 迁移维护。

本地开发时，前端运行在 `127.0.0.1:5173`，Vite 将 `/api` 请求代理到后端 `127.0.0.1:8080`。

## 前端

### 页面和共享状态

`src/App.tsx` 管理当前页面、认证会话、球员、阵容和战报的共享状态。主要页面包括球员库、我的阵容、梦幻对战、AI 设置和登录或注册。

球员库网格（每页 12 名）与我的阵容候选列表（每页 9 名）通过 `src/lib/use-pagination.ts` 分页；搜索、过滤或排序条件变化时回到第 1 页。

页面文案位于 `src/i18n/resources.ts`，当前支持简体中文和英文。

### 数据来源

- 公共球员目录由 `src/data/players.ts` 和 `src/data/historical-players.generated.ts` 提供。
- `src/lib/repository.ts` 是组件与浏览器存储之间的边界。
- `src/lib/api.ts` 是组件与后端 REST API 之间的边界，同时负责 JWT 会话读写。
- `src/lib/simulator.ts` 提供游客和登录用户都可以使用的本地规则引擎。

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
- `config`：Spring Security、统一错误响应和跨模块配置。

Controller 处理 HTTP 和认证边界，Service 执行业务规则与事务，MyBatis Mapper 负责 SQL。用户归属从 JWT 中读取，客户端不能指定 owner ID。

## 数据库

主要数据关系：

- `users` 拥有自定义球员、球员覆盖、阵容、战报、LLM 配置和游客导入记录。
- 公共球员目录由迁移写入，所有用户共享。
- 阵容成员引用公共球员或当前用户的自定义球员。
- 战报保存阵容名称和球员显示快照，后续修改球员不会改写历史战报。
- 战报创建 30 天后失效，每天北京时间 03:00 清理。
- `guest_imports` 以游客工作区 UUID 为主键，保证同一账号重试安全，并阻止同一游客工作区进入两个账号。

## 测试边界

- Vitest 覆盖前端规则、游客存储、导入转换、入口交互和历史球员目录。
- 后端 JUnit 覆盖比赛引擎、LLM 响应处理与加密。
- `GuestImportApiTest` 使用真实本地 PostgreSQL 数据库 `basketball_gm_test`，通过 HTTP 层验证游客导入事务。

具体执行命令和当前测试状态见 `docs/AI_HANDOFF.md` 与 `docs/plans/current.md`。
