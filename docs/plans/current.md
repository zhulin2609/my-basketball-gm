# Current Plan

更新时间：2026-09-24

## 当前状态

球员中文名称与身份字段保护已经包含在 `develop` 分支的 `218b224` 提交中。416 名公共球员均已有中文名称。Docker Compose 本机验证已经完成。公网 HTTP 前端兼容修改已完成本地验证，等待提交并构建发布到腾讯云轻量应用服务器。

## 当前实施内容

- `Player`、前端 API 和后端响应使用可选 `chineseName`；`V12__add_player_chinese_names.sql` 新增可空的 `players.chinese_name` 并初始化 19 名精选球员中文名称。
- `backend/src/main/resources/player-catalog-chinese-names.json` 保存 397 名历史球员中文名称，并由 Vite 与 Flyway 共用；`V13__seed_historical_player_chinese_names` 将名称写入数据库。公共目录共 416 名球员，数据库与前端均保证中文名称完整。
- 中文界面将存在中文名称的球员渲染为“英文名（中文名）”，英文界面保持英文名；球员库、候选列表、阵容表、详情页和社区帖子成员表的名称元素均使用单行省略。
- 球员库与我的阵容候选列表通过共享的 `playerSearchText` 同时检索英文名、中文名和打法。
- 公共球员编辑器禁用英文名、中文名、缩写、身高和体重；`PlayerMapper` 保存和读取公共球员覆盖时固定使用目录身份字段。
- 自定义球员的中文名输入项可留空。

- 根目录前端 Dockerfile：构建 Vite 产物后由 Nginx 提供静态文件和 `/api` 反向代理。
- 后端 Dockerfile：以 Maven 与 Java 21 构建并运行 Spring Boot Jar。
- `compose.yaml`：固定 PostgreSQL 16，定义服务依赖、健康检查、内存上限、重启策略和数据库命名卷。
- `.env.docker.example`：列出本机和服务器必须提供的环境变量，不保存真实密钥。
- `docs/deployment.md`：记录本机验证、备份恢复和腾讯云服务器准备步骤。

- 字体使用 npm 的 `@fontsource` 包提供，Vite 将所需 `.woff` 与 `.woff2` 写入前端构建制品；前端运行时不再请求 Google Fonts。
- `src/lib/identifier.ts` 使用 `uuid` 的 `v4()` 统一生成 UUID，替换全部五处直接调用 `crypto.randomUUID()` 的代码；公网 HTTP 缺少 `randomUUID()` 时仍能生成符合既有数据协议的 ID。

## 已完成验收

- 中文界面以“英文名（中文名）”显示所有公共球员；英文界面保持英文名。
- 球员库与阵容候选列表可通过中文名称搜索。
- 公共球员五项身份字段在界面和接口写入路径均不可修改；自定义球员中文名可选。
- 名称在窄列中使用省略显示，不产生自动换行。

- `docker compose config` 可以解析生产服务定义。
- `docker compose up --build --detach` 后，三个服务均正常运行，`web`、`api`、`postgres` 健康检查通过。
- `curl http://localhost:8088/api/v1/health` 经由 Nginx 返回健康响应。
- `http://localhost:8088` 返回前端页面，浏览器交互回归保留给服务器部署前的发布检查。
- 前端测试、生产构建、格式检查与后端真实 PostgreSQL 测试全部通过。
- 构建制品包含 20 个本地字体文件，未包含 Google Fonts 或 Google 静态资源地址；源码未包含直接调用 `crypto.randomUUID()` 的代码。

## 测试状态

- 2026-09-24：`npm test` 通过，13 个测试文件、59 项测试全部成功；`npm run build` 与 `npm run format:check` 通过。生产制品已核验包含 20 个本地字体文件，源码与制品未检索到 Google Fonts 地址，源码未检索到直接调用 `crypto.randomUUID()`。
- 2026-09-24：在一次性 Java 21 Maven 容器与 PostgreSQL 16 容器中运行 43 项后端测试，全部成功；测试报告没有 failures 或 errors，临时 PostgreSQL 容器已删除。
- 2026-09-24：`docker compose config --quiet` 与 `docker compose build` 通过；`web`、`api`、`postgres` 均为 healthy，经 Nginx 访问 `http://localhost:8088/api/v1/health` 返回健康响应。
- 本机已安装 Apple 芯片版 JDK 21，`/opt/homebrew/opt/openjdk@21/bin/java` 为 `arm64`；新的登录终端中 `java -version` 与 `mvn -version` 均使用该 JDK。
- Docker 认证链路：Nginx 反向代理保留请求的完整主机和端口，浏览器同源的 `http://localhost:8088` 已验证登录请求返回正常认证结果、注册请求返回 201，不再触发 CORS 403。
- Production 配置：新增 `backend/src/main/resources/application-production.yml`，将 Compose 提供的 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 映射为 Spring 数据源配置。

## 未完成工作与下一步具体行动

- 将当前前端兼容修改提交后发布到腾讯云轻量应用服务器，重新构建 `web` 服务，并通过公网 HTTP 验证字体资源请求、游客创建阵容和本地模拟。
- 配置域名 HTTPS 证书、服务器 `.env`、防火墙与备份任务。
- 配置真实 `TENCENT_SECRET_ID` 与 `TENCENT_SECRET_KEY` 后，验证腾讯云 CMS 审核链路。
- 引擎 V2：加时战报（`distributeTeamMinutes(rawMinutes, overtimePeriods)` 的加时参数已预留）、逐回合播放等。

## 测试方法

```bash
npm test
npm run build
npm run format:check
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend && mvn test
docker compose config --quiet
docker compose up --detach --build
docker compose ps
curl --fail --silent http://localhost:8088/api/v1/health
```

## 当前 Git 状态

- 当前开发分支为 `develop`，最新提交为 `218b224 feat:`。
- 修改中的文件：`package.json`、`package-lock.json`、`src/styles.css`、`src/lib/identifier.ts`、`src/lib/identifier.test.ts`、`src/lib/guest-workspace.ts`、`src/lib/repository.ts`、`src/lib/simulator.ts`、`src/App.tsx`，以及 `README.md`、`docs/README.en.md`、`backend/README.md`、`DESIGN.md`、`docs/AI_HANDOFF.md`、`docs/DECISIONS.md`、`docs/deployment.md`、`docs/plans/current.md`；均尚未提交。
- 当前已知 bug：公网 HTTP 上的旧版前端存在 Google Fonts 请求失败与 `crypto.randomUUID()` 缺失问题；当前工作区已修复，等待构建发布。
