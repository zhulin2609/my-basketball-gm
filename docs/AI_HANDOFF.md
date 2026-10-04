# AI Handoff

更新时间：2026-10-04

## 开始工作前

按以下顺序读取仓库内容：

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. 本文件
4. `docs/plans/current.md`
5. `docs/plans/wechat-miniprogram.md`（进行微信小程序相关任务时）
6. 与任务相关的源码和测试

随后运行：

```bash
git status --short --branch
git diff
git log -5 --oneline
```

保留用户已有改动。禁止使用 Git 回滚用户文件。

## 当前目标

微信小程序开发按 `docs/plans/wechat-miniprogram.md` 推进，开发分支为 `mini-app-20261004`。阶段 2（npm workspaces 重构与共享包抽取）已完成并通过全部验证，改动在工作区等待用户授权提交；阶段 3（小程序游客端）开始前需要用户另行授权。

产品现状：Web 端全部能力保持不变（球员库、阵容、本地与 AI 对战、游客工作区、认证、社区、Docker Compose 单机部署）。后端本轮零改动。

## 仓库结构（阶段 2 之后）

npm workspaces 管理三个包：

- `apps/web`：React + Vite 页面、i18n、社区与 AI 接口，以及 Web 平台实现（UUID、浏览器存储、fetch 传输、旧存储键迁移、内置阵容文案）。
- `packages/core`：领域类型、球员目录（含中文名称资源读取）、阵容校验、成员显示顺序、最佳球员、规则引擎、综合评分与过滤排序、内置阵容纯工厂。禁止依赖 React、DOM、存储、网络、i18n；球员目录通过 `@dream-court/core/catalog` 独立入口导出。
- `packages/client`：REST 契约与会话、游客工作区、本地存取（战报 20 场上限、30 天清理）、游客导入转换、阵容保存队列、对战编排。存储、HTTP、ID、时钟、随机种子由应用通过 `ports.ts` 注入。
- `backend`：Java 21 + Spring Boot + MyBatis，结构见 `docs/ARCHITECTURE.md`，本轮未改动。

关键行为保持：localStorage 键名、游客工作区协议（UUID、schemaVersion、hasUserProgress、20 场、30 天）、`classic-five` 客户端键、JWT 会话键 `dream-court.auth-session.v1`、i18n、hash 路由、社区与 AI 能力全部不变。

阶段 2 的行为修正：`simulate()` 改为显式接收 `{ seed, id, now }`，消除引擎内的隐式随机与时钟依赖；`validateLineup` 新增同一球员不重复检查（Web 界面行为不变）；`engineVersion` 统一为 `'v1'`（原 `guest-import.ts` 的兜底值 `'local-rules-v1'` 弃用）。

独立 review（2026-10-04）后的修正：`apps/web/vite.config.ts` 增加 `envDir` 指向仓库根目录，`vite apps/web` 重新读取根目录 `.env.local`（否则开发模式 API 被关闭）；会话过期判断改为使用注入的时钟（`Clock` 贯通 `ApiTransport`）；旧浏览器存储键迁移先生成工作区身份再删除旧键；`@catalog` 别名恢复（TS 7 从仓库根目录对 paths 指向 JSON 的解析不可靠，typecheck 因此按包目录依次执行），core 不再使用多层相对导入；`scripts/generate-nba-history-catalog.mjs` 的迁移输出改为下一个未用版本号并拒绝覆盖既有文件；`lineup-service` 与 `battle-service` 测试改为真实本地 HTTP 服务器加真实 fetch 的契约测试（不再使用替身 ApiClient），并断言串行发出与等待行为；`averageRating` 测试改为手算期望值。

## 验证记录

- 2026-10-04：独立 review 提出的八项代码发现与六项文档不一致全部处理完毕；复跑 `npm test`（19 个测试文件、84 项全部通过）、`npm run typecheck`、`npm run build`、`npm run format:check`、`git diff --check` 全部通过；开发服务器确认读取根目录 `.env.local`（runtime 模块注入 `/api/v1`）；web 镜像重建后运行 healthy，页面产物为新构建。
- 2026-10-04：真实浏览器冒烟通过：游客浏览（416 名球员、每页 12、按综合评分降序）、中文姓名搜索（"乔丹"命中 Michael Jordan 与 DeAndre Jordan）、阵容页示例初始化顺序与候选分页、本地引擎对战出战报、游客工作区按既有协议持久化。
- 后端 `mvn test` 本阶段未运行：backend 零改动。向远端 `main` 推送前必须完整运行前后端全部测试。

## 未验证与已知问题

- 浏览器冒烟中 ZCode 内置浏览器面板的定位点击不稳定，按钮交互结论以测试（含 userEvent 交互与真实 HTTP 契约测试）与页面状态读取为准；真实浏览器使用不受影响。
- 登录、社区与 AI 的真实服务端请求未在浏览器冒烟中完成（需要后端与真实数据），端点结论来自新旧代码对照与真实 HTTP 契约测试。
- 容器内访问 npm registry 偶发 ECONNRESET：Dockerfile 已改用 `npm install`（npm ci 在 workspaces 布局下会跳过 rolldown 的跨平台原生绑定）并加 BuildKit 缓存挂载与一次重试；网络持续中断时构建仍可能失败，重跑即可。
- TypeScript 7 从仓库根目录执行 `-p <子目录 tsconfig>` 时，对 paths 别名指向 JSON 的解析不可靠：`npm run typecheck` 因此进入各包目录依次执行；`baseUrl` 已被 TS 7 移除，不得回加。client 的测试辅助代码使用 node:http，其 tsconfig 启用 `@types/node`，core 保持无 Node 类型。
- Vite 生产构建提示单个 JavaScript 包超过 500 kB，与既有状态一致，待分包需求明确时处理。
- 腾讯云 CMS 真实凭据、服务器生产发布仍按既有安排执行。

## 设计决策及原因

### 共享包边界

core 只含纯领域逻辑并禁止平台依赖；client 通过 ports 注入存储、HTTP、ID、时钟与随机种子；Web 专属的 i18n、社区、AI、hash 路由、旧存储键迁移留在 `apps/web`。目录中文名 JSON 仍以后端资源为单一来源，core 以相对路径读取。

### 内置阵容工厂纯化

`starterLineup()` 与 `classicLineup()` 迁入 core 并改为接收 id、名称、描述、时间的纯工厂；`classic-five` 导出为常量 `CLASSIC_LINEUP_CLIENT_KEY` 保持旧存档兼容；Web 在 `apps/web/src/lib/presets.ts` 组装 i18n 文案与 UUID。

### 阵容保存队列下沉

逐阵容串行保存与过期响应丢弃逻辑从 `App.tsx` 移入 client 的 lineup-service；对战发起前通过 `pending(id)` 等待在途保存；请求落定后清理在途记录，`pending()` 只反映未完成的保存。

### 游客导入错误结构化

导入转换中的中文错误文案改为 client 的结构化错误（`GuestImportDataError` 携带字段），中文文案映射留在 Web 的 `guest-import-errors.ts`，用户可见文案不变。

### 统一的历史球员中文名称资源

历史球员中文名称仅维护在 `backend/src/main/resources/player-catalog-chinese-names.json`，前端构建与 Flyway V13 共用该资源。后续扩充目录时通过新增迁移补充数据库记录，已发布迁移保持不变。

### 公共球员身份字段由目录维护

名称、缩写、身高和体重用于识别公共目录条目，用户覆盖仅保存可调节能力值。

### 本地规则引擎始终可用

本地规则引擎作为所有用户可用的对战方式，AI 模拟仅在登录用户主动选择时调用。

### 一个浏览器对应一个游客工作区

游客工作区使用持久 UUID 作为导入幂等键；相同账号重试不重复写入，不同账号导入相同工作区返回冲突；成功导入后清空工作区。

### 前端资源随制品交付

字体通过 @fontsource npm 包随 Vite 制品发布；UUID 由 `uuid` 统一生成（Web 平台实现注入 client）。

### 保留用户名只拦截固定名单

保留名单仅包含固定官方观感词汇，不并入 `FORUM_ADMIN_USERNAMES` 配置。

## 本地运行

### Docker Compose

```bash
cp .env.docker.example .env
docker compose up --build --detach
docker compose ps
curl --fail --silent http://localhost:8088/api/v1/health
```

浏览器入口为 `http://localhost:8088`。容器 PostgreSQL 映射到宿主机回环地址 `127.0.0.1:5433`。

### 非容器本地开发

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn spring-boot:run
```

```bash
npm run dev
```

开发前端地址为 `http://127.0.0.1:5173/`（`npm run dev` 等价于 `vite apps/web`），开发后端健康检查为 `http://127.0.0.1:8080/api/v1/health`。

## 测试方法

```bash
npm test
npm run typecheck
npm run build
npm run format:check
git diff --check
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn test
```

后端集成测试使用 `basketball_gm_test`。若本机没有该数据库，可运行一个临时 PostgreSQL 16 容器映射至 `127.0.0.1:5432` 后执行 Maven 测试；测试完成后移除该容器。

## 下一步具体行动

1. 用户审阅阶段 2 改动并授权提交（分支 `mini-app-20261004`）。
2. 用户授权后开始阶段 3：Taro 小程序骨架、平台实现与游客端（浏览、阵容编辑、设备端规则对战、战报）。
3. 阶段 3 开始前核验 Taro、React、Node 与小程序基础库的兼容版本并锁定依赖。
4. 阶段 4/5（微信身份、独立分享）按产品文档推进；剩余待确认产品细节见 `docs/plans/wechat-miniprogram.md` 第 12 节。
