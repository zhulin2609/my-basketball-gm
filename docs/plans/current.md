# Current Plan

更新时间：2026-09-22

## 当前状态

Docker Compose 本机验证已经完成。前端 Nginx、Spring Boot API 与 PostgreSQL 16 由同一组容器运行，后续工作是在用户确认后准备腾讯云轻量应用服务器部署。

当前工作分支为 `develop`。部署改造作为完整提交维护，开始新任务时先检查工作区状态。

## 当前实施内容

- 根目录前端 Dockerfile：构建 Vite 产物后由 Nginx 提供静态文件和 `/api` 反向代理。
- 后端 Dockerfile：以 Maven 与 Java 21 构建并运行 Spring Boot Jar。
- `compose.yaml`：固定 PostgreSQL 16，定义服务依赖、健康检查、内存上限、重启策略和数据库命名卷。
- `.env.docker.example`：列出本机和服务器必须提供的环境变量，不保存真实密钥。
- `docs/deployment.md`：记录本机验证、备份恢复和腾讯云服务器准备步骤。

## 验收标准

- `docker compose config` 可以解析生产服务定义。
- `docker compose up --build --detach` 后，三个服务均正常运行，`web`、`api`、`postgres` 健康检查通过。
- `curl http://localhost:8088/api/v1/health` 经由 Nginx 返回健康响应。
- `http://localhost:8088` 返回前端页面，浏览器交互回归保留给服务器部署前的发布检查。
- 前端测试、生产构建、格式检查与后端真实 PostgreSQL 测试全部通过。

## 当前验证状态

- 前端：`npm test` 已通过，11 个测试文件、52 项测试全部成功；`npm run build` 与 `npm run format:check` 已通过。
- 后端：`mvn test` 已通过，42 项测试全部成功，包含真实本机 PostgreSQL 的集成测试。
- Compose：`docker compose config --quiet`、`docker compose up --detach --build` 均已成功；`web`、`api`、`postgres` 持续健康。经 Nginx 访问 `http://localhost:8088/api/v1/health` 返回 `{"status":"ok"}`，Flyway 迁移 1–11 全部成功。
- Docker 认证链路：Nginx 反向代理保留请求的完整主机和端口，浏览器同源的 `http://localhost:8088` 已验证登录请求返回正常认证结果、注册请求返回 201，不再触发 CORS 403。
- Production 配置：新增 `backend/src/main/resources/application-production.yml`，将 Compose 提供的 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 映射为 Spring 数据源配置。

## 完成后的下一步

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
