# Current Plan

更新时间：2026-10-04

## 当前状态

微信小程序项目在 `mini-app-20261004` 分支推进（产品文档：`docs/plans/wechat-miniprogram.md`）。阶段 2（npm workspaces 重构与共享包抽取）已完成、已提交（`bd5b8a5`）并推送远端，工作区干净。阶段 3（Taro 小程序游客端）需要用户明确授权后开始；`apps/miniprogram` 尚未创建。

## 当前目标

按产品文档的阶段顺序推进小程序开发：阶段 3 游客端 → 阶段 4 微信身份与登录对战 → 阶段 5 独立分享 → 阶段 6 全量回归与发布准备。每阶段完成后更新本文件与 `docs/AI_HANDOFF.md`，提交与推送按用户授权执行。

## 已完成验收（2026-10-04）

- `npm test` 19 个测试文件、84 项测试全部通过（含真实本地 HTTP 服务器的保存队列与对战编排契约测试）；`npm run typecheck`、`npm run build`、`npm run format:check`、`git diff --check` 全部通过。
- 独立 review 的八项代码发现与六项文档不一致全部修复并复验（vite envDir、会话时钟注入、旧键迁移顺序、`@catalog` 别名与按包目录 typecheck、生成脚本递增迁移版本、测试去替身化、手算期望值、全部文档路径）。
- `docker compose build` 完成，Web、API、PostgreSQL 全部 healthy；`http://localhost:8088/api/v1/health` 返回 `status: ok`，页面产物确认为当前源码构建。
- 真实浏览器冒烟通过：游客浏览、中文姓名搜索、阵容示例初始化与候选分页、本地引擎对战出战报、游客工作区协议保持（UUID、hasUserProgress、战报上限、引擎版本 `v1`）。
- Web 全部既有能力（含 AI 对战、社区、国际化）与 localStorage 键名保持不变；后端零改动（最近一次后端 Maven 测试于 2026-09-24 全部通过，此后源码未变）。
- 四项产品决定已确认并写入产品文档：小程序球员编辑只读；独立分享允许自定义球员与覆盖球员（复制时新建球员记录或覆盖）；战报分享仅查看。

## 未完成工作

- 阶段 3：Taro 小程序骨架、平台实现与游客端（浏览、阵容编辑、设备端规则对战、战报）。
- 阶段 4：微信身份绑定、新账号 Web 凭据、游客导入同名客户端键处理、登录规则对战。
- 阶段 5：独立分享的迁移、接口、审核、创建、接收、复制、撤销与到期行为。
- 剩余待确认产品细节见产品文档第 12 节（微信用户 Web 凭据方式、绑定数量、分享可见性与有效期、历史 AI 战报展示范围、导入同名客户端键处理、上线资格）。
- 腾讯云 CMS 真实凭据验证与服务器生产发布（既有安排）。

## 实施约束

- 所有数据库结构变更通过新的 Flyway 迁移提交（V14 起递增）；已发布迁移 V1–V13 不修改。
- 公共球员中文名称的唯一资源是 `backend/src/main/resources/player-catalog-chinese-names.json`。
- core 禁止依赖 React、DOM、小程序 API、存储、网络、i18n；client 通过 ports 注入平台能力。
- `main` 只接收已验证分支的合并；每次推送 `main` 前重新运行完整前后端测试。
- 生产发布前先完成数据库备份，再执行 `docker compose up --build --detach`，最后验证健康接口。
- 开发、提交、推送与发布均需用户按阶段授权。

## 测试方法

```bash
npm test
npm run typecheck
npm run build
npm run format:check
git diff --check
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

- 2026-10-04：前端与共享包 19 个测试文件、84 项测试通过；typecheck、生产构建与格式检查通过；开发服务器环境变量与真实浏览器游客主流程冒烟通过。
- 2026-10-04：Docker Compose 重建完成，Web、API、PostgreSQL 全部 healthy；Nginx 代理健康接口返回 `status: ok`。
- 2026-09-24：后端 46 项 Maven 测试全部通过（真实 PostgreSQL 16 验证 Flyway V1–V13）；此后 backend 零改动。

## 下一步具体行动

1. 用户授权后开始阶段 3：先核验 Taro 与相关依赖的兼容版本并锁定，再创建 `apps/miniprogram`。
2. 阶段 3 完成后运行 Web 全量回归与小程序开发者工具验收，更新本文件与 `docs/AI_HANDOFF.md`。
3. 阶段 4/5 按产品文档推进；剩余待确认项在第 12 节，逐项确认后实施。
