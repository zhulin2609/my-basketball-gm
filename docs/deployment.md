# Docker Compose 部署

Dream Court 的单机部署由 Docker Compose 管理三个服务：

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

浏览器打开 `http://localhost:8088`，确认页面加载、注册、登录、球员读取与阵容保存正常。API 仅由 Nginx 反向代理提供，Compose 不向宿主机公开 `api` 或 `postgres` 端口。

## 数据库备份与恢复

部署前与数据库迁移前执行逻辑备份：

```bash
docker compose exec --no-TTY postgres sh -c 'pg_dump --username="$POSTGRES_USER" --format=custom "$POSTGRES_DB"' > dream-court.backup
```

恢复到同名数据库前先停止 `api`，然后执行：

```bash
docker compose stop api
docker compose exec --no-TTY postgres sh -c 'pg_restore --username="$POSTGRES_USER" --clean --if-exists --dbname="$POSTGRES_DB"' < dream-court.backup
docker compose start api
```

备份文件包含用户账号、阵容、战报、社区内容和已加密的大模型 API Key。恢复这些数据时必须使用创建备份时相同的 `LLM_CREDENTIAL_ENCRYPTION_KEY`。

## 腾讯云轻量应用服务器

服务器使用 Docker CE 应用镜像。上传仓库代码与服务器 `.env` 后，设置 `WEB_HTTP_PORT=80`，执行：

```bash
docker compose up --build --detach
```

公网访问前还需要完成域名备案、服务器防火墙规则、HTTPS 证书签发与 Nginx HTTPS 配置。这些步骤会在本机 Compose 验证完成后单独执行。
