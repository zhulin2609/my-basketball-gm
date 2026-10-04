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

微信小程序开发按 `docs/plans/wechat-miniprogram.md` 推进。阶段 2（npm workspaces 重构与共享包抽取）已完成、已提交并推送远端（提交 `bd5b8a5`，分支 `mini-app-20261004`）。阶段 3（Taro 小程序骨架与游客端）需要用户明确授权后开始；阶段 4（微信身份）、阶段 5（独立分享）按产品文档顺序推进。

产品现状：Web 端全部能力保持不变（球员库、阵容、本地与 AI 对战、游客工作区、认证、社区、Docker Compose 单机部署）。后端在本阶段零改动，运行中的 Compose 服务与当前源码一致。

## 已完成工作

- 仓库迁移为 npm workspaces：`apps/web`（React + Vite 页面、i18n、社区与 AI 接口、Web 平台实现）、`packages/core`（纯领域类型、球员目录、阵容校验、规则引擎、选择器、内置阵容纯工厂）、`packages/client`（REST 契约、会话、游客工作区、阵容保存队列、对战编排）。
- 平台能力（存储、HTTP、ID、时钟、随机种子）通过 `packages/client/src/ports.ts` 注入；Web 专属的 i18n、社区、AI、hash 路由、旧浏览器存储键迁移留在 `apps/web`。
- 行为修正：`simulate()` 显式接收 seed、战报 ID、创建时间；`validateLineup` 新增同一球员不重复检查；`engineVersion` 统一为 `'v1'`；游客导入错误改为结构化错误码（文案映射留在 Web）。
- 独立 review（2026-10-04）后的修正：vite `envDir` 指向仓库根目录（修复开发模式环境变量失效）；会话过期判断使用注入时钟；旧键迁移先生成身份再删除旧键；恢复 `@catalog` 别名并以按包目录方式执行 typecheck；目录生成脚本改为输出递增版本号迁移且拒绝覆盖既有文件；保存队列与对战服务测试改为真实本地 HTTP 契约测试；`averageRating` 测试改为手算期望值。
- 四项产品决定确认并写入产品文档：小程序球员编辑只读；独立分享允许自定义球员与覆盖球员（复制时新建球员记录或覆盖）；战报分享仅查看。
- 全部文档路径随结构调整更新（README、ARCHITECTURE、DECISIONS、DESIGN、产品文档、交接文档）。

## 未完成工作

- 阶段 3：Taro 小程序骨架、平台实现与游客端（浏览、阵容编辑、设备端规则对战、战报）；开始前核验 Taro、React、Node 与小程序基础库兼容版本并锁定。
- 阶段 4：微信身份绑定、新账号 Web 凭据、游客导入同名客户端键处理、登录规则对战。
- 阶段 5：独立分享的迁移、接口、审核、创建、接收、复制、撤销与到期行为。
- 剩余待确认产品细节见 `docs/plans/wechat-miniprogram.md` 第 12 节。
- 腾讯云 CMS 真实凭据验证、服务器生产发布（既有安排）。

## 修改过的文件

阶段 2 的全部改动已在提交 `bd5b8a5`（93 个文件，+3209/−1035）中推送远端，可用 `git show --stat bd5b8a5` 查看。要点：

- 移动：`src/**` → `apps/web/src/**`、`packages/core/src/**`、`packages/client/src/**`；`index.html`、`public/`、`vite.config.ts` → `apps/web/`；`tsconfig.app.json` 拆分为三个包各自的 tsconfig。
- 新增：两个共享包的源码与测试、`apps/web/src/lib/runtime.ts`（平台接线）、`apps/web/src/lib/guest-legacy.ts`（旧存储键迁移）、`apps/web/src/lib/presets.ts`（内置阵容文案组装）、`apps/web/src/lib/guest-import-errors.ts`（结构化错误文案）、`packages/client/src/fetch-http.ts`、`packages/client/src/testing/local-api-server.ts`、根 `vitest.config.ts`、`docs/plans/wechat-miniprogram.md`。
- 修改：根 `package.json`（workspaces、依赖固定版本、typecheck 脚本）、`Dockerfile`（workspaces 布局、npm install 加重试）、`scripts/generate-nba-history-catalog.mjs`（新输入输出路径与递增迁移版本号）、`.gitignore`（增加 `.zcode`）、全部架构与交接文档。

## 修改中的文件

无。工作区与远端 `origin/mini-app-20261004` 一致。

## 当前已知 bug

- 无已知产品功能缺陷。未验证范围：登录、社区、AI 的真实服务端请求未在浏览器冒烟中完成（端点结论来自新旧代码对照与真实 HTTP 契约测试）；后端 `mvn test` 本阶段未运行（backend 零改动）。
- 环境与工具注意事项：
  - 容器内访问 npm registry 偶发 ECONNRESET：Dockerfile 使用 `npm install`（npm ci 在 workspaces 布局下会跳过 rolldown 的跨平台原生绑定）并加 BuildKit 缓存与一次重试；网络持续中断时构建失败可重跑。
  - TypeScript 7 从仓库根目录执行 `-p <子目录 tsconfig>` 时对 paths 别名指向 JSON 的解析不可靠：`npm run typecheck` 进入各包目录依次执行；`baseUrl` 已被 TS 7 移除，不得回加。
  - client 的测试辅助代码使用 node:http，其 tsconfig 启用 `@types/node`；core 保持零 Node 类型、零平台依赖。
  - Vite 生产构建提示单个 JavaScript 包超过 500 kB，与既有状态一致，待分包需求明确时处理。

## 仓库结构

npm workspaces 管理三个包，关键行为保持：localStorage 键名、游客工作区协议（UUID、schemaVersion、hasUserProgress、20 场、30 天）、`classic-five` 客户端键、JWT 会话键 `dream-court.auth-session.v1`、i18n、hash 路由、社区与 AI 能力全部不变。

- `apps/web`：页面与 Web 平台实现；平台接线集中在 `src/lib/runtime.ts`（存储、fetch 传输、ID、时钟、随机种子），内置阵容文案在 `src/lib/presets.ts`。
- `packages/core`：纯领域逻辑，禁止依赖 React、DOM、存储、网络、i18n；球员目录经 `@dream-court/core/catalog` 独立入口导出；中文名称 JSON 以 backend 资源目录为单一来源，经 `@catalog` 别名构建时打包。
- `packages/client`：业务流程；通过 `ports.ts` 注入平台能力；`lineup-service.ts` 的保存队列在请求落定后移除在途记录，`pending()` 只反映未完成的保存。
- `backend`：Java 21 + Spring Boot + MyBatis，本阶段零改动，结构见 `docs/ARCHITECTURE.md`。

## 设计决策及原因

### 共享包边界

core 只含纯领域逻辑并禁止平台依赖；client 通过 ports 注入存储、HTTP、ID、时钟与随机种子；Web 专属的 i18n、社区、AI、hash 路由、旧存储键迁移留在 `apps/web`。两个客户端（Web 与未来的小程序）复用同一套业务规则。

### 内置阵容工厂纯化

`starterLineup()` 与 `classicLineup()` 是接收 id、名称、描述、时间的纯工厂；`classic-five` 导出为常量 `CLASSIC_LINEUP_CLIENT_KEY` 保持旧存档兼容；Web 在 `apps/web/src/lib/presets.ts` 组装 i18n 文案与 UUID。

### 阵容保存队列下沉

逐阵容串行保存与过期响应丢弃逻辑从 `App.tsx` 移入 client 的 lineup-service；对战发起前通过 `pending(id)` 等待在途保存；请求落定后清理在途记录，清理直接挂在请求本身的反应上保证 `await` 之后可见。

### 游客导入错误结构化

导入转换中的错误改为 client 的 `GuestImportDataError`（携带字段），中文文案映射留在 Web 的 `guest-import-errors.ts`，用户可见文案不变。

### 目录刷新生成递增迁移

`scripts/generate-nba-history-catalog.mjs` 输出下一个未用版本号的幂等 upsert 迁移并拒绝覆盖既有文件，保证已发布迁移（V1–V13）的 Flyway checksum 不变；刷新后正常启动后端即可应用。

### 测试使用真实 HTTP 契约

client 的服务层测试通过 `testing/local-api-server.ts`（node:http 真实服务器）加真实 fetch 验证串行化、过期响应跳过、错误映射与完整战报响应，不使用替身 ApiClient。

### 统一的历史球员中文名称资源

历史球员中文名称仅维护在 `backend/src/main/resources/player-catalog-chinese-names.json`，前端构建与 Flyway V13 共用该资源。扩充目录时通过新增迁移补充数据库记录，已发布迁移保持不变。

### 公共球员身份字段由目录维护

名称、缩写、身高和体重用于识别公共目录条目，用户覆盖仅保存可调节能力值。

### 本地规则引擎始终可用

本地规则引擎作为所有用户可用的对战方式，AI 模拟仅在登录用户主动选择时调用。

### 一个浏览器对应一个游客工作区

游客工作区使用持久 UUID 作为导入幂等键；相同账号重试不重复写入，不同账号导入相同工作区返回冲突；成功导入后清空工作区。

### 前端资源随制品交付

字体通过 @fontsource npm 包随 Vite 制品发布；UUID 由 `uuid` 统一生成（Web 平台实现注入 client），部分公网 HTTP 浏览器缺少 `crypto.randomUUID()` 时仍可工作。

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

开发前端地址为 `http://127.0.0.1:5173/`（`npm run dev` 等价于 `vite apps/web`，环境文件从仓库根目录读取），开发后端健康检查为 `http://127.0.0.1:8080/api/v1/health`。

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

## 测试状态

- 2026-10-04：`npm test` 19 个测试文件、84 项测试全部通过；`npm run typecheck`（core、client、web 三处）、`npm run build`、`npm run format:check`、`git diff --check` 全部通过。
- 2026-10-04：真实浏览器冒烟通过：游客浏览（416 名球员、每页 12、按综合评分降序）、中文姓名搜索、阵容页示例初始化与候选分页、本地引擎对战出战报、游客工作区按既有协议持久化；开发服务器确认读取根目录 `.env.local`。
- 2026-10-04：`docker compose build` 完成，web 容器运行 healthy，`http://localhost:8088/api/v1/health` 返回 `status: ok`，页面产物确认为当前源码构建。
- 2026-09-24：后端 46 项 Maven 测试全部通过（真实 PostgreSQL 16 验证 Flyway V1–V13）；此后 backend 零改动。

## 下一步具体行动

1. 用户授权后开始阶段 3：核验 Taro、React、Node 与小程序基础库兼容版本并锁定，创建 `apps/miniprogram`。
2. 阶段 3 完成 Web 全量回归后，按产品文档推进阶段 4/5；每阶段更新本文件与 `docs/plans/current.md`。
3. 需要发布时：先数据库备份，再 `docker compose up --build --detach`，最后验证健康接口；推送 `main` 前必须完整运行前后端全部测试。
