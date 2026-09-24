# Current Plan

更新时间：2026-09-24

## 当前状态

`develop` 为后续功能开发分支。`main` 已合并并推送 `develop` 的已验证内容，远端 `main` 为 `788cad5 merge: 合并 develop 分支`。`develop` 工作区当前包含未提交的注册保留用户名改动：新增 `ReservedUsernames` 与 `AuthApiTest`，修改 `AuthService.register`，全部前后端测试已通过，等待用户指示提交。

## 当前目标

保持下一次功能开发具备清晰的分支、数据库迁移、测试与发布路径。产品现有能力已覆盖球员库、中文球员名称与搜索、阵容编辑、游客工作区、本地与 AI 对战、认证、注册保留用户名校验、社区及 Docker Compose 单机运行。

## 已完成验收

- 416 名公共球员均有中文名称；简体中文界面显示“英文名（中文名）”，中文搜索可用。
- 公共球员的英文名、中文名、缩写、身高、体重在界面与服务端写入路径均受保护；自定义球员中文名可选。
- Google Fonts 已移入 npm 字体依赖，生产制品包含本地字体资源。
- 所有 UUID 写入路径均经 `src/lib/identifier.ts` 生成，源码无直接 `crypto.randomUUID()` 调用。
- Flyway V1–V13 可在真实 PostgreSQL 16 测试库中完整执行。
- Docker Compose 可构建并运行 Nginx、Spring Boot 与 PostgreSQL，`http://localhost:8088/api/v1/health` 返回健康响应。
- 游客可完成浏览、阵容编辑和本地对战；注册或登录导入流程受 UUID 与事务保护。
- 社区写操作具备内容审核、限频、链接限制、管理员删除与服务开关。
- 注册拒绝固定保留用户名（`admin`、`root`、`system` 等），大小写不敏感，返回 409 与中文提示。

## 未完成工作

- 腾讯云 CMS 真实凭据验证：需要 `TENCENT_SECRET_ID` 与 `TENCENT_SECRET_KEY`。
- 腾讯云服务器生产发布：服务器 `.env`、数据库逻辑备份、域名 HTTPS、备份任务和公网回归检查。
- 用户尚未指定下一项产品功能；开始前在 `develop` 或新的功能分支完成需求澄清。

## 实施约束

- 所有数据库结构变更通过新的 Flyway 迁移提交；已发布迁移文件不修改。
- 公共球员中文名称的唯一资源是 `backend/src/main/resources/player-catalog-chinese-names.json`。
- 前端外部资源通过 npm 打包进入制品；页面运行时不依赖第三方字体地址。
- `main` 只接收已验证分支的合并；每次推送 `main` 前重新运行完整前后端测试。
- 生产发布前先完成数据库备份，再执行 `docker compose up --build --detach`，最后验证健康接口。

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

Compose 验证：

```bash
docker compose config --quiet
docker compose up --build --detach
docker compose ps
curl --fail --silent http://localhost:8088/api/v1/health
```

## 测试状态

- 2026-09-24：前端 13 个测试文件、59 项测试通过；生产构建与格式检查通过。
- 2026-09-24：后端 46 项 Maven 测试通过（含注册保留用户名的 3 项新用例），真实 PostgreSQL 16 已验证 Flyway V1–V13。
- 2026-09-24：Compose 重建完成，Web、API、PostgreSQL 为健康状态；Nginx 代理健康接口返回 `status: ok`。

## 下一步具体行动

1. 用户确认后提交 `develop` 工作区的注册保留用户名改动。
2. 用户提出下一项功能需求后，从 `develop` 建立对应功能分支。
3. 完成代码、数据库迁移与测试后，将功能分支合并回 `develop`。
4. 需要发布时，将 `develop` 合并到 `main`，重新运行完整测试，再推送远端。
