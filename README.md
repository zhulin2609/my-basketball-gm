# Dream Court / 梦之队

[English README](docs/README.en.md)

一个面向 PC 浏览器的历史篮球球星资料库、阵容编辑与梦幻对战模拟器，带社区分享功能。前端为 React + TypeScript + Vite，后端为 Java 21 + Spring Boot + MyBatis，数据由 PostgreSQL 持久化。

## 游戏玩法

- **球员库**：416 名球星（19 名精选球员 + 397 名历史球星，覆盖 NBA 75 大、全明星、最佳阵容、最佳防守阵容与 1978–2026 年全部总决赛 FMVP）。支持分页浏览、搜索、位置过滤与按能力值排序。简体中文界面显示英文名与中文名，并支持中文检索。99 分制，一名球员只保存一个巅峰赛季的评价。
- **自定义球员**：可以创建自己的球员，也可以覆盖公共球员的属性评价；自定义数据归属当前账号。
- **我的阵容**：阵容为 5–15 人，最多 13 人激活；首发必须各有一位 PG / SG / SF / PF / C。
- **梦幻对战**：所有人都可以使用本地规则引擎对战；登录用户额外可以选择 AI 模拟（在 AI 设置中配置 OpenAI 兼容接口的 API Key，Key 在服务端加密保存）。战报自动评选本场最佳球员，创建 30 天后过期，每天北京时间 03:00 物理清理。
- **游客模式**：无需注册即可浏览球员库、创建球员与阵容、进行本地对战，数据保存在浏览器 localStorage。注册后自动导入游客数据；登录已有账号时由用户选择导入或暂不导入。
- **社区**：登录用户可以把符合条件的阵容公开到社区（公开即快照），其他用户浏览、评论（支持一级回复）、一键复制到自己的阵容。含自定义球员或覆盖过公共球员的阵容不能公开。写路径经过本地敏感词过滤与可选的腾讯云 CMS 审核，并有服务端限频、新账号链接限制与管理员删除通道。
- 界面支持简体中文和英文。

## 架构

系统由三部分组成，详细说明见 `docs/ARCHITECTURE.md`：

- 前端：React、TypeScript、Vite，入口为 `src/main.tsx` 和 `src/App.tsx`，开发时运行在 `127.0.0.1:5173`。
- 后端：Java 21、Spring Boot、MyBatis，入口为 `backend/src/main/java/com/basketballgm/BasketballGmApplication.java`，运行在 `127.0.0.1:8080`，按业务模块组织（auth、player、lineup、simulation、llm、guest、forum、moderation、user、config）。
- 数据库：PostgreSQL 16，结构由 `backend/src/main/resources/db/migration/` 中的 Flyway 迁移维护。

认证使用 JWT，前端把令牌保存在 localStorage。本地开发时 Vite 将 `/api` 请求代理到后端。

## 本地运行

前置条件：Node.js 与 npm、JDK 21、Maven、PostgreSQL 16，并创建开发数据库 `basketball_gm_dev`（Flyway 会在首次启动时自动建表）。

启动后端：

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn spring-boot:run
```

也可以先 `mvn package` 再用 `java -jar target/basketball-gm-api-0.0.1-SNAPSHOT.jar` 运行。启动后健康检查地址为 `http://127.0.0.1:8080/api/v1/health`。

启动前端：

```bash
npm install
npm run dev
```

前端地址为 `http://127.0.0.1:5173/`。根目录 `.env.local` 设置 `VITE_API_BASE_URL=/api/v1`（参考 `.env.example`），Vite 据此把 `/api` 代理到 `127.0.0.1:8080`。

后端常用环境变量（均有默认值，本地开发可不设）：

- `JWT_SECRET`：JWT 签名密钥，生产环境必须设置。
- `FORUM_ADMIN_USERNAMES`：社区管理员用户名，逗号分隔，管理员可删除任何帖子与评论。
- `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY`：配置后激活腾讯云 CMS 文本审核；不配置时本地敏感词过滤仍然生效。
- `MODERATION_WORD_LIST`：敏感词表位置，默认 `classpath:moderation-words.txt`，可用 `file:` 前缀指向外置文件。
- `FORUM_COMMENT_PER_SECOND` / `FORUM_COMMENT_PER_DAY` / `FORUM_PUBLISH_PER_HOUR` / `FORUM_NEW_ACCOUNT_LINK_HOURS`：社区限频与新账号链接限制的额度。

## 测试

```bash
npm test                # 前端单元、组件与数据测试（Vitest）
npm run build           # TypeScript 类型检查与生产构建
npm run format:check    # Prettier 格式检查
cd backend && mvn test  # 后端全部测试（含真实 PostgreSQL 集成测试）
```

后端集成测试使用数据库 `basketball_gm_test`，需提前创建。

## Docker Compose

单机运行环境由 Docker Compose 管理前端 Nginx、Spring Boot API 与 PostgreSQL 16。完整的本机启动、测试、备份和腾讯云轻量应用服务器准备步骤见 [docs/deployment.md](docs/deployment.md)。

## 项目文档

- `docs/ARCHITECTURE.md`：系统边界、前后端模块划分、数据库关系、测试边界。
- `docs/AI_HANDOFF.md`：当前开发状态、已完成工作、本地运行条件与测试状态。
- `docs/plans/current.md`：当前任务的方案、决策与验收标准。
- `docs/DECISIONS.md`：历史设计决策。
- `docs/deployment.md`：Docker Compose 本机与单机服务器部署说明。

## Disclaimer

This independent fan prototype is not affiliated with or endorsed by any basketball league, players association, team, or rights holder. It deliberately contains no logos, player imagery, uniforms, or copied rating database. Ratings are original illustrative data.
