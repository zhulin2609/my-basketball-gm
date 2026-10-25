# Docker Compose 部署

My Basketball GM 的单机部署由 Docker Compose 管理三个服务：

- `web`：构建 React 静态资源，Nginx 提供页面并反向代理 `/api`。
- `api`：Java 21 运行 Spring Boot 服务，启动时由 Flyway 执行数据库迁移。
- `postgres`：PostgreSQL 16，数据保存在 Compose 命名卷 `postgres_data`。

部署配置与应用代码分开：镜像配置保存在仓库，`.env` 仅保存当前机器的环境变量与密钥，已经被 Git 忽略。

## 本机启动

前置条件：Docker Desktop 已启动，Docker Compose 命令可用。

从模板创建本机环境文件：

```bash
cp .env.docker.example .env
```

编辑 `.env`，替换以下三个值：

- `POSTGRES_PASSWORD`：高强度随机数据库密码。
- `JWT_SECRET`：至少 32 个字符的随机字符串。
- `LLM_CREDENTIAL_ENCRYPTION_KEY`：Base64 编码后的 32 字节随机密钥。

可通过以下命令生成两个应用密钥：

```bash
openssl rand -base64 48
openssl rand -base64 32
```

第二条命令的输出用于 `LLM_CREDENTIAL_ENCRYPTION_KEY`。这个密钥必须长期保留；更换后，已保存的用户大模型 API Key 将无法解密。

构建并启动全部服务：

```bash
docker compose up --build --detach
```

默认入口为 `http://localhost:8088`。检查服务状态与健康接口：

```bash
docker compose ps
curl --fail --silent http://localhost:8088/api/v1/health
```

查看日志：

```bash
docker compose logs --follow api
docker compose logs --follow web
docker compose logs --follow postgres
```

停止服务但保留数据库：

```bash
docker compose down
```

删除服务与本机数据库卷：

```bash
docker compose down --volumes
```

该命令会永久删除本机 Compose 数据库数据，只能用于明确需要重建本机环境的场景。

## 发布前验证

### 社区关闭与备案页脚

link9.fun 的 Web 公共页脚显示 `沪ICP备2026051556号-1`，链接到 `https://beian.miit.gov.cn/`。中英文界面使用同一备案号。

社区默认关闭。部署机器的 `.env` 必须明确设置：

```dotenv
FORUM_ENABLED=false
```

Compose 将同一个值传给 Web 构建参数 `VITE_FORUM_ENABLED` 和后端环境变量 `FORUM_ENABLED`。已有 `.env` 中的 `true` 会覆盖仓库默认值；修改模板不会更改机器上的实际配置。直接运行 Vite 时使用 `VITE_FORUM_ENABLED=false`，独立启动后端时使用 `FORUM_ENABLED=false`。前端只接受 `true` / `false`；未设置时关闭，其他字符串直接报错。

关闭覆盖社区导航、阵容公开/更新/查看帖子区域、旧社区地址以及全部 `/api/v1/forum` 业务接口。旧地址替换为球员库地址。匿名读取和带有效认证的社区请求返回 404；匿名写请求仍返回 401。已有帖子、评论和阵容关联保留，无数据库清理或迁移操作。账号登录、个人阵容和对战继续可用。

本机更新实际配置后执行以下命令；腾讯云使用文末的 HTTPS 部署流程，在取得部署授权后执行，保留覆盖配置：

```bash
docker compose up --build --detach web api
```

Web 开关在构建时写入静态资源，只重启旧 Web 容器不能更新界面。部署后刷新浏览器确认新产物，检查备案链接、无社区入口、旧社区地址跳转和接口关闭。旧缓存页面可能仍显示按钮，但后端关闭后无法完成社区操作。

恢复社区须确认备案主体、服务范围及所需手续，并由用户明确批准；届时通过同一配置重新构建及启动，不设置自动恢复时间。本次开发任务未授权部署服务器。

### 自动化与服务验证

在构建生产镜像前运行完整测试：

```bash
npm test
npm run test:https
npm run build
npm run format:check
cd backend && mvn test
```

测试通过后，在本机构建容器并验证：

```bash
docker compose build
docker compose up --detach
curl --fail --silent http://localhost:8088/api/v1/health
```

浏览器打开 `http://localhost:8088`，确认页面加载、注册、登录、球员读取与阵容保存正常。API 仅由 Nginx 反向代理提供，Compose 不向宿主机公开 API 端口；PostgreSQL 仅映射到宿主机回环地址。

`postgres` 为本机数据库查看保留了回环地址映射 `127.0.0.1:5433:5432`。该端口只能由当前机器访问，可在 pgAdmin 中使用主机 `127.0.0.1`、端口 `5433` 连接；服务器防火墙不应放行 5433。

## 数据库备份与恢复

部署前与数据库迁移前执行逻辑备份：

```bash
docker compose exec --no-TTY postgres sh -c 'pg_dump --username="$POSTGRES_USER" --format=custom "$POSTGRES_DB"' > my-basketball-gm.backup
```

恢复到同名数据库前先停止 `api`，然后执行：

```bash
docker compose stop api
docker compose exec --no-TTY postgres sh -c 'pg_restore --username="$POSTGRES_USER" --clean --if-exists --dbname="$POSTGRES_DB"' < my-basketball-gm.backup
docker compose start api
```

备份文件包含用户账号、阵容、战报、社区内容和已加密的大模型 API Key。恢复这些数据时必须使用创建备份时相同的 `LLM_CREDENTIAL_ENCRYPTION_KEY`。

## 腾讯云轻量应用服务器

通过 Agent 检查连接或执行已授权部署时，使用仓库 [deploy-tencent Skill](../.agents/skills/deploy-tencent/SKILL.md)。该流程通过本机 SSH Host `mybasketball` 访问 `/opt/my-basketball-gm`，核验实际配置后依次拉取 main、备份数据库、构建并更新 Web/API、检查服务状态。检查请求保持只读；创建 Skill 不代表已执行部署。

### HTTPS 配置清单

服务器使用 Docker CE 应用镜像，由 Web 容器内的 Nginx 提供 HTTP、HTTPS 和 API 反向代理。仓库管理 `deploy/compose.https.yaml` 与 `deploy/nginx/https.conf` 源文件，服务器保存安装副本与实际环境参数。已授权发布包含经核验的目标版本配置安装；证书安装、更换单独管理。

| 用途                   | 服务器路径                                 |
| ---------------------- | ------------------------------------------ |
| 基础 Compose           | `/opt/my-basketball-gm/compose.yaml`       |
| 实际环境变量           | `/opt/my-basketball-gm/.env`               |
| HTTPS Compose 覆盖配置 | `/etc/my-basketball-gm/compose.https.yaml` |
| Nginx 站点配置         | `/etc/my-basketball-gm/default.conf`       |

服务器 `.env` 设置 `WEB_HTTP_PORT=80`、`FORUM_ENABLED=false`，并显式设置必填变量 `HTTPS_TLS_DIRECTORY`，其值是当前站点证书目录的绝对路径，只保存在服务器。该目录须直接包含非空的 `fullchain.crt` 和 `private.key`；现有证书保留原位。仓库不记录实际证书路径或安装步骤。

HTTPS 覆盖配置增加 `443:443`，将上述目录只读挂载到容器 `/etc/nginx/tls`，站点配置只读挂载到 `/etc/nginx/conf.d/default.conf`；两项 bind 挂载均禁止自动创建来源目录。`HTTPS_NGINX_CONFIG` 用于指定候选检查或隔离测试的配置文件，生产安装使用表中的 Nginx 路径。Web 健康检查访问 `http://127.0.0.1/healthz`。基础 HTTP Compose 不要求证书变量。

HTTPS 覆盖配置同时为 API 设置 `SERVER_FORWARD_HEADERS_STRATEGY=native` 与 `SERVER_TOMCAT_REDIRECT_CONTEXT_ROOT=false`。Tomcat 根据受信代理传来的 `X-Forwarded-Proto` 识别原始 HTTPS，避免同源登录被误判为跨域并返回 `403 Invalid CORS request`。基础 Compose 和本地开发配置保留默认协议行为，不扩展 `WebConfig` 的 CORS 允许名单。[Spring Boot 官方说明](https://docs.spring.io/spring-boot/how-to/webserver.html#howto.webserver.use-behind-a-proxy-server)

信任边界为单层 Nginx 边缘代理：Nginx 覆盖客户端提供的 `X-Forwarded-Proto/Host/Port/For`，清除 `Forwarded`；API 不发布宿主机端口，只接受 Compose 网络访问。保留 Tomcat 默认内部代理地址限制，禁止清空 `internal-proxies` 来信任所有地址；上线前确认实际 Nginx 容器地址在受信范围。若引入 CDN 或其他代理层，须重新设计来源信任与真实客户端地址传递。

证书来源目录应由 root 所有、权限为 700，私钥由 root 所有、权限为 600，证书链权限可为 644。部署时只检查文件类型、权限、有效期、域名覆盖及证书匹配，不输出实际目录或私钥内容。

当前 Nginx 行为：HTTP 的两个域名分别以 308 跳转到各自的 HTTPS 地址，保留路径和查询参数；HTTP `/healthz` 是回环健康检查入口。HTTPS 同时服务 `link9.fun` 与 `www.link9.fun`，证书 SAN 必须包含两者；`/api/` 转发至 Compose 内的 `api:8080`，前端页面和静态资源由 Web 容器提供。公网需要两个域名的有效 DNS 和 TCP 80/443 放行。

### 应用更新

按部署 Skill 执行以下顺序，每一步失败都停止：

1. 固定发布版本，核对目标配置、服务器安装副本和上次成功部署摘要；未知服务器修改停止覆盖。首次纳入管理须逐项核实差异并建立基线。
2. 备份数据库、`.env` 与现有配置，确认备份完整且配置摘要一致。
3. 在云端私有备份目录准备候选配置；用正式环境参数检查 Compose，并将其 JSON 输出通过标准输入交给 `scripts/https/check-config.py`。该脚本检查真实目录、非空文件、只读挂载和禁止自动创建目录，完整配置不进入日志。生成 JSON 与执行预检须使用相同 Docker CLI、Compose 插件和执行环境；预检通过 `scripts/https/compose.bind-policy.yaml` 的真实 `config` 输出识别当前版本的布尔字段省略规则，只读取配置，不启动该文件中的服务。
4. 构建目标镜像，用候选 Nginx 配置执行临时容器 `nginx -t`；此时正式配置保持原状。
5. 复核正式文件未被其他操作修改，再将已验证候选文件安装为 root 所有、644 权限；逐个文件通过同目录临时副本原子替换并检查摘要。部分安装失败时记录状态并停止，不自动恢复或启动服务。
6. 复查安装后的有效配置和 `nginx -t`，显式重新创建 Web/API，确保配置文件挂载和 API 环境参数生效。PostgreSQL 容器及数据卷保持原状。
7. 执行下述 HTTPS 验收，保存脱敏部署回执和源文件、安装副本摘要，作为下次发布基线。

候选与正式调用方式、完整检查及停止条件以 [部署 Skill](../.agents/skills/deploy-tencent/SKILL.md) 为准。使用仓库配置前，服务器必须具备必填证书变量；缺失时停止部署，不自动推断路径。服务器尚未安装并验收目标配置时，仓库修复完成不能表述为线上修复完成。

在云端同一 Bash 会话中定义调用参数：

```bash
deployment_compose=(
  sudo -n env -u HTTPS_TLS_DIRECTORY -u HTTPS_NGINX_CONFIG docker compose
  --project-directory /opt/my-basketball-gm
  --env-file /opt/my-basketball-gm/.env
  -f /opt/my-basketball-gm/compose.yaml
  -f /etc/my-basketball-gm/compose.https.yaml
)
"${deployment_compose[@]}" config --quiet
"${deployment_compose[@]}" ps
```

基础配置在前、覆盖配置在后。HTTPS 文件缺失或有效配置与实际容器不一致时停止核实，不省略覆盖文件继续启动。仅加载基础配置重建 Web，可能移除 HTTPS 的端口和挂载。

命令数组直接读取服务器 `.env`，不依赖个人 shell 别名或函数。候选验证使用同一项目和环境文件，仅切换 HTTPS 配置文件及 Nginx 来源路径。临时容器不发布端口、不启动依赖；生产私钥保留原位，实际证书路径、密钥和完整环境参数不写入 Git 或回执。

### HTTPS 验证

部署后核验两个域名的 HTTP 308 跳转、HTTPS 首页、真实 JS/CSS 资源和 `/api/v1/health`。云端回环检查使用 `curl --resolve <域名>:443:127.0.0.1 https://<域名>/` 保留 SNI 和证书验证；公网检查按正常 DNS 访问，分别记录结果。所有请求设置超时，禁止使用 `-k` / `--insecure`。具体步骤与停止条件见部署 Skill。

两个域名分别增加以下验收，`Origin` 必须与请求的 HTTPS 域名一致：健康检查 HTTP 200 且 JSON `status=ok`；登录 OPTIONS 携带 `Access-Control-Request-Method: POST` 和 `Access-Control-Request-Headers: content-type` 返回 200；使用已授权测试账号执行真实登录并用返回 token 读取 `/api/v1/auth/me`。未获账号验证授权时记为 NOT RUN，健康与 OPTIONS 通过只证明对应请求通过。错误密码及注册等写入测试限定在本地隔离测试环境；生产环境不自动创建账号。

### HTTPS 自动化回归

运行 `npm run test:https`，要求 PATH 中的 Python 3.9+ 可正常执行、OpenSSL 支持 `req -addext`、curl 支持 `%{json}`，以及 Docker Compose 2.24.4+。测试构建当前源码，使用基础 Compose、仓库 HTTPS 配置及 `scripts/https/` 的隔离覆盖配置。

每次创建随机 Compose 项目、回环随机端口和独立 PostgreSQL 数据库卷；生成一天有效且包含两个域名的测试证书，并由 curl 显式信任该证书，保留 TLS 与域名校验。先验证证书变量缺失/为空、目录或文件缺失、目录类型错误均被拒绝，确认挂载只读且不自动创建来源路径。负向对照关闭协议识别，确认无 Origin 健康请求通过而 HTTPS Origin 登录返回 CORS 403；随后启用修复，验证两个域名的健康、OPTIONS、注册、登录、token、错误密码、未授权 Origin、伪造转发头和 HTTP 跳转。最后恢复基础 Compose 配置，验证本地 HTTP 同源登录和开发 Origin。

测试失败立即报告非零退出码；结束后停止本次测试容器，保留独立数据库卷和 `.cache/https-origin/<项目名称>/` 日志、检查清单供复核。该命令不访问云端，不操作用户开发数据库。完整发布验证须同时执行 `npm test`、后端完整测试、typecheck、构建与本项测试。

2026-10-24 只读核验：云端 main 为 `efe729d45acf1ea4ea23eae309525d5f6c1941be`；合并配置为项目 `dream-court`，Web 公开 80/443，配置及证书只读挂载，Web/API 社区开关均为 false；三个服务 healthy，现有容器 `nginx -t` 通过；两个域名的回环 HTTPS 首页/API 均为 200，HTTP 首页均为 308。该记录仅代表检查时状态，不代表本轮执行了部署。证据索引见 `docs/plans/current.md` 当前任务。
