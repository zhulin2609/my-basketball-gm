# AI Handoff

更新时间：2026-09-24

## 开始工作前

按以下顺序读取仓库内容：

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. 本文件
4. `docs/plans/current.md`
5. `docs/DECISIONS.md`
6. 与任务相关的源码和测试

随后运行：

```bash
git status --short --branch
git diff
git log -5 --oneline
```

保留用户已有改动。禁止使用 Git 回滚用户文件。

## 当前目标

后续产品需求从 `develop` 分支开始开发、验证和提交。经完整验证后，将 `develop` 合并到 `main`；推送 `main` 前必须再次运行全部前后端测试。

当前产品提供球员库、阵容编辑、本地规则引擎对战、可选 AI 对战、游客工作区、账户认证与社区。单机环境由 Docker Compose 管理，腾讯云服务器部署、HTTPS 证书、数据库备份与腾讯云 CMS 凭据配置仍需按用户安排执行。

## 已完成工作

### 产品能力

- 公共球员目录包含 416 名球员：19 名精选球员与 397 名历史球员。简体中文界面显示“英文名（中文名）”，球员库和阵容候选列表支持中文名称搜索。
- 公共球员的英文名、中文名、缩写、身高与体重为目录身份字段；界面和服务端写入路径均禁止用户修改。自定义球员的中文名可留空。
- 游客可浏览球员库、创建自定义球员、编辑阵容、使用本地规则引擎对战。游客数据保存于 `dream-court.guest-workspace.v1`，注册自动导入，登录已有账号时由用户选择是否导入；成功导入后清空浏览器工作区。
- 登录用户可保存球员覆盖、自定义球员、阵容、战报与加密的大模型连接配置。战报保存 30 天，每天北京时间 03:00 清理。
- 本地引擎和 AI 对战均遵守每队 240 分钟与单人 48 分钟上限；战报展示本场最佳球员。
- 社区支持公开合规阵容、评论、一级回复、复制阵容、敏感词过滤、可选腾讯云 CMS 审核、限频、新账号链接限制与管理员删除。`FORUM_ENABLED=false` 会关闭社区 HTTP 接口。
- 页面以 URL hash 管理球员库、阵容、对战、社区、AI 设置和认证视图；支持简体中文与英文。

### 前端公网兼容性

- 字体通过 `@fontsource/dm-mono`、`@fontsource/manrope`、`@fontsource/playfair-display` 打包进前端制品；运行时不请求 Google Fonts。
- `src/lib/identifier.ts` 使用 `uuid` 的 `v4()` 生成 UUID，替换游客工作区、内置阵容、本地战报、新阵容和自定义球员中的直接 `crypto.randomUUID()` 调用。
- 生产构建包含 20 个本地 `.woff`、`.woff2` 字体文件。源码和构建制品均未检索到 Google Fonts 地址，源码未检索到直接调用 `crypto.randomUUID()`。

### 数据库与部署

- Flyway 迁移已到 V13：包含用户、公共球员、阵容、战报、账户认证、加密大模型凭据、游客导入、社区与球员中文名称。
- 历史球员中文名称维护在 `backend/src/main/resources/player-catalog-chinese-names.json`，前端 Vite 读取该资源，Flyway V13 Java 迁移也读取它写入 PostgreSQL。
- 根目录 `compose.yaml` 构建 `web`、`api`、`postgres`：Nginx 提供前端并代理 `/api`；Flyway 随 API 启动执行；PostgreSQL 数据写入命名卷。
- `main` 已合并 `develop` 并已推送远端，当前远端 `main` 为 `788cad5 merge: 合并 develop 分支`。

## 最近完成的提交

- `a4853fd fix: 去除前端以外链形式引用的第三方库；去除 \`crypto.randomUUID()\` ; 更新文档`
- `218b224 feat:`：球员中文名称、中文搜索与公共球员身份字段保护。
- `c533640 feat: 添加 Docker Compose 单机部署`
- `788cad5 merge: 合并 develop 分支`：已推送到远端 `main`。

旧功能的完整变更索引可通过 `git log --oneline` 与 `docs/ARCHITECTURE.md` 追溯；本文件仅保留继续开发所需的有效信息。

## 修改过的文件

最近完成的公网 HTTP 兼容修改涉及：

- 前端依赖与样式：`package.json`、`package-lock.json`、`src/styles.css`。
- UUID 工具与调用方：`src/lib/identifier.ts`、`src/lib/identifier.test.ts`、`src/lib/guest-workspace.ts`、`src/lib/repository.ts`、`src/lib/simulator.ts`、`src/App.tsx`。
- 交接与部署说明：`README.md`、`docs/README.en.md`、`backend/README.md`、`DESIGN.md`、`docs/AI_HANDOFF.md`、`docs/DECISIONS.md`、`docs/deployment.md`、`docs/plans/current.md`。

## 修改中的文件

无。工作区干净，全部改动已提交并推送。

## 当前已知问题

- Vite 生产构建提示单个 JavaScript 包超过 500 kB。构建与运行未受影响，后续可在功能需求明确时设计代码分包。
- 腾讯云 CMS 需要提供 `TENCENT_SECRET_ID` 与 `TENCENT_SECRET_KEY` 才会启用；未配置时本地敏感词过滤继续生效。

## 设计决策及原因

### 统一的历史球员中文名称资源

历史球员中文名称仅维护在 `player-catalog-chinese-names.json`。前端与 Flyway 共用该资源，可避免浏览器目录和数据库维护两份名单。后续扩充目录时，新增迁移补充已发布数据库记录，已发布迁移文件保持不变。

### 公共球员身份字段由目录维护

名称、缩写、身高和体重用于识别公共目录条目。用户覆盖仅保存可调节能力值，保证公共条目在所有阵容、战报和社区快照中具有稳定身份。

### 本地规则引擎始终可用

AI 服务商响应与额度存在差异，游客也没有服务端 API Key 配置。因此本地规则引擎作为所有用户可用的对战方式，AI 模拟仅在登录用户主动选择时调用。

### 一个浏览器对应一个游客工作区

游客工作区使用持久 UUID 作为导入幂等键。相同账号重试不会重复写入，不同账号导入相同工作区返回冲突；成功导入后清空工作区，避免共享设备上的数据继承。

### 前端资源随制品交付

字体通过 npm 依赖随 Vite 制品发布，避免公网访问依赖第三方字体服务。UUID 由 `uuid` 统一生成，可覆盖缺少浏览器 `crypto.randomUUID()` 的公网 HTTP 环境。

## 本地运行

### Docker Compose

```bash
cp .env.docker.example .env
docker compose up --build --detach
docker compose ps
curl --fail --silent http://localhost:8088/api/v1/health
```

浏览器入口为 `http://localhost:8088`。容器 PostgreSQL 映射到宿主机回环地址 `127.0.0.1:5433`，用于本机 pgAdmin 连接；API 不向宿主机直接公开。

### 非容器本地开发

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn spring-boot:run
```

```bash
npm run dev -- --host 127.0.0.1
```

开发前端地址为 `http://127.0.0.1:5173/`，开发后端健康检查为 `http://127.0.0.1:8080/api/v1/health`。

## 测试方法

```bash
npm test
npm run build
npm run format:check
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn test
```

后端集成测试使用 `basketball_gm_test`。若本机没有该数据库，可运行一个临时 PostgreSQL 16 容器映射至 `127.0.0.1:5432` 后执行 Maven 测试；测试完成后移除该容器。

## 测试状态

- 2026-09-24：`npm test` 通过，13 个测试文件、59 项测试全部成功；`npm run build` 与 `npm run format:check` 通过。
- 2026-09-24：`mvn test` 使用临时 PostgreSQL 16 执行，43 项测试全部成功；Flyway 已验证 V1–V13 迁移。
- 2026-09-24：`docker compose up --build --detach` 完成；`web`、`api`、`postgres` 均通过健康检查，`http://localhost:8088/api/v1/health` 返回 `status: ok`。
- Apple 芯片版 JDK 21 位于 `/opt/homebrew/opt/openjdk@21`，本机 Maven 测试可使用该 JDK。

## 下一步具体行动

1. 从 `develop` 创建功能分支，按用户确认的需求开发。
2. 在合并进 `main` 前运行本文件列出的全部测试；测试全部成功后合并并推送。
3. 服务器发布时遵循 `docs/deployment.md`：生成服务器 `.env`、执行逻辑备份、构建 Compose 服务、验证健康接口，再配置 HTTPS、备份任务与腾讯云 CMS 凭据。
