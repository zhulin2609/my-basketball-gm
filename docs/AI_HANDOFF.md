# AI Handoff

更新时间：2026-09-17

## 开始工作前

按以下顺序读取仓库内容：

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. 本文件
4. `docs/plans/current.md`
5. `docs/DECISIONS.md`
6. 与任务相关的源码和测试

随后运行：

```bash
git status --short --branch
git diff
git log -5 --oneline
```

保留用户已有改动。禁止使用 Git 回滚用户文件。

## 当前目标

游客无需注册即可浏览球员库、创建或编辑球员与阵容，并使用本地规则引擎进行梦幻对战。游客产生的数据保存在当前浏览器。注册后自动导入游客数据；登录已有账号时，由用户选择导入或暂不导入。

该目标已经完成。随后完成的目标是：为球员库和我的阵容页面的球员列表提供分页，避免数百名球员一次性渲染。

当前完成的工作是「社区」功能：登录用户可以把符合条件的自建阵容公开到社区，其他用户浏览、评论（含一级回复）、一键复制到自己的阵容；游客只读浏览。方案与验收标准见 `docs/plans/current.md`。

## 已完成工作

### 前端游客体验

- 未登录用户默认进入球员库，页面不再由登录表单拦截。
- 顶部显示游客身份、登录或注册链接，并持续提示本机数据的临时性质。
- 游客可以使用球员库、自定义球员、阵容编辑和本地比赛模拟。
- 游客不能使用需要服务端账号的 AI 设置和 AI 模拟。
- 登出后重新读取浏览器游客存档并返回球员库。
- 登录页提供“继续游客体验”，可以返回球员库。
- 页面支持简体中文和英文游客文案。

### 浏览器存储

- `src/lib/guest-workspace.ts` 使用 `dream-court.guest-workspace.v1` 保存统一游客工作区。
- 工作区包含稳定的 UUID、schema 版本、时间、用户进度标记、球员修改、阵容和战报。
- 旧键 `dream-court.players.v1`、`dream-court.lineups.v1`、`dream-court.games.v1` 会自动迁移，并在迁移完成后删除。
- 内置示例阵容不会把 `hasUserProgress` 标记为 `true`；用户实际修改会标记进度。
- 游客战报仍按 30 天有效期过滤，浏览器最多保存 20 场。

### 登录后的游客数据导入

- 注册成功后自动导入存在用户进度的游客工作区。
- 登录已有账号后显示待导入的球员、阵容和战报数量；用户可以选择“导入并继续”或“暂不导入”。
- 导入成功后才清空浏览器游客工作区。
- 导入失败时保留浏览器数据，并允许重试、暂不导入或继续游客体验。
- `src/lib/guest-import.ts` 负责构造服务端请求，并为旧版战报补齐阵容名称与球员显示快照；无法可靠恢复的数据会立即报错。

### 后端与数据库

- 新增认证接口 `POST /api/v1/guest-imports`。
- Flyway 迁移 `V10__add_guest_imports.sql` 新增 `guest_imports`，以游客工作区 UUID 作为主键。
- 同一游客工作区向同一账号重试时返回已导入结果，不会重复写入。
- 同一游客工作区导入另一个账号时返回 HTTP 409，避免跨账号污染。
- 自定义球员写入数据库后，阵容成员和战报球员引用会转换为新的数据库球员 ID。
- 已过期的游客战报不会导入；有效战报保留原创建时间和到期时间。
- 整个导入过程使用一个数据库事务，任何校验或写入失败都会撤销本次导入。

### 球员列表分页

- `src/lib/use-pagination.ts` 提供 `usePagination`：维护页码状态，在 `resetSignal` 变化时回到第 1 页，列表缩短时把页码钳制到有效范围，并对传入列表切片。
- `src/App.tsx` 新增 `PaginationBar` 组件，只有一页时不渲染；按钮使用 `ghost` 样式，避开小屏下 `.compact` 被隐藏的媒体查询。
- 球员库网格每页 12 名球员，搜索、位置过滤和排序变化都会重置页码。
- 我的阵容候选球员列表每页 9 名，搜索词变化会重置页码；添加球员导致列表缩短时页码自动钳制。
- `src/i18n/resources.ts` 新增 `pagination` 组文案（简体中文、英文）。
- `src/App.test.tsx` 新增 3 项分页回归测试，覆盖翻页、搜索重置和阵容页候选列表分页。

### 社区（公开阵容与讨论）

- Flyway 迁移 `V11__add_forum.sql` 新增 `shared_lineups` 与 `lineup_comments` 两张表。
- 后端新增 `forum` 模块，提供 8 个接口：帖子列表、详情、评论列表（三个 GET 匿名可读），公开或更新帖子、撤回帖子、发表评论、删除评论、复制阵容（写操作要求登录）。
- 公开即快照：成员以 jsonb 冻结在 `shared_lineups.members`；一套阵容同一时间最多一个公开帖（`source_lineup_id` 部分唯一索引），重复公开刷新快照并保留评论数与复制数。
- 含自定义球员或作者覆盖过的公共球员的阵容不能公开：后端返回 422 与球员名单；`GET /api/v1/lineups` 响应新增 `sharedPostId` 与 `shareBlockedPlayers`，前端据此禁用公开入口并列出名单。
- 复制阵容把快照成员全部按公共球员引用写入新阵容，单事务完成并返回完整 `LineupResponse`。
- 评论平铺展示，支持一级回复；只有评论作者能删除，删除时回复级联删除，`comment_count` 同事务维护。
- 帖子列表与评论使用服务端分页（响应 `{items, total, page, pageSize}`），前端复用 `PaginationBar`。
- 前端新增社区列表与帖子详情视图（`CommunityHub`、`CommunityListView`、`CommunityPostView`），我的阵容页新增公开入口；游客看到登录引导。
- `src/i18n/resources.ts` 新增 `community` 组文案（简体中文、英文）；`src/styles.css` 新增社区样式。
- `src/App.test.tsx` 新增 3 项社区测试：导航入口、服务不可达时的错误与重试、游客看不到公开入口；社区测试把 API 地址指向不可达的 `127.0.0.1:9`，不依赖本机后端。
- 后端 `ForumApiTest` 新增 8 项真实 PostgreSQL 集成测试，覆盖匿名读、公开与重复公开、422 拦截、一级回复与级联删除计数、复制、撤回级联、分页、`LineupResponse` 新字段。

### 按钮样式与保存反馈

- 补全 `.secondary` 与 `.danger-button` 样式：此前两个类从未定义，按钮渲染为浏览器默认白底直角样式，影响顶栏、AI 设置、撤回公开等 7 处按钮。
- 公开面板的主操作按钮使用 `.share-action`（绿色描边样式），与实心绿色的对战按钮区分层级。
- 我的阵容「保存」按钮新增反馈：保存中禁用并显示「保存中…」，写入完成后显示绿色描边的「已保存」，1.6 秒后恢复；`persist` 为此返回 `Promise<void>`。
- `.ghost` 按钮补充禁用态样式。

### 输入法组合修复

- 阵容名称与注释输入框改为本地草稿状态，切换阵容时才从共享状态同步；草稿不受异步保存响应影响。
- 拼音输入法组合期间只更新草稿，组合结束（选字完成）后才写入阵容状态并触发保存。
- `persist` 的响应处理增加守卫：同一阵容已有更新的保存请求在排队时，较早的响应直接丢弃，本地状态不会被回退。

## 未完成工作

- 社区功能与三份交接文档的改动尚未提交。
- 腾讯云 TKE 部署仍属于后续工作，当前仓库只验证本地运行。

## 本轮修改过的文件

游客态业务改动已经包含在提交 `47d8020 feat: 支持游客态，更新 AGENTS.md 中的交接规范`：

- 项目与依赖：`.gitignore`、`AGENTS.md`、`package.json`、`package-lock.json`、`backend/pom.xml`
- 前端入口与界面：`src/App.tsx`、`src/styles.css`、`src/i18n/resources.ts`
- 前端数据边界：`src/lib/api.ts`、`src/lib/repository.ts`、`src/lib/guest-workspace.ts`、`src/lib/guest-import.ts`
- 前端测试：`src/App.test.tsx`、`src/lib/repository.test.ts`、`src/lib/guest-workspace.test.ts`、`src/lib/guest-import.test.ts`
- 后端游客导入：`backend/src/main/java/com/links/basketballgm/guest/` 下全部 Java 文件
- 后端战报导入支持：`backend/src/main/java/com/links/basketballgm/simulation/SimulationMapper.java`
- 数据库迁移：`backend/src/main/resources/db/migration/V10__add_guest_imports.sql`
- 后端测试：`backend/src/test/java/com/links/basketballgm/guest/GuestImportApiTest.java`、`backend/src/test/resources/application-test.yml`
- 文档骨架：`docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/plans/current.md`

提交 `13d11b1 docs: 完善 AI 交接规范` 更新了 `AGENTS.md`，提交 `17ef87e docs: Codex 完善交接文档` 更新了三份交接文档。

分页功能改动已经包含在提交 `b9d8364 feat: 球员库与我的阵容球员列表分页`。

社区功能改动（尚未提交）：

- `backend/src/main/resources/db/migration/V11__add_forum.sql`（新增）
- `backend/src/main/java/com/links/basketballgm/forum/`（新增整个模块）
- `backend/src/main/java/com/links/basketballgm/lineup/LineupController.java`、`LineupMapper.java`、`LineupResponse.java`、`SharedPostIdRow.java`（新增）、`ShareBlockedPlayerRow.java`（新增）
- `backend/src/main/java/com/links/basketballgm/config/SecurityConfig.java`
- `backend/src/test/java/com/links/basketballgm/forum/ForumApiTest.java`（新增）
- `src/types.ts`、`src/lib/api.ts`、`src/App.tsx`、`src/i18n/resources.ts`、`src/styles.css`、`src/App.test.tsx`
- `docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md`、`docs/plans/current.md`

## 修改中的文件

社区功能的全部源码文件与三份交接文档处于未提交状态，清单见上一节。

## 当前已知 bug

当前没有已确认且可以复现的产品 bug。

本地曾存在一个已经处理的运行状态问题：5173 端口上的旧 Vite 进程仍提供旧模块，导致登出后看到登录页。重启 Vite 后已确认服务返回当前游客态源码。切换分支或更改依赖后，如果浏览器显示内容与源码不一致，先检查 5173 端口上的进程和实际响应内容。

Vite 构建会报告单个 JavaScript chunk 超过 500 kB。这是构建警告，当前不会阻止运行或测试。

## 设计决策及原因

### 一个浏览器对应一个游客工作区

游客工作区使用持久 UUID。这个 UUID 同时用于导入幂等控制和跨账号冲突检查，使网络重试不会重复写入，也能阻止同一份浏览器存档进入两个账号。

### 注册自动导入，已有账号登录时由用户选择

注册产生新账号，没有覆盖已有远端数据的风险，因此自动导入。已有账号可能已经包含球员、阵容和战报，所以先显示数量并让用户决定。

### 成功导入后清空游客数据

清空可以防止后续用户在同一台设备上继承前一个用户的游客数据。失败和暂不导入都会保留工作区，保证用户可以重试或继续游客体验。

### 浏览器只保存差异数据

内置球员目录来自 `src/data/players.ts` 与生成的历史目录。localStorage 只保存自定义球员和用户覆盖，避免复制完整球员库。示例阵容只用于开始体验，不计为用户进度。

### 游客只能使用本地模拟

AI API Key 在服务端按账号加密保存。游客没有服务端身份，所以梦幻对战直接使用 TypeScript 本地规则引擎；登录用户可以在本地模拟和 AI 模拟之间选择。

### 导入使用完整事务

球员 ID、阵容成员和战报统计存在引用关系。后端在一个事务中完成预留、ID 转换和全部写入，避免数据库留下部分导入的数据。

### 分页逻辑收敛在一个 Hook 中

球员库和我的阵容都需要分页。`usePagination` 统一处理页码状态、条件变化重置（`resetSignal`）、列表缩短钳制和切片，组件只渲染当前页。查询条件变化必须回到第 1 页，否则用户会停留在旧条件下的页码看到错误子集。

### 翻页按钮不使用 `compact` 样式

`.compact` 在 900px 以下屏幕的媒体查询中被隐藏。分页控件必须始终可用，因此使用 `ghost` 样式。

### 每页数量与网格列数对齐

球员库是双列卡片网格，每页 12 名可整行显示；我的阵容候选列表是三列网格，每页 9 名可整行显示。

### 公开即快照

帖子在公开时刻把阵容成员和球员显示数据冻结为 jsonb。作者之后修改或删除源阵容不影响帖子，读者看到的始终是公开时刻的内容，复制得到的也是这份快照。

### 一套阵容最多一个公开帖

`shared_lineups.source_lineup_id` 上的部分唯一索引保证同一源阵容只会产生一个帖子。重复公开视为更新快照，评论数和复制数保留，避免同一阵容出现多个讨论串。

### 含自定义或覆盖球员的阵容不能公开

快照中的复制依赖公共球员目录的 `catalog_key`。自定义球员和他人覆盖过的属性无法被其他用户还原，公开会产生其他用户无法使用的帖子，因此在公开入口处直接拦截，后端返回 422 与球员名单。

### 评论只支持一级回复

回复的回复会让平铺列表难以理解。`parent_id` 只允许指向一级评论，删除一级评论时回复级联删除，`comment_count` 与写入在同一事务中增减。

## 本地运行条件

- Node.js 与 npm 已安装。
- Java 必须使用 JDK 21。
- Maven 位于 `/usr/local/opt/maven/bin`。
- PostgreSQL 16 本地开发库为 `basketball_gm_dev`。
- 后端集成测试库为 `basketball_gm_test`，测试配置见 `backend/src/test/resources/application-test.yml`。
- 根目录 `.env.local` 设置 `VITE_API_BASE_URL=/api/v1`，Vite 将 `/api` 代理到 `127.0.0.1:8080`。

启动后端：

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend
mvn spring-boot:run
```

启动前端：

```bash
npm run dev -- --host 127.0.0.1
```

前端地址为 `http://127.0.0.1:5173/`，后端健康检查为 `http://127.0.0.1:8080/api/v1/health`。

## 测试方法

前端单元、组件和数据测试：

```bash
npm test
```

TypeScript 类型检查与生产构建：

```bash
npm run build
```

格式检查：

```bash
npm run format:check
```

后端全部测试，包含真实本地 PostgreSQL 的游客导入接口测试：

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend
mvn test
```

`GuestImportApiTest` 会连接 `basketball_gm_test`，运行 Flyway，并验证幂等导入、跨账号冲突、自定义球员 ID 转换和过期战报过滤。`ForumApiTest` 连接同一测试库，验证社区公开、评论、复制、权限与分页。测试清理自己创建的用户数据。

## 测试状态

2026-09-17 最近一次完整验证：

- 前端：8 个测试文件、26 项测试全部通过（含 3 项分页回归测试、3 项社区界面测试、1 项保存反馈测试与 1 项输入法组合测试）。
- 生产构建：通过。
- Prettier：通过。
- 后端：22 项测试全部通过，包含 3 项真实 PostgreSQL 游客导入接口测试与 8 项社区接口测试。

## 下一步具体行动

1. 读取必需文档并检查 Git 状态。
2. 提交社区功能与本次交接文档。
3. 新功能从 `develop` 分支继续开发和验证。
4. 合并或推送 `main` 前，遵守 `AGENTS.md`：完整运行全部测试并确保全部通过。

## 当前 Git 状态

- 分支：`develop`
- HEAD：`b9d8364 feat: 球员库与我的阵容球员列表分页`
- 上游：`origin/develop`
- 未提交改动：社区功能的后端 `forum` 模块、V11 迁移、阵容接口扩展、前端社区页面与测试，以及三份交接文档。
