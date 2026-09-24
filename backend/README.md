# Dream Court API

本模块是 Dream Court 的 Java 后端。本机 Docker Compose 环境会以 Java 21 容器运行本服务，并连接同一 Compose 网络中的 PostgreSQL 16；完整启动、验证、备份与单机服务器准备步骤见 [`../docs/deployment.md`](../docs/deployment.md)。

## Stack

- Java 21
- Spring Boot 4.1
- MyBatis 4
- PostgreSQL 16
- Flyway

## Local run

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn spring-boot:run
```

启动前可运行 `java -version`、`javac -version` 和 `mvn -version` 检查环境，Maven 输出中的 Java version 应为 21。Homebrew 的 Maven 依赖另一个版本的 OpenJDK，因此本项目通过 `JAVA_HOME` 明确选择 JDK 21。

默认连接 `jdbc:postgresql://localhost:5432/basketball_gm_dev`。Flyway 会在首次启动时创建表结构；本地 profile 只会创建一个开发用户，用来验证未来带用户归属的接口。

启动后可访问 `GET http://localhost:8080/api/v1/health`。生产 profile 不包含本地开发用户，认证接入后由登录态提供用户 ID。

## Local player API

本地 profile 提供以下接口，方便与 Vite 前端联调：

- `GET /api/v1/players`：读取公共球员目录与当前本地开发用户的自定义球员、属性覆盖。
- `POST /api/v1/players`：创建当前本地开发用户的自定义球员。
- `PUT /api/v1/players/{id}`：更新自定义球员，或为预置球员写入当前用户的属性覆盖。

前端根目录的 `.env.local` 已把 `VITE_API_BASE_URL` 设为 `/api/v1`；执行 `npm run dev` 后，Vite 会将该路径代理到 `localhost:8080`。球员、阵容与比赛战报都会写入 PostgreSQL。

## Simulation reports

- `POST /api/v1/simulations`：由 Java V1 引擎计算比赛，并在同一事务中保存比分与球员统计。
- `GET /api/v1/simulations?limit=30`：只返回当前用户尚未过期的云端战报。
- 每场战报的 `expiresAt` 为创建时间后 30 天；查询到期后立即不可见。
- Spring 定时任务默认按 `Asia/Shanghai` 时区每天 03:00 物理删除过期战报，可通过 `SIMULATION_RETENTION_CRON` 和 `SIMULATION_RETENTION_ZONE` 调整。
