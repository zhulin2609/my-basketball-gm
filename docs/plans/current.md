# Current Plan

更新时间：2026-10-12

本文件保存 session-independent Task State；字段与状态语义遵循 `AGENTS.md`。路径以仓库根目录为基准。

## Task

`wechat-miniprogram-stage3-acceptance`：完成阶段 3 游客小程序剩余的开发者工具、基础库兼容性及 iOS、Android 真机验收。已完成的实现、修复与验证保留在 Current State、Progress 和 Validation。

## Status

ACTIVE

## Owner

- Owner: codex
- Instance: codex-stage3-acceptance-resume-20261007
- Worktree: 当前仓库根目录，使用 `git rev-parse --show-toplevel` 核实。
- Branch: mini-app-20261004
- Base Commit: 4810976cf006b4bbe82506f3ab13362da3a001bc
- Write Scope: 用户授权修复 `apps/miniprogram` 的草稿提示与列表通知、补充相关测试并更新本文件；保留 ZCode 的未提交交接文档。平台测试数据修改、提交及推送按当前用户授权执行。

## Goal

按 `docs/plans/wechat-miniprogram.md` 第 11 节完成阶段 3 游客流程的平台验收，明确设备、基础库和真实运行证据，保护用户已有阵容、战报与 Web 功能。当前由 Codex 配合用户逐项验收，并修复已获授权的草稿提示问题。

## Acceptance Criteria

- [x] 保留已完成实现、历史验证和后续待办；交接可脱离聊天记录读取。
- [ ] 核验有权限的本地小程序配置、开发者工具服务端口、基础库及 iOS、Android 设备条件；不输出真实凭据。
- [ ] 完成 P01–P05、P09 的游客相关部分、P10 的本地保留规则及第 11.4 节的平台操作验收，记录具体环境、步骤和结果。
- [ ] 完成连续中文输入、键盘、安全区域、返回、后台恢复、真实存储失败与随机 API 兼容性验证。
- [ ] 验证所声明的基础库兼容范围；不能执行的项目保留 NOT RUN 和具体原因。
- [ ] 如验收引起代码修改，执行对应测试、四包 typecheck、Web 与小程序构建及必要的 Web 回归。
- [x] 修复小程序草稿提示：列表明确标示未保存草稿及对战限制；编辑页使用红色加粗的“有草稿未保存”；通过真实磁盘存储和运行状态通知测试，Web 构建产物保持一致；真实页面复验仍属于剩余平台验收。
- [ ] 全部阶段 3 必需验收有有效证据后设为 DONE；身份、联网和分享需求按后续阶段处理。

## Plan

### 1. Investigation

- [x] 核验已提交的协议、当前 Git 状态、游客初始化与页面配置及剩余产品验收要求。
- [ ] 接手后核验平台条件和授权的测试数据范围，选定未完成验收项。

### 2. Implementation

- [x] 游客小程序及已发现问题的修复已提交，详情见 Implemented Product State。
- [ ] 执行剩余平台验收；仅在有真实失败证据及对应授权时修复相关问题。

### 3. Validation

- [x] 运行交接验证：Git 元数据、四包 typecheck、`npm test`（92 项）、Web 与小程序构建、格式与差异检查全部通过（记录见 Validation）。
- [ ] 补齐剩余开发者工具、基础库兼容性和两种手机平台的真实运行证据。
- [ ] 核对所有阶段 3 验收结果，按变更范围运行代码检查和 Web 回归。
- [x] ZCode 已准备上一轮交接索引并释放 Owner；Codex 已核验接手，当前 Owner 见 Owner 章节。

## Current State

2026-10-12 真机验收发现：移除球员后直接返回时，编辑页读取草稿，列表读取正式保存阵容，人数可能不同。用户授权列表增加未保存提示并修正对战文案、编辑页统一红色加粗提示。当前修复仅涉及 `apps/miniprogram`；草稿写入成功后发布新的快照通知列表，正式数据仍由“保存阵容”更新。全部 93 项测试、四包 typecheck、两端构建与格式检查通过，Web 主 JavaScript 和 CSS 与运行中资源的 SHA-256 一致。真实设备复验尚未完成。

Codex 于 2026-10-07 接手：ZCode 的 `docs/AI_HANDOFF.md` 明确声明已停止写入，current plan 原 Owner 为 unassigned。两次 Git 核验的 HEAD 均为 `0688735b519a230172ac1aee4bffee9ab2e57c1d`，仅两份交接文档未提交、无暂存或未跟踪文件；与交接声明一致。Codex 保留原有文档内容，设置 Owner 为 codex、状态为 ACTIVE；ZCode 的 handoff 保留为上一轮交出记录，本次验证见 Validation。

交接开始时 `mini-app-20261004` 分支 HEAD 为 `4810976cf006b4bbe82506f3ab13362da3a001bc`，工作区干净。本次交接（2026-10-06）时 HEAD 为 `0688735b519a230172ac1aee4bffee9ab2e57c1d`，工作区除两份交接文档外干净。zcode 任期内完成：接管并修复四项小程序真机缺陷（页面级背景、双重转译、基础库声明 3.17.3、uuid 转译）、三项代码质量配置（`lazyCodeLoading`、发布压缩）、两项 Web 调整（移除“加入当前阵容”按钮、窄屏精简导航文案）、品牌名统一为 My Basketball GM（D-003）并归档最低基础库决策（D-002）；iOS 真机复验通过，Android 因设备缺失待验。全部改动已提交推送（`e1a883b`、`0688735`）。协议建设、文档职责及唯一 Skill 保留。小程序真实配置保持本地文件，模板与忽略规则已提交。

### Deferred Project Work

微信小程序在 `mini-app-20261004` 分支推进，产品文档为 `docs/plans/wechat-miniprogram.md`。阶段 2 已提交（`bd5b8a5`），阶段 3 开发基线为 `0c06e0f`。阶段 3 游客端代码已实现并通过业务测试、类型检查和构建。完整微信运行验收仍未完成，阶段 3 保持待验收状态。

此前小程序记录显示已配置 AppID、导入开发者工具并开启服务端口；恢复产品任务时重新核验这些环境条件。本次用户授权范围为准备交接。游客端提交为 `337fb3a`，本地配置提交为 `33361f2`，敏感信息规则提交为 `2d286c3`；历史中的 AppID 暴露记录仍须与后续凭据检查区分。

### Deferred Product Goal

完成游客端的代码验证与微信真实运行验收，再按产品文档顺序推进微信身份、登录规则对战和独立分享。恢复时按 `AGENTS.md` 验证接手，并确认当前用户目标与授权范围。

### Implemented Product State

- Taro 4.3.0 + React 18.3.1 + Webpack 5.91.0 小程序，独立 React 依赖与类型解析，`react-dom` 使用 Taro 的 `@tarojs/react` 渲染器，共享源码通过 Taro 编译。Web 使用自身的 React、ReactDOM 和 Vite 配置。此前本机验证使用 Node 24.18.0，容器使用 Node 22。
- 球员列表和详情：416 名球员、中文及英文搜索、位置过滤、综合评分/三分/薪资排序、每页 12 名、能力只读。九个页面包含球员列表/详情、阵容列表/编辑/选择、对战、战报列表/详情、我的；底部入口为球员、阵容、对战、我的。
- 阵容列表、编辑和球员选择：创建、名称/描述、成员增减、位置/首发/激活；人数与重复校验；逐次保存草稿与恢复；明确正式保存状态和错误。
- 初始化与草稿读取失败时提供重新读取入口；保留草稿原始内容；没有编辑时进入选择页不写入草稿；初始化执行 API 地址校验。
- 游客规则对战、战报列表与详情、最佳球员、历史快照、20 场上限与 30 天清理。
- 同步存储、平台随机 UUID、HTTP 实现；游客流程复用 core/client。阶段 3 游客端实现保持共享包和后端业务源码原状；后续 Web 交互及品牌调整见已提交记录。
- `dev:weapp`、`build:weapp`、四包 typecheck、真实磁盘存储业务测试与 Docker workspace 安装配置；Git 和 Docker 忽略 `.swc`、真实 `project.config.json` 和 `project.private.config.json`，保留配置模板。

### Remaining Product Work

- 阶段 3 剩余 P01 关闭后重进恢复、P04 连续编辑与页面切换的完整场景、P10 到期的真实平台表现，以及键盘、安全区域、返回、后台恢复和真实存储失败。ZCode 已记录搜索、阵容约束、游客对战、20 场上限、连续中文输入、草稿恢复与随机 API 的自动化结果，具体范围见 Validation；Codex 本次未重新执行平台验收。Android 因设备缺失待验。
- 最低基础库已按 D-002 定为 3.17.3；模板及 uuid 转译配置与该决策一致，2.15.0 不在支持范围。剩余兼容性验收按 3.17.3 及受支持环境执行。
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

以下内容保留此前产品验证记录，不表示本次交接重新执行了业务测试或运行验收。此前协议任务核对过本地前后端日志中的测试数量；历史日志位于 `.cache/test-results/frontend.log`、`.cache/test-results/backend.log`、`.cache/test-results/wechat-runtime.log`，微信诊断位于 `.cache/wechat-automation`，安全检查位于 `.cache/security-audit/reports`。这些目录被忽略，不保证其他机器存在；缺少证据时标记未核验并重新运行相关验证。

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

- implementation complete（此前产品任务）：阶段 3 游客端代码、审查问题修复及本地配置隔离已提交。
- task complete（协议任务）：`agent-handoff-protocol` 已完成并提交为 `4810976`，已推送；历史协议检查通过，业务状态完整保留。
- investigation complete（codex 交接，2026-10-05）：核验干净基线 `4810976`；原 handoff 仍引用提交前的 HEAD 和六个未提交文件，已按实际 Git 状态刷新。
- validation complete（codex 交接，2026-10-05）：四包 typecheck、21 处文档引用、Git 元数据与修改范围、格式及敏感信息检查通过；平台验收未重新执行。
- preparing handoff（codex，2026-10-05）：阶段 3 完整平台验收尚未完成，状态设为 HANDOFF_READY；Owner 释放为 unassigned，保留两份交接文档修改。
- takeover complete（zcode，2026-10-05）：按 `RECEIVE → VERIFY → ACCEPT` 核验 HEAD `4810976`、两份交接文档修改范围与阶段 3 实现（九个页面目录与 platform 层）；复跑四包 typecheck、`npm test`（21 个测试文件、91 项）、格式与差异检查全部通过，与交接声明一致，未发现 discrepancy。Owner 设为 zcode，状态 HANDOFF_READY → ACTIVE。
- implementation complete（zcode，2026-10-05，用户指令）：按用户要求移除 Web 球员详情面板的“加入当前阵容”按钮及整条死代码链（`PlayerLibraryProps.onAdd`、App 接线、`players.add` 双语文案）；加入阵容的唯一入口回到阵容编辑页的球员选择。四包 typecheck、`npm test`（91 项）、格式检查通过。改动未提交。
- implementation complete（zcode，2026-10-05，用户指令）：Web 导航在窄屏（≤900px 断点）切换为精简文案——中文“球员、阵容、对战、社区”，英文“Players、Roster、battle、Community”（battle 为用户指定的小写原文）；桌面端保持原文案。实现为按钮内同时渲染完整与精简两份文案，经 `nav-label-full`/`nav-label-compact` 类与既有断点切换可见性。新增双文案渲染测试；四包 typecheck、`npm test`（92 项）、格式检查通过。改动未提交。
- bugfix complete（zcode，2026-10-06，用户报告切 tab 闪白屏后）：定位为九个页面均缺少页面级窗口配置（编译产物 `dist/pages/*/index.json` 只有 `usingComponents`），微信在 iOS 上切换 tab 的过渡底色读取页面级 `backgroundColor`（`backgroundColorTop/Bottom` 仅支持页面级），缺失时显示默认白色。修复为全部九个页面新增 `index.config.ts`，设置 `backgroundColor`、`backgroundColorTop`、`backgroundColorBottom` 为 `#102b23` 与 `backgroundTextStyle: light`；导航栏标题继续继承全局配置。四包 typecheck、`npm test`（92 项）、`build:weapp`、格式检查通过；已核验构建产物页面 JSON 包含深色背景。真机复验由用户执行。改动未提交。
- bugfix complete（zcode，2026-10-06，用户真机调试白屏后）：用户按开发者工具提示在本地 `project.config.json` 开启 `es6` 与 `enhance`，真机调试出现 `Maximum call stack size exceeded`（转译后的类辅助链在同一行无限递归）与 `h.E.app.mount` 为 null，应用未挂载导致白屏。定位依据：Taro 构建产物已是纯 ES5（dist 抽样无 `async`、无箭头函数），开发者工具的二次转译破坏 Taro 运行时类继承辅助结构。修复为本地配置改回 `es6: false`、`enhance: false`，与仓库模板 `project.config.example.json` 一致；重建 `build:weapp` 并复核产物仍为 ES5。后续真机调试若工具再次提示开启 ES6 转 ES5，应拒绝。
- bugfix complete（zcode，2026-10-06，用户提交开发者工具代码质量优化项后）：实施三项微信代码质量配置——`app.config.ts` 增加 `lazyCodeLoading: 'requiredComponents'`（组件代码按需注入，类型已核验）；本地与模板 `project.config.json` 的 `setting.minified`、`setting.minifyWXSS` 改为 `true`（发布包 JS/WXSS 压缩）。过程中发现本地配置的 `es6`/`enhance` 被运行中的开发者工具重写回 `true`（覆盖了上一次修复），已再次改回 `false`；该两项以后必须在工具的“详情 → 本地设置”界面关闭，直接改文件会被运行中的工具覆盖。四包 typecheck、`npm test`（92 项）、`build:weapp`（产物 `app.json` 含 `lazyCodeLoading`、页面 JSON 含深色背景）、格式检查通过。三项优化的实际评分变化由用户在工具的代码质量面板复验。
- bugfix complete（zcode，2026-10-06，用户预览报错后）：预览编译报 `SyntaxError: Unexpected token ?`，位置在 `vendors.js` 的 uuid 模块（`platform/identifier.ts` 引用的 `uuid@14` 产物含 `??`、`?.` 等 ES2020 语法）；预览按 `project.config.json` 的 `libVersion: 2.15.0` 解析失败，而 `project.private.config.json` 为 3.17.3，与模拟器此前正常运行一致。修复为本地与模板的基础库声明统一提升到 `3.17.3`；预览编译按 3.17.3 原生支持该语法。改动验证：四包 typecheck、`npm test`（92 项）、格式检查通过（libVersion 为工具侧配置，无需重建产物）；预览能否通过由用户复验。
- bugfix complete（zcode，2026-10-06，用户报告真机预览被提示需开启 ES6 转 ES5 后）：全量扫描构建产物确认 ES6+ 语法仅存在于 `vendors.js` 的 uuid 模块（`const/let`、模板字符串、`??`/`?.`），其余文件均为 ES5——真机调试的 ES6 检测因此触发。修复为在 `apps/miniprogram/config/index.ts` 的 `mini.compile.include` 中加入 uuid 的实际安装路径（npm 将其提升到仓库根目录 `node_modules`，首次修复因路径指向不存在的工作区目录未生效）。重建后产物复核：`??`/`?.` 已消除，无箭头函数、无 const/let 声明、无 async，仅剩 babel 辅助函数错误提示字符串中的英文单词（非语法）。`npm test`（92 项）、四包 typecheck、格式检查通过。开发者工具的 ES6 检测应不再触发，保持“ES6 转 ES5”关闭由用户复验真机预览。
- decision accepted（zcode，2026-10-06，用户确认）：最低基础库版本定为 3.17.3，已按 AGENTS.md 的字段要求归档为 `docs/DECISIONS.md` 的 D-002；current plan 的 Decision Candidates 对应清空。
- validation complete（用户，2026-10-06）：iOS 真机复验通过——小程序启动无白屏、切 tab 无白闪，预览可用；本轮四项缺陷修复（页面级背景、双重转译、基础库声明、uuid 转译）全部生效。Android 真机验收因设备缺失保留 NOT RUN；阶段 3 其余平台验收（P01–P05 全场景、P09 游客部分、P10 本地保留规则、§11.4 交互项）仍待执行。
- implementation complete（zcode，2026-10-06，用户指令）：品牌名统一为 My Basketball GM——用户手动替换了 README、CHANGELOG、架构与部署文档、后端 pom 与 README、Web 品牌文案；zcode 检查后补齐遗漏：`apps/web/index.html` 的 `<title>` 与 meta 描述（原为“Link's 篮球经理”），删除 `CHANGELOG.md`、`apps/web/index.html` 顶部的编辑器模板注释（含“请输入brook链接”占位文字），品牌缩写 `DC` → `GM`（顶部导航、登录页、游客导入页三处），`pom.xml` 的 `<description>` 经 Maven 校验生效。存储键 `dream-court.*`（7 个）按数据兼容要求保持原样；`@dream-court/*` 包名为内部标识符暂不重命名。四包 typecheck、`npm test`（92 项）、Web 构建、格式检查通过。
- changes committed（zcode，2026-10-06）：`e1a883b`（小程序真机修复与 Web 交互调整）与 `0688735`（品牌统一）已推送 `origin/mini-app-20261004`；上文各条目所述“改动未提交”状态随这两次提交解除。
- preparing handoff（zcode，2026-10-06）：按 `.agents/skills/handoff/SKILL.md` 运行交接验证并刷新本文件与 `docs/AI_HANDOFF.md`；状态设为 HANDOFF_READY，Owner 释放为 unassigned，两份交接文档保留未提交。
- takeover complete（zcode，2026-10-07，用户指令“继续执行未完成的任务”）：核验 HEAD `0688735` 未变、工作区仅含 zcode 自己的两份交接文档；Owner 设回 zcode（Instance: zcode-stage3-acceptance-resume-20261007），状态 HANDOFF_READY → ACTIVE，继续执行阶段 3 剩余平台验收。
- acceptance complete（zcode，2026-10-07，自动化部分）：通过 `miniprogram-automator` + 开发者工具（自动化端口 9420、基础库 3.17.3）完成可自动化验收——P01 首次打开与初始化、P02 搜索/过滤/排序、P03 阵容校验（重复“已加入”禁用、15 人上限禁用、空阵容保存与对战提示分离）、P05 游客对战与统计约束（每队 240 分钟、单人 ≤48、比分一致、30 天到期、引擎 v1）、P10 的 20 场上限、P09 中文界面与英文定位简介、§11.4 连续中文输入/清空名称保存被拒/草稿恢复/随机 API 真实调用。详见 Validation 的四批记录。
- acceptance blocked（zcode，2026-10-07）：本自动化环境每次重新编译会清空模拟器存储（标记探针证实），“关闭后重进的数据恢复（P01 后半）、P10 到期、后台恢复、存储失败”无法自动化验证，转用户真机/工具手动项；Android 真机因设备缺失 NOT RUN。
- takeover complete（codex，2026-10-07）：按 `RECEIVE → VERIFY → ACCEPT` 核验 ZCode 的停止写入声明、Owner 释放、HEAD `0688735` 与两份交接文档；核对平台存储、随机 UUID、九份页面配置、uuid 转译及 Web 品牌与导航实现。复跑四包 typecheck 与全部 92 项测试通过，Owner 设为 codex，状态 HANDOFF_READY → ACTIVE。
- validation complete（codex，2026-10-12，真机验收准备）：核验远端分支 HEAD 与本地 `0688735` 一致，重新构建 Web、小程序与本地后端 JAR；四包 typecheck、92 项测试通过。运行中的 Web 资源与新构建一致，后端业务类、资源和依赖与新 JAR 一致；三个本机服务健康，保持现有容器和数据。手机端需要通过开发者工具的新预览进入本次构建，真实设备验收仍待用户逐项执行。
- implementation and validation complete（codex，2026-10-12，草稿提示）：列表增加“有草稿未保存”、已保存人数说明及保存后才能对战的提示；编辑页统一红色加粗提示；草稿写入发布状态通知。新增真实磁盘存储测试验证 15 人阵容移除四人后草稿恢复、通知、对战拒绝与正式保存后 11 人更新；全部 93 项测试、四包 typecheck、两端构建通过，Web 主 JavaScript 与 CSS 与运行版本一致。真实页面复验仍待执行。

## Open Questions

- 开发者工具权限、服务端口与基础库 3.17.3 已在 iOS 真机验证可用（用户复验通过）；Android 设备缺失，对应验收保留 NOT RUN，待设备就绪后执行并记录。
- Codex 已确认从可用 Skill 列表读取 canonical handoff；ZCode 于 2026-10-05 接手时未在自动发现的 Skill 列表中看到该 Skill，已显式读取 `.agents/skills/handoff/SKILL.md` 完成接手，显式引用路径可用；Kimi Code 的自动发现仍未验证。
- 产品文档第 12 节中微信身份、导入和上线资格的选择留待后续产品任务确认；不阻止游客端验收。
- ZCode 记录的自动化重编译清空模拟器存储属于历史环境观察，Codex 尚未重新验证其原因及适用范围；不据此判定其余平台验收无法执行。

## Decision Candidates

none。最低基础库版本决定已获用户确认并归档为 `docs/DECISIONS.md` 的 D-002；此前用户明确接受的协议设计记录为 D-001。

## Validation

各次执行按日期和 Agent 分开记录；历史结果不代表本次重新执行。历史产品结果另见 Retained Product Evidence。

### Codex 草稿提示修复（2026-10-12）

- `npm test`：PASS；21 个文件、93 项测试，包括新增的真实磁盘存储与运行状态通知回归测试；覆盖草稿存在、移除后人数差异、服务重建恢复、对战拒绝及正式保存后的清理和人数更新。测试未使用 mock。
- `npm run build:weapp`、`npm run build`：PASS；均包含四包 typecheck。小程序 `common.js` 268 KiB、Web 主文件 595.56 kB，保留已有体积提示；小程序产物样式包含 `.draft-warning` 的红色和 `font-weight: 700`。
- `npm run format:check`、`git diff --check`：PASS；代码与文档格式及差异检查。
- `git diff --name-only -- apps/web packages backend`、`shasum -a 256 apps/web/dist/assets/index-*.js apps/web/dist/assets/index-*.css` 与对应 HTTP 资源读取：PASS；Web、共享包和后端无源码差异，Web 主 JavaScript 与 CSS 的 SHA-256 分别与运行中资源一致。本次没有重启或发布服务。
- 开发者工具页面交互、真机红色加粗渲染与返回流程：NOT RUN；本机未发现自动化端口 9420 的监听，未启动或清理用户的开发者工具及存储。平台结果不得由业务测试和构建推断为通过。

### Codex 真机验收准备（2026-10-12）

- `git status --short --branch`、`git rev-parse HEAD`、`git log -3 --oneline`、`git diff`、`git diff --cached`、`git ls-remote origin refs/heads/mini-app-20261004 refs/heads/main`：PASS；本地与远端当前分支均为 `0688735b519a230172ac1aee4bffee9ab2e57c1d`，仅原有两份交接文档未提交，无暂存内容；未修改业务代码。
- `npm run build`、`npm run build:weapp`：PASS；两次构建均执行四包 typecheck。Web 主文件 595.56 kB、小程序 `common.js` 268 KiB，保留体积提示；核验小程序产物的九个页面、品牌标题、深色背景和 `lazyCodeLoading`。
- `npm test`：PASS；21 个文件、92 项测试全部通过。
- `mvn --batch-mode --no-transfer-progress package -DskipTests`（Java 21）：PASS；更新 `backend/target/basketball-gm-api-0.0.1-SNAPSHOT.jar`。`mvn test`：NOT RUN；本次未启动独立 PostgreSQL 测试数据库，打包命令跳过后端测试。
- `docker compose build web api`：NOT RUN（完整命令未完成）；Web 子构建完成，API 子构建在下载 Maven 依赖时主动终止。随后通过 JAR 内容比对确认运行中后端已包含当前业务实现，无需重建或重启该容器；不将本次 API 镜像构建记为通过。
- `shasum -a 256`、容器内 `sha256sum` 与 HTTP 资源读取：PASS；Web 的 `index.html` 和主 JavaScript 与本次本地构建一致，HTTP 返回主文件的 SHA-256 为 `57328b19dae1c089c4e6e92718650ef9eb8f47b2bfa568440182b9e82945cfff`。
- `docker compose cp api:/app/app.jar .cache/preflight-20261012/running-api.jar`、`python3 .cache/preflight-20261012/compare_backend.py`：PASS；使用标准库 `zipfile` 读取两份 JAR，197 个业务类、资源及依赖条目逐项 SHA-256 比较，差异为 0。本地辅助脚本与产物被 Git 忽略，其他机器需要重新验证。
- `docker compose ps`、`curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8088/api/v1/health`：PASS；web、api、postgres 均 running/healthy，健康接口返回 `status: ok`；没有重启服务或操作业务数据。
- 本地小程序配置核验：PASS；基础库 3.17.3、`miniprogramRoot: dist/`、`es6: false`、`enhance: false`；未输出真实账号配置。
- 手机端新预览与 12 项真机验收：NOT RUN；用户通过开发者工具“编译 → 预览”并扫描新二维码后，分别记录 iOS、Android 结果。

### Codex 接手验证（2026-10-07）

- `git status --short --branch --untracked-files=all`、`git branch --show-current`、`git rev-parse --show-toplevel`、`git rev-parse HEAD`、`git log -3 --oneline`、`git diff --stat`、`git diff`、`git diff --cached`：PASS；分支、HEAD、两份未提交文档及无暂存内容与 ZCode 交接一致，保留现有修改。
- 实现核验：PASS；基础库模板 3.17.3、关闭二次转译、uuid 的实际安装路径进入转译范围、九份页面配置、同步存储与随机 UUID 实现均已检查；Web 品牌及导航调整已存在。
- `npm run typecheck`：PASS；core、client、web、miniprogram 四包。
- `npm test`：PASS；21 个测试文件、92 项测试全部通过。
- `npm run format:check`、`git diff --check`：PASS；仓库格式及现有文档差异。
- `.cache/security-audit/tools/gitleaks dir docs/plans/current.md --config .cache/security-audit/audit.toml --redact --no-banner --no-color`：PASS；扫描本次修改的 current plan，未发现匹配项。
- 业务构建、`mvn test`、开发者工具及 iOS、Android 真实运行：NOT RUN；本次完成接手核验，未重新执行平台验收或修改平台数据。

### Codex 交接验证（2026-10-05）

- `git status --short --branch --untracked-files=all`、`git branch --show-current`、`git rev-parse HEAD`、`git log -3 --oneline`、`git diff --stat`、`git diff`、`git diff --cached`：PASS；起始工作区干净，HEAD 为 `4810976`，交接后仅两份状态文档修改且没有暂存内容。
- `npm run typecheck`：PASS；core、client、web、miniprogram 四包检查。
- `node .cache/handoff-protocol/verify-transfer.cjs`：PASS；两份交接文档、21 处文档引用、章节、Git 元数据、未完成验收、历史证据、Owner 与修改范围。
- `npm run format:check`、`git diff --check`：PASS；仓库格式和两份文档差异检查。
- `.cache/security-audit/tools/gitleaks dir <file> --config .cache/security-audit/audit.toml --redact --no-banner --no-color`：PASS；`<file>` 分别为 `docs/plans/current.md` 和 `docs/AI_HANDOFF.md`，逐文件扫描未发现匹配项。
- `npm test`、`mvn test`、业务构建及平台运行：NOT RUN；本次仅更新交接文档，完整业务与平台结果保留为历史证据。
- Kimi Code、ZCode 的 Skill 自动发现与实际切换：NOT RUN。

zcode 接手验证（2026-10-05）：

- `git branch --show-current`、`git rev-parse HEAD`、`git log -3 --oneline`、`git diff --cached`、`git status --short`：PASS；分支与 HEAD 与本文件声明一致，仅两份交接文档修改，无暂存内容与未跟踪文件。
- `npm run typecheck`：PASS；core、client、web、miniprogram 四包。
- `npm test`：PASS；21 个测试文件、91 项测试全部通过。
- `npm run format:check`、`git diff --check`：PASS。
- 小程序构建、`mvn test` 与平台运行：NOT RUN；采用 Retained Product Evidence 的 2026-10-05 记录，后续验收按需重跑。

zcode 用户指令变更验证（2026-10-05，移除 Web“加入当前阵容”按钮后）：

- `npm run typecheck`：PASS；core、client、web、miniprogram 四包。
- `npm test`：PASS；21 个测试文件、91 项测试全部通过（无测试引用被移除的按钮或 `players.add` 文案）。
- `npm run format:check`、`git diff --check`：PASS。
- 构建、平台运行：NOT RUN；纯界面入口移除，待下次构建或验收时覆盖。

zcode 用户指令变更验证（2026-10-05，Web 导航窄屏精简文案后）：

- `npm run typecheck`：PASS；core、client、web、miniprogram 四包。
- `npm test`：PASS；21 个测试文件、92 项测试全部通过（新增导航双文案渲染测试，覆盖中文与英文的完整与精简文案）。
- `npm run format:check`、`git diff --check`：PASS。
- 真实窄屏视口的样式切换表现：NOT RUN；断点行为由 CSS 保证，待用户在移动端视口或真机确认。

zcode 缺陷修复验证（2026-10-06，小程序切 tab 闪白屏）：

- `npm run typecheck`：PASS；core、client、web、miniprogram 四包（含九个新增页面配置文件）。
- `npm run build:weapp`：PASS；已核验 `dist/pages/*/index.json` 包含 `backgroundColor`、`backgroundColorTop`、`backgroundColorBottom` 深色配置。
- `npm test`：PASS；21 个测试文件、92 项测试全部通过。
- `npm run format:check`、`git diff --check`：PASS。
- 真机切 tab 无白闪：NOT RUN；待用户在开发者工具或真机复验。

zcode 缺陷修复验证（2026-10-06，真机调试双重转译白屏）：

- 本地 `apps/miniprogram/project.config.json`（gitignored）：已将 `setting.es6` 与 `setting.enhance` 改回 `false`，与模板一致。
- `npm run build:weapp`：PASS；dist 复核仍为纯 ES5（无 `async`、无箭头函数）。
- `npm run typecheck`：PASS；core、client、web、miniprogram 四包。
- `npm test`：PASS；21 个测试文件、92 项测试全部通过。
- `npm run format:check`、`git diff --check`：PASS。
- 真机调试可正常挂载：NOT RUN；待用户关闭“ES6 转 ES5”与“增强编译”后重新编译并复验。

zcode 缺陷修复验证（2026-10-06，预览编译基础库版本不符）：

- 本地与模板 `libVersion` 提升到 `3.17.3`：PASS；与 `project.private.config.json` 及真机基础库一致。
- `npm run typecheck`：PASS；四包。
- `npm test`：PASS；21 个测试文件、92 项测试全部通过。
- `npm run format:check`、`git diff --check`：PASS。
- 预览编译通过：NOT RUN；待用户在工具内重新点击预览复验。

zcode 品牌统一与代码质量验证（2026-10-06）：

- `npm run typecheck`：PASS；core、client、web、miniprogram 四包。
- `npm test`：PASS；21 个测试文件、92 项测试全部通过。
- `npm run build`（Web）与 `npm run build:weapp`：PASS；产物 `app.json` 含 `lazyCodeLoading: requiredComponents` 与深色窗口背景，页面 JSON 含深色背景，产物全量 ES5（无 `??`/`?.`、无箭头函数、无 const/let 声明）。
- `npm run format:check`、`git diff --check`：PASS。
- `mvn validate`：PASS；`pom.xml` 的 description 修改后 Maven 解析正常。
- 代码质量面板三项转“已通过”与真实窄屏视口表现：NOT RUN/由用户确认（用户已在 iOS 真机验证核心流程无异常）。

zcode 交接验证（2026-10-06，按 `.agents/skills/handoff/SKILL.md`）：

- `git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git log -5 --oneline`、`git diff --cached`：PASS；HEAD 为 `0688735`，运行验证时工作区干净（交接刷新后仅两份交接文档未提交修改）。
- `npm run typecheck`：PASS；四包。
- `npm test`：PASS；21 个测试文件、92 项测试全部通过。
- `npm run build`（Web）与 `npm run build:weapp`：PASS；产物核验同上。
- `npm run format:check`、`git diff --check`：PASS。
- `mvn test`：NOT RUN；本轮未重新执行，历史 46 项测试结果见 Retained Product Evidence；`pom.xml` 的 description 修改已通过 `mvn validate`。
- 阶段 3 剩余平台验收场景（P01–P05 全场景、P09 游客部分、P10、§11.4、Android）：NOT RUN；由接手者继续。

zcode 阶段 3 自动化验收（2026-10-07，四批脚本，环境：开发者工具自动化端口 9420、基础库 3.17.3、脚本位于 `.cache/wechat-automation`）：

- P01 首次打开：PASS；清空存储后全新启动——球员库 12 张卡片、初始化“梦幻首发/经典五人”两套示例、`hasUserProgress=false` 不计用户进度。
- P02 搜索/过滤/排序：PASS；中文“詹姆斯”4 条、英文“Curry”1 条、位置过滤 PG 94 名、清空恢复 416 名、三分排序首条变为库里、筛选变化后回到第 1 页。
- P03 阵容校验：PASS；空阵容可保存并提示“缺少 PG、SG、SF、PF、C”，候选列表对已入选球员显示“已加入”并禁用按钮，填充至 15/15 后“添加球员”禁用，对战页对 0 首发阵容提示“需要五名首发，覆盖全部位置”（保存与比赛校验分离）。
- P05 游客对战：PASS；TS 引擎在设备上计算，战报详情展示比分与最佳球员，每队 240 分钟、单人 ≤48、比分与统计一致、30 天到期、引擎 v1。
- P10 上半（20 场上限）：PASS；会话内连打 21 场后列表与存储均保留 20 场、新者优先。
- P09 游客部分：PASS；界面全部中文常量、球员定位与简介保留英文、core 无 i18n（typecheck 与单元测试为证）。
- §11.4 可自动化项：PASS；连续三次中文输入完整保留并保存、清空名称保存被拒且提示清楚、草稿自动保存并在页面重启后恢复（“已恢复草稿，请完成保存”）、工作区 UUID 由 `Taro.getRandomValues` 真实随机接口生成。
- 自动化环境限制：每次重新编译清空模拟器存储（标记探针证实）——“P01 关闭后重进恢复、P10 到期过滤的真机表现、后台恢复、存储失败”无法自动化验证，转用户真机/工具手动项；Android 真机 NOT RUN。
- 接手验证（本轮收尾）：`git status`（仅两份交接文档未提交）、HEAD `0688735`、四包 typecheck、`npm test`（92 项）、`build`、`build:weapp`、格式与差异检查全部 PASS。

交接检查脚本与审计工具位于本地忽略的 `.cache`；其他机器缺少这些文件时，按 `AGENTS.md` 与 Skill 检查文档引用、Git 元数据、状态和敏感信息。接手不依赖本地辅助脚本。

## Completion

阶段 3 的必需平台验收全部完成并记录真实证据后，任务才可设为 DONE。当前状态为 ACTIVE，Owner 为 codex；下一步优先验证 P01 关闭后重进的数据恢复，随后补齐 Remaining Product Work。两份未提交文档继续保留。Codex 交出工作时执行 `.agents/skills/handoff/SKILL.md`，刷新交接索引，将未完成任务设为 HANDOFF_READY，释放 Owner 并停止写入。
