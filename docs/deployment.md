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

取得部署授权后，更新实际配置并执行：

```bash
docker compose up --build --detach web api
```

Web 开关在构建时写入静态资源，只重启旧 Web 容器不能更新界面。部署后刷新浏览器确认新产物，检查备案链接、无社区入口、旧社区地址跳转和接口关闭。旧缓存页面可能仍显示按钮，但后端关闭后无法完成社区操作。

恢复社区须确认备案主体、服务范围及所需手续，并由用户明确批准；届时通过同一配置重新构建及启动，不设置自动恢复时间。本次开发任务未授权部署服务器。

### 自动化与服务验证

在构建生产镜像前运行完整测试：

```bash
npm test
npm run build
npm run format:check
cd backend && mvn test
```

测试通过后构建容器并验证：

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

服务器使用 Docker CE 应用镜像。上传仓库代码与服务器 `.env` 后，设置 `WEB_HTTP_PORT=80`，执行：

```bash
docker compose up --build --detach
```

公网访问前还需要完成域名备案、服务器防火墙规则、HTTPS 证书签发与 Nginx HTTPS 配置。这些步骤会在本机 Compose 验证完成后单独执行。
