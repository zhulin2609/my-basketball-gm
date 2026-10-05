# Current Plan

更新时间：2026-10-05

本文件保存 session-independent Task State；字段与状态语义遵循 `AGENTS.md`。路径以仓库根目录为基准。

## Task

`agent-handoff-protocol`：建立 Codex Desktop、Kimi Code、ZCode 共用的协作规则与交接机制。

## Status

DONE

## Owner

- Owner: unassigned
- Instance: agent-handoff-protocol
- Worktree: 当前仓库根目录，使用 `git rev-parse --show-toplevel` 核实。
- Branch: mini-app-20261004
- Base Commit: c57ab3eaeb5de717acd5fd9e36f65328d81dfb5c
- Write Scope: `AGENTS.md`、本文件、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/AI_HANDOFF.md`、`.agents/skills/handoff/SKILL.md`。

## Goal

新 Agent 仅依赖仓库就能区分目标与实际实现、验证交接并安全继续任务。复用现有五份文档，保留重要项目内容，创建一个 canonical handoff Skill。本任务仅修改协议文档，不修改业务代码，不提交或推送。

## Acceptance Criteria

- [x] 规则文件包含 Documentation Map、Source of Truth，以及 intended state 与 actual state 的区别。
- [x] Git Ownership 章节顺序正确，明确单一 writing agent、并行隔离及未知修改保护。
- [x] 新任务采用 progressive disclosure，恢复任务必须核验 handoff、Git、相关实现及验证结果。
- [x] current plan 保存完整任务状态；handoff 保存短期索引；架构与长期决策各自职责清晰。
- [x] 创建唯一 `.agents/skills/handoff/SKILL.md`，只定义过程，不复制仓库政策。
- [x] 交接按 checkpoint 更新，不自动执行 Git 变更、删除文件或维护工具专属副本。
- [x] 引用、状态、Owner、Git 元数据一致；原有小程序进度、验证依据及历史决策保留。
- [x] 文档格式、协议、Skill frontmatter 和敏感信息检查通过；说明工具自动发现能力的验证范围。

## Plan

### 1. Investigation

- [x] 完整读取五份文档并核验 branch、HEAD、status、diff 和最近提交。
- [x] 确认职责重叠：handoff 重复架构和完整任务；架构混入验收进度；新任务无条件读取全部文档。

### 2. Implementation

- [x] 补充仓库规则、导航、权威范围、写入归属和接手流程。
- [x] 分离完整任务状态与交接索引，保留未完成产品工作。
- [x] 保留已有四条长期决策并记录已接受的协作协议。
- [x] 创建唯一 canonical handoff Skill。

### 3. Validation

- [x] 检查文档路径、字段、Skill frontmatter 与 fresh agent 接手流程。
- [x] 检查格式、差异、类型及敏感信息，确认没有修改业务文件。
- [x] 刷新 plan 与 handoff 的最终状态并核对 Git 元数据。

## Current State

任务开始时 `mini-app-20261004` 分支 HEAD 为 `c57ab3e`，工作区干净。用户备份 `AGENTS-backup20261005.md` 已提交，保持原状；规则入口仍为 `AGENTS.md`。小程序真实配置已转为本地文件，模板与忽略规则已经提交。

### Deferred Project Work

微信小程序在 `mini-app-20261004` 分支推进，产品文档为 `docs/plans/wechat-miniprogram.md`。阶段 2 已提交（`bd5b8a5`），阶段 3 开发基线为 `0c06e0f`。阶段 3 游客端代码已实现并通过业务测试、类型检查和构建。完整微信运行验收仍未完成，阶段 3 保持待验收状态。

此前小程序记录显示已配置 AppID、导入开发者工具并开启服务端口；恢复产品任务时重新核验这些环境条件。本次用户授权范围为协作协议。游客端提交为 `337fb3a`，本地配置提交为 `33361f2`，敏感信息规则提交为 `2d286c3`；历史中的 AppID 暴露记录仍须与后续凭据检查区分。

### Deferred Product Goal

完成游客端的代码验证与微信真实运行验收，再按产品文档顺序推进微信身份、登录规则对战和独立分享。恢复时按 `AGENTS.md` 验证接手，并确认当前用户目标与授权范围。

### Implemented Product State

- Taro 4.3.0 + React 18.3.1 + Webpack 5.91.0 小程序，独立 React 依赖与类型解析，`react-dom` 使用 Taro 的 `@tarojs/react` 渲染器，共享源码通过 Taro 编译。Web 使用自身的 React、ReactDOM 和 Vite 配置。此前本机验证使用 Node 24.18.0，容器使用 Node 22。
- 球员列表和详情：416 名球员、中文及英文搜索、位置过滤、综合评分/三分/薪资排序、每页 12 名、能力只读。九个页面包含球员列表/详情、阵容列表/编辑/选择、对战、战报列表/详情、我的；底部入口为球员、阵容、对战、我的。
- 阵容列表、编辑和球员选择：创建、名称/描述、成员增减、位置/首发/激活；人数与重复校验；逐次保存草稿与恢复；明确正式保存状态和错误。
- 初始化与草稿读取失败时提供重新读取入口；保留草稿原始内容；没有编辑时进入选择页不写入草稿；初始化执行 API 地址校验。
- 游客规则对战、战报列表与详情、最佳球员、历史快照、20 场上限与 30 天清理。
- 同步存储、平台随机 UUID、HTTP 实现；游客流程复用 core/client。Web、共享包和后端业务源码保持原状。
- `dev:weapp`、`build:weapp`、四包 typecheck、真实磁盘存储业务测试与 Docker workspace 安装配置；Git 和 Docker 忽略 `.swc`、真实 `project.config.json` 和 `project.private.config.json`，保留配置模板。

### Remaining Product Work

- 阶段 3 剩余开发者工具及 iOS、Android 验收，包括键盘、安全区域、连续输入、返回与后台恢复、存储失败、随机 API 兼容性、重启、对战与到期。本地开发者工具使用基础库 3.17.3，项目配置的 2.15.0 兼容性尚未验证。
- 阶段 4 微信身份、新账号 Web 凭据、游客导入同名客户端键冲突处理、登录规则对战与会话切换。
- 阶段 5 独立分享的数据库、接口、审核、创建、接收、复制、管理、撤销与期限。
- 产品文档第 12 节的剩余选择及上线资格；腾讯云 CMS 真实凭据验证与服务器发布。
- npm audit 历史报告的 53 个依赖安全问题：1 low、18 moderate、30 high、4 critical；critical 涉及 Taro 依赖链的 Swiper 和 CLI 下载工具 decompress。当前微信构建使用原生组件；仍需兼容性核验与修复验证，本任务没有重新运行 audit。

### Product Constraints

- 数据库变更使用新增 Flyway 迁移，V1–V13 不修改。
- 公共中文名称只有 `backend/src/main/resources/player-catalog-chinese-names.json` 这一份来源。
- core 禁止依赖 React、DOM、小程序 API、存储、网络与 i18n；client 通过 ports 注入平台能力。
- `main` 只通过合并其他分支变更；推送 `main` 前完整运行前后端测试并全部通过。
- 生产发布前完成数据库备份，再执行构建与启动，最后验证健康接口。

### Product Validation Entry Points

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

后端测试使用 `127.0.0.1:5432` 上的真实 PostgreSQL 数据库 `basketball_gm_test`，执行前确认测试数据库已启动；现有 Compose 业务数据库使用 5433 端口。游客模式不需要 API 地址；联网功能构建时配置 `MINI_API_BASE_URL`。

### Retained Product Evidence

以下内容保留此前产品验证记录，不表示本协议任务重新执行了业务测试或运行验收。本任务核对了本地前后端日志中的测试数量；历史日志位于 `.cache/test-results/frontend.log`、`.cache/test-results/backend.log`、`.cache/test-results/wechat-runtime.log`，微信诊断位于 `.cache/wechat-automation`，安全检查位于 `.cache/security-audit/reports`。这些目录被忽略，不保证其他机器存在；缺少证据时标记未核验并重新运行相关验证。

- 2026-10-05：重新完整运行 `npm test`，21 个测试文件、91 项测试通过，无失败或跳过：Web 32 项、小程序业务 7 项、core 37 项、client 15 项。新增测试使用真实磁盘数据与共享引擎，覆盖初始化失败后重试、并发请求复用、草稿损坏与原始数据保留、草稿恢复、人数与重复限制、快照、每队 240 分钟、20 场和 30 天规则，以及 API 地址校验。四包 typecheck 与开发者工具搜索、分页、详情、四个底部页面检查再次通过，本次日志位于 `.cache/test-results`。
- 2026-10-05：四包 typecheck、Web 与微信小程序生产构建通过。小程序目录约 728 KiB（磁盘占用），`common.js` 有 268 KiB 提示；Web 保留既有 500 kB 提示。
- 2026-10-05：格式检查、差异检查、Web Docker 镜像构建通过；运行中的服务没有重新启动。
- 2026-10-04：此前版本的 Web 浏览器游客主流程和 Compose 健康检查通过。
- 2026-10-05：使用 Java 21 与独立真实 PostgreSQL 16.10 测试数据库完整运行 `mvn test`，46 项测试通过，无失败、错误或跳过；13 项 Flyway 迁移校验与新库初始化通过。临时测试数据库容器已清理，现有业务服务保持运行，backend 业务代码保持原状。
- 2026-10-05：通过微信官方 `miniprogram-automator` 在微信开发者工具 Stable 2.02.2608070、基础库 3.17.3 验证球员页标题、12 张卡片、中文及英文搜索、分页、详情和四个底部页面切换，未收到运行错误。游客初始化使用真实存储与随机接口，未修改用户阵容或战报。
- 2026-10-05：Web 新构建 JavaScript 与本机 8088 服务提供的文件 SHA-256 相同；独立 Chrome 配置读取实际页面，确认球员库标题和 12 张球员卡片已渲染。
- 剩余开发者工具流程、基础库兼容性与真机验收尚未完成，阶段 3 保持待验收状态。

### Deferred Product Next Actions

1. 完成阶段 3 的剩余开发者工具流程、基础库兼容性及 iOS、Android 真机验收。
2. 确认第 12 节中影响微信身份与导入的选择后推进阶段 4，随后实施独立分享。

## Progress

- investigation complete：核验干净基线 `c57ab3e`，确认文档职责重叠及需要保留的产品状态。
- implementation complete：完成规则、文档职责调整和单一 Skill。
- validation complete：70 处文档引用、frontmatter、八步过程、Git 元数据、历史决策、修改范围、格式、类型及敏感信息检查通过。
- task complete：协议验收完成；保留六个未提交文档修改，停止写入并释放 Owner。

## Open Questions

- 本协议任务没有阻止实施的歧义。
- Codex Desktop、Kimi Code、ZCode 的 Skill 自动发现尚未逐一运行验证；可显式读取唯一 canonical 文件，不能将文件存在视为工具集成成功。
- 小程序产品文档第 12 节的剩余选择留待产品任务确认，本任务不作决定。

## Decision Candidates

none。当前用户明确接受的单一协议设计已记录为 `docs/DECISIONS.md` 的 D-001。

## Validation

本节只记录当前协议任务的命令与结果；历史产品记录见 Retained Product Evidence。

- `node .cache/handoff-protocol/verify.cjs --complete`：PASS；六份文档、70 处文档引用、章节顺序、Skill 八步过程、Git 元数据、历史决策、完成状态及修改范围。
- Skill frontmatter：PASS；上条命令使用已有 Markdown 解析器及 `js-yaml` 检查名称、描述、长度与字段。Python `quick_validate.py`：NOT RUN，缺少 PyYAML。
- `npm run format:check`：PASS；仓库格式。canonical Skill 另以 `npx prettier --check .agents/skills/handoff/SKILL.md` 显式检查。
- `git diff --check`：PASS；tracked diff，未跟踪 Skill 单独检查。
- `npm run typecheck`：PASS；四个 TypeScript 包。
- `.cache/security-audit/tools/gitleaks dir <file> --config .cache/security-audit/audit.toml --redact --no-banner --no-color`：PASS；分别扫描 Write Scope 的六个文件，未发现匹配项，不输出原始敏感值。此处 `<file>` 表示每个实际文件路径。
- `npm test`、`mvn test`、业务构建与平台运行：NOT RUN；当前任务只修改文档，保留历史结果。
- 三个工具的 Skill 自动发现：NOT RUN；本任务提供共享文件和显式读取流程。

协议检查脚本与审计工具位于本地忽略的 `.cache`；其他机器缺少这些文件时，按验收条件重新检查文档、Git 元数据、frontmatter 和敏感信息。不会将本地脚本作为接手前提。

## Completion

全部 Acceptance Criteria 已完成，状态为 DONE，Owner 为 unassigned，`docs/AI_HANDOFF.md` 已刷新。未提交修改保留供用户审查；提交、推送及恢复产品开发依对应用户授权执行。
