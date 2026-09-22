# Current Plan

更新时间：2026-09-22

## 当前状态

球员中文名称与身份字段保护已经实现并通过本机验证，处于 `develop` 分支的未提交状态。416 名公共球员均已有中文名称。Docker Compose 本机验证已经完成；后续工作是在用户确认后准备腾讯云轻量应用服务器部署。

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

## 验收标准

- 中文界面以“英文名（中文名）”显示所有公共球员；英文界面保持英文名。
- 球员库与阵容候选列表可通过中文名称搜索。
- 公共球员五项身份字段在界面和接口写入路径均不可修改；自定义球员中文名可选。
- 名称在窄列中使用省略显示，不产生自动换行。

- `docker compose config` 可以解析生产服务定义。
- `docker compose up --build --detach` 后，三个服务均正常运行，`web`、`api`、`postgres` 健康检查通过。
- `curl http://localhost:8088/api/v1/health` 经由 Nginx 返回健康响应。
- `http://localhost:8088` 返回前端页面，浏览器交互回归保留给服务器部署前的发布检查。
- 前端测试、生产构建、格式检查与后端真实 PostgreSQL 测试全部通过。

## 当前验证状态

- 前端：`npm test` 已通过，12 个测试文件、58 项测试全部成功；`npm run build` 与 `npm run format:check` 已通过。
- 后端：`mvn test` 已通过，43 项测试全部成功，包含真实本机 PostgreSQL 的集成测试；测试库已应用 Flyway 迁移 1–13，公共球员中文名称缺失数量为零。
- Compose：`docker compose config --quiet`、`docker compose up --detach --build` 均已成功；`web`、`api`、`postgres` 持续健康。经 Nginx 访问 `http://localhost:8088/api/v1/health` 返回 `{"status":"ok"}`，Flyway 迁移 1–13 全部成功，公共球员中文名称缺失数量为零。
- Docker 认证链路：Nginx 反向代理保留请求的完整主机和端口，浏览器同源的 `http://localhost:8088` 已验证登录请求返回正常认证结果、注册请求返回 201，不再触发 CORS 403。
- Production 配置：新增 `backend/src/main/resources/application-production.yml`，将 Compose 提供的 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 映射为 Spring 数据源配置。

## 完成后的下一步

- 审阅并提交球员中文名称与身份字段保护功能。
- 将 Docker CE 方案部署至上海腾讯云轻量应用服务器，配置服务器 `.env`、防火墙、域名备案、HTTPS 证书与备份任务。
- 引擎 V2：加时战报（`distributeTeamMinutes(rawMinutes, overtimePeriods)` 的加时参数已预留）、逐回合播放等。

## 测试方法

```bash
npm test
npm run build
npm run format:check
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend && mvn test
```

## 当前 Git 状态

- 当前开发分支为 `develop`。开始新任务时运行 `git status --short --branch`、`git diff` 与 `git log -5 --oneline` 获取实时状态。
