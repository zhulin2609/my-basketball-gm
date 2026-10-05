# AI Handoff

更新时间：2026-10-05

## 开始工作前

依次读取 `AGENTS.md`、`docs/ARCHITECTURE.md`、本文件、`docs/plans/current.md`、`docs/DECISIONS.md`。小程序任务还须读取 `docs/plans/wechat-miniprogram.md`，随后阅读相关源码与测试，并检查：

```bash
git status --short --branch
git diff
git log -10 --oneline
```

保留已有改动，禁止使用 Git 回滚文件，禁止修改 `AGENTS.md`，禁止在 `main` 修改代码。中间文件使用已忽略的 `.cache`。

## 当前目标

在 `mini-app-20261004` 分支开发微信小程序，完整范围见 `docs/plans/wechat-miniprogram.md`。阶段 2 已提交为 `bd5b8a5`，阶段 3 开发基线为 `0c06e0f`。阶段 3 游客端代码已实现并通过业务测试、类型检查和构建，完整微信验收仍未完成。

用户已授权接手并继续开发；当前已配置 AppID，微信开发者工具已导入项目并开启服务端口。Git 提交、推送与生产发布按用户授权执行。

## 已完成工作

- npm workspaces 管理 `apps/web`、`apps/miniprogram`、`packages/core`、`packages/client`。core 提供纯领域类型、球员目录、校验与引擎；client 提供契约、会话、游客 repository、保存队列与对战编排；平台能力由应用注入。
- 小程序使用 Taro 4.3.0、React 18.3.1、Webpack 5.91.0，依赖通过锁文件固定。React 与类型解析指向小程序自身版本，`react-dom` 由 Taro 框架插件解析为 `@tarojs/react`；共享源码进入 Taro 编译范围。Web 使用独立的 React、ReactDOM 和 Vite 配置。本机验证使用 Node 24.18.0，容器使用 Node 22。
- 九个页面：球员列表、球员详情、阵容列表、阵容编辑、球员选择、对战、战报列表、战报详情、我的。底部入口为球员、阵容、对战、我的。
- 416 名球员支持中文及英文搜索、位置过滤、综合评分/三分/薪资排序、每页 12 名；能力与身份信息只读。
- 阵容支持创建、名称与描述、成员添加/移除、位置、首发和激活调整。草稿逐次同步保存并支持恢复；正式保存校验名称、描述、重复球员与人数，存在未保存草稿时对战返回错误。写入失败显示错误并保留当前编辑值。
- 初始化失败时展示错误并允许重新读取；进行中的初始化请求复用，成功后的游客服务复用。编辑页与选择页读取草稿失败时停止编辑并提供重新读取入口，保留原始键内容。进入选择页前只在存在未保存编辑时写入草稿。
- 游客对战使用共享规则引擎，持久化历史快照，展示最佳球员和统计，最多保留 20 场，30 天到期后读取时清理。
- 平台存储使用 Taro 同步接口；UUID 使用平台密码学随机数据与 uuid；HTTP 实现公共 HttpPort。游客流程使用本地数据，联网地址由 `MINI_API_BASE_URL` 提供完整 URL。
- 增加 `dev:weapp`、`build:weapp`、四包 typecheck、小程序业务测试；Dockerfile 安装时包含小程序 workspace 清单；Git 和 Docker 忽略 `.swc` 构建缓存和开发者工具的 `project.private.config.json` 本地配置。API 地址校验在初始化时执行。

## 未完成工作

- 阶段 3 的剩余开发者工具及 iOS、Android 验收：关闭重进、连续中文输入、键盘与安全区域、返回/后台草稿恢复、真实存储失败、随机接口兼容性、比赛及战报到期。
- 本地开发者工具使用基础库 3.17.3，项目配置的 2.15.0 兼容性尚未验证；上传包体积与设备性能仍待验证。
- 阶段 4：微信身份绑定、新账号 Web 凭据、游客导入同名客户端键处理、登录规则对战、会话切换。
- 阶段 5：独立分享的迁移、接口、审核、创建、接收、复制、管理、撤销与期限。
- 产品文档第 12 节的剩余选择及正式上线资格；腾讯云 CMS 真实凭据验证与服务器生产发布。

## 阶段 3 相关文件

- `apps/miniprogram/**`：新增应用、平台实现、游客业务、页面与真实磁盘存储测试。
- `package.json`、`package-lock.json`、`vitest.config.ts`、`Dockerfile`、`.gitignore`、`.dockerignore`：依赖、命令、测试范围、镜像构建与缓存忽略。
- `README.md`、`docs/ARCHITECTURE.md`、本文件、`docs/plans/current.md`、`docs/plans/wechat-miniprogram.md`：当前状态、边界与开发命令。

Web 业务源码、共享包业务源码和 backend 本阶段没有修改。运行中的 Compose 服务仍为此前启动的版本，本阶段只构建镜像。

## 仓库结构与关键约束

- `apps/web`：React + Vite、i18n、hash 路由、社区与 AI。平台连接在 `src/lib/runtime.ts`，旧键迁移在 `src/lib/guest-legacy.ts`。
- `apps/miniprogram`：Taro 页面；业务在 `src/services/guest-store.ts`，初始化与 React 订阅在 `runtime.ts`，平台实现位于 `src/platform`。
- `packages/core`：禁止依赖 React、DOM、网络、存储与 i18n；目录入口为 `@dream-court/core/catalog`。中文名称只维护 `backend/src/main/resources/player-catalog-chinese-names.json`，构建时打包。
- `packages/client`：通过 `ports.ts` 注入 StoragePort、HttpPort、ID、时钟和随机种子；保存队列请求结束后清理在途记录。
- `backend`：Java 21 + Spring Boot + MyBatis；数据库变更使用新增 Flyway 迁移，V1–V13 保持不变。
- 游客协议：稳定 UUID、schemaVersion、hasUserProgress、20 场、30 天；内置 `classic-five` 键保持兼容；示例初始化不计实际进度。
- 小程序草稿单独保存在 `dream-court.lineup-drafts.v1`，正式阵容存于共享游客工作区，完成正式保存后参与比赛。
- Web JWT 键仍为 `dream-court.auth-session.v1`，localStorage 协议保持兼容。

## 运行和验证命令

```bash
npm run dev
npm run dev:weapp
npm test
npm run typecheck
npm run build
npm run build:weapp
npm run format:check
git diff --check
docker compose build web
```

开发者工具导入 `apps/miniprogram`，产物目录为 `dist`，需要有权限的真实 AppID。游客模式不需要 API 地址；后续联网功能构建时配置 `MINI_API_BASE_URL`。

后端测试使用 `127.0.0.1:5432` 上的真实 PostgreSQL 数据库 `basketball_gm_test`，执行前确认数据库已启动。2026-10-05 的完整测试使用独立 PostgreSQL 16.10 Docker 容器，测试结束后清理该容器；现有业务数据库位于 Compose 的 5433 端口。

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn test
```

向远端推送 `main` 前必须重新完整运行前后端测试并全部通过。

## 验证状态

- 2026-10-05：重新完整运行 `npm test`，21 个测试文件、91 项测试全部通过，无失败或跳过：Web 32 项、小程序业务 7 项、core 37 项、client 15 项。业务测试真实写入 `.cache/miniprogram-tests`，验证初始化读取失败后重试、并发请求复用、草稿读取错误与数据保留、草稿恢复、阵容约束、每队 240 分钟、快照、20 场与 30 天规则；另验证 API 地址校验。四包 typecheck 与开发者工具搜索、分页、详情、四个底部页面检查再次通过，本次日志位于 `.cache/test-results`。
- 2026-10-05：四包 typecheck、微信小程序生产构建通过。构建目录约 728 KiB（磁盘占用），Webpack 提示 `common.js` 268 KiB 超出建议资源大小；实际微信上传包与性能待验证。
- 2026-10-05：Web 生产构建通过，保留既有单包超过 500 kB 提示。新构建 JavaScript 与本机 8088 服务提供的文件 SHA-256 相同；独立 Chrome 配置读取实际页面，确认球员库标题和 12 张球员卡片已渲染。
- 2026-10-05：`npm run format:check`、`git diff --check`、`docker compose build web` 通过，镜像构建包含四包 typecheck；未重新启动运行中的服务。
- 2026-10-05：npm audit 报告 53 个依赖安全问题（1 low、18 moderate、30 high、4 critical）。critical 涉及 Taro 依赖链中的 Swiper 与 CLI 下载工具的 decompress；当前微信构建使用原生组件。依赖安全问题仍待处理，不能将构建通过视为安全审计通过。
- 2026-10-05：微信开发者工具 Stable 2.02.2608070、基础库 3.17.3，通过官方 `miniprogram-automator` 验证球员页标题和 12 张卡片、中文及英文搜索、分页、详情导航、四个底部页面切换，未收到运行错误。使用真实存储和随机接口完成游客初始化，未修改用户阵容或战报。诊断脚本位于本地忽略目录 `.cache/wechat-automation`。
- 生命周期、存储失败、随机接口跨版本兼容性和真机交互尚未验证。业务测试与构建不代替完整平台验收。
- 2026-10-04：阶段 2 的 Web 浏览器游客主流程与 Compose 健康检查通过，此记录属于此前版本。
- 2026-10-05：使用 Java 21 与真实 PostgreSQL 16.10 完整运行 `mvn test`，46 项测试全部通过，无失败、错误或跳过；13 项 Flyway 迁移校验与新库初始化通过。backend 业务代码保持原状。

## 下一步具体行动

1. 在开发者工具完成阶段 3 剩余流程验收，并验证基础库兼容性与 iOS、Android 真机行为，随后更新阶段状态。
2. 确认影响阶段 4 的 Web 凭据与导入规则，随后推进微信身份和独立分享。
