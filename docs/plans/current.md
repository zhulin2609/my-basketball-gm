# Current Plan

更新时间：2026-10-05

## 当前状态

微信小程序在 `mini-app-20261004` 分支推进，产品文档为 `docs/plans/wechat-miniprogram.md`。阶段 2 已提交（`bd5b8a5`），阶段 3 开发基线为 `0c06e0f`。阶段 3 游客端代码已实现并通过业务测试、类型检查和构建。完整微信运行验收仍未完成，阶段 3 保持待验收状态。

用户已授权接手后继续开发。当前已配置 AppID，微信开发者工具已导入项目并开启服务端口。Git 提交、推送与发布按用户授权执行。

## 当前目标

完成游客端的代码验证与微信真实运行验收，再按产品文档顺序推进微信身份、登录规则对战和独立分享。每阶段更新本文件与 `docs/AI_HANDOFF.md`。

## 已实现内容

- Taro 4.3.0 + React 18.3.1 小程序，独立 React 依赖与类型解析，`react-dom` 使用 Taro 的 `@tarojs/react` 渲染器，共享源码通过 Taro 编译。Web 使用自身的 React、ReactDOM 和 Vite 配置。
- 球员列表和详情：416 名球员、中文搜索、位置过滤、排序、分页、能力只读。
- 阵容列表、编辑和球员选择：创建、名称/描述、成员增减、位置/首发/激活；人数与重复校验；逐次保存草稿与恢复；明确正式保存状态和错误。
- 初始化与草稿读取失败时提供重新读取入口；保留草稿原始内容；没有编辑时进入选择页不写入草稿；初始化执行 API 地址校验。
- 游客规则对战、战报列表与详情、最佳球员、历史快照、20 场上限与 30 天清理。
- 同步存储、平台随机 UUID、HTTP 实现；游客流程复用 core/client。Web、共享包和后端业务源码保持原状。
- `dev:weapp`、`build:weapp`、四包 typecheck、业务测试与 Docker workspace 安装配置；Git 和 Docker 忽略 `.swc` 和 `project.private.config.json`。

## 未完成工作

- 阶段 3 剩余开发者工具及 iOS、Android 验收，包括键盘、安全区域、连续输入、返回与后台恢复、存储失败、随机 API 兼容性、重启、对战与到期。本地开发者工具使用基础库 3.17.3，项目配置的 2.15.0 兼容性尚未验证。
- 阶段 4 微信身份、新账号 Web 凭据、游客导入冲突处理、登录规则对战与会话切换。
- 阶段 5 独立分享的数据库、接口、审核、创建、接收、复制、管理、撤销与期限。
- 产品文档第 12 节的剩余选择及上线资格；腾讯云 CMS 真实凭据验证与服务器发布。
- npm audit 报告的 53 个依赖安全问题，包括 4 个 critical，涉及 Taro 依赖链；需要兼容性核验与修复验证。

## 实施约束

- 数据库变更使用新增 Flyway 迁移，V1–V13 不修改。
- 公共中文名称只有 `backend/src/main/resources/player-catalog-chinese-names.json` 这一份来源。
- core 禁止依赖 React、DOM、小程序 API、存储、网络与 i18n；client 通过 ports 注入平台能力。
- `main` 只通过合并其他分支变更；推送 `main` 前完整运行前后端测试并全部通过。
- 生产发布前完成数据库备份，再执行构建与启动，最后验证健康接口。

## 测试方法

```bash
npm test
npm run typecheck
npm run build
npm run build:weapp
npm run format:check
git diff --check
docker compose build web
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$(brew --prefix maven)/bin:$JAVA_HOME/bin:$PATH"
cd backend
mvn test
```

首次检出后，将 `apps/miniprogram/project.config.example.json` 复制为同目录的 `project.config.json`，填写有权限的真实 AppID。真实配置与 `project.private.config.json` 由 Git 和 Docker 忽略，仓库维护使用占位值的配置模板。开发者工具导入 `apps/miniprogram`，产物目录为 `dist`。平台验收使用真实存储、随机 API 和设备，禁止以替身或业务测试代替。

## 测试状态

- 2026-10-05：重新完整运行 `npm test`，21 个测试文件、91 项测试通过，无失败或跳过：Web 32 项、小程序业务 7 项、core 37 项、client 15 项。新增测试使用真实磁盘数据与共享引擎，覆盖初始化失败后重试、并发请求复用、草稿损坏与原始数据保留、草稿恢复、人数与重复限制、快照、每队 240 分钟、20 场和 30 天规则，以及 API 地址校验。四包 typecheck 与开发者工具搜索、分页、详情、四个底部页面检查再次通过，本次日志位于 `.cache/test-results`。
- 2026-10-05：四包 typecheck、Web 与微信小程序生产构建通过。小程序目录约 728 KiB（磁盘占用），`common.js` 有 268 KiB 提示；Web 保留既有 500 kB 提示。
- 2026-10-05：格式检查、差异检查、Web Docker 镜像构建通过；运行中的服务没有重新启动。
- 2026-10-04：此前版本的 Web 浏览器游客主流程和 Compose 健康检查通过。
- 2026-10-05：使用 Java 21 与独立真实 PostgreSQL 16.10 测试数据库完整运行 `mvn test`，46 项测试通过，无失败、错误或跳过；13 项 Flyway 迁移校验与新库初始化通过。临时测试数据库容器已清理，现有业务服务保持运行，backend 业务代码保持原状。
- 2026-10-05：通过微信官方 `miniprogram-automator` 在开发者工具基础库 3.17.3 验证球员页标题、12 张卡片、中文及英文搜索、分页、详情和四个底部页面切换，未收到运行错误。游客初始化使用真实存储与随机接口，未修改用户阵容或战报。
- 2026-10-05：Web 新构建 JavaScript 与本机 8088 服务提供的文件 SHA-256 相同；独立 Chrome 配置读取实际页面，确认球员库标题和 12 张球员卡片已渲染。
- 剩余开发者工具流程、基础库兼容性与真机验收尚未完成，阶段 3 保持待验收状态。

## 下一步具体行动

1. 完成阶段 3 的剩余开发者工具流程、基础库兼容性及 iOS、Android 真机验收。
2. 确认第 12 节中影响微信身份与导入的选择后推进阶段 4，随后实施独立分享。
