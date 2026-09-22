# AI Handoff

更新时间：2026-09-22

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

当前任务为球员中文名称与身份字段保护：简体中文界面显示“英文名（中文名）”，球员库和我的阵容支持中文检索；416 名公共球员均有中文名称；公共球员的英文名、中文名、缩写、身高和体重不可修改；自定义球员的中文名可选。Docker Compose 本机构建和健康检查已经完成；腾讯云轻量应用服务器部署等待用户确认。部署文件、环境变量要求、备份恢复方式记录在 `docs/deployment.md`。

本轮已新增 Dockerfile、`compose.yaml`、Nginx 反向代理配置、环境变量模板、部署说明与 production 数据源配置。`docker compose config --quiet`、`docker compose up --detach --build` 均已成功；`web`、`api`、`postgres` 健康检查通过，Nginx 转发的 `/api/v1/health` 返回 `{"status":"ok"}`，Flyway 迁移 1–13 全部成功。Nginx 保留浏览器请求的完整主机和端口，`http://localhost:8088` 的同源登录与注册请求已验证分别到达正常认证结果与 201 响应。前端 58 项测试、生产构建、格式检查以及后端 43 项真实 PostgreSQL 测试均已通过。

游客无需注册即可浏览球员库、创建或编辑球员与阵容，并使用本地规则引擎进行梦幻对战。游客产生的数据保存在当前浏览器。注册后自动导入游客数据；登录已有账号时，由用户选择导入或暂不导入。

该目标已经完成。随后完成的目标是：为球员库和我的阵容页面的球员列表提供分页，避免数百名球员一次性渲染；以及「社区」功能：登录用户可以把符合条件的自建阵容公开到社区，其他用户浏览、评论（含一级回复）、一键复制到自己的阵容；游客只读浏览。

当前完成的工作是「社区内容治理（上线前置批次）」：公开阵容与评论写入前经过本地 DFA 词表与腾讯云 CMS 同步审核，服务端限频与新账号链接限制防御灌水，管理员可删除任何帖子与评论，错误改为结构化错误码并由前端按码映射文案。方案与验收标准见 `docs/plans/current.md`。

随后完成的工作是「hash 路由」：页面状态以 URL hash 为准，刷新后停留在当前页面，浏览器前进/后退可用，社区帖子详情有 `#/community/<帖子id>` 形式的可分享链接。

当前完成的工作是「后端包名重命名」：Java 包从 `com.links.basketballgm` 改为 `com.basketballgm`，Maven groupId 同步改为 `com.basketballgm`。方案与验收标准见 `docs/plans/current.md`。

随后完成的工作是「LLM 请求参数按服务商适配」：公共请求体只保留所有 OpenAI 兼容服务都接受的字段（model、messages、max_tokens），temperature 移出公共层；服务商差异收敛到 `LlmProviderProfiles` 注册表，按 baseUrl 的 host 匹配档案定制请求。方案与验收标准见 `docs/plans/current.md`。

当前完成的工作是「球队总上场时间约束」：本地规则引擎把每队总分钟归一化到 `240 + 25 × 加时次数`、把单人分钟钳制到 `48 + 5 × 加时次数` 以内（V1 无加时，恒为 240 与 48），AI 模拟的提示词写入同一组公式。约束同时落在两个本地引擎实现上：登录用户的本地对战走后端 `SimulationEngine.java`，游客走前端 `src/lib/simulator.ts`。方案与验收标准见 `docs/plans/current.md`。

随后完成的工作是「社区总开关」：`app.forum.enabled`（环境变量 `FORUM_ENABLED`，默认 `true`）为 false 时整个 `ForumController` 不配进容器，社区 8 个接口全部返回 404，数据表与数据不受影响；配套修复 `SecurityConfig` 放行 ERROR 分发，否则未映射路径会经 `/error` 被入口点拦截成 401。`FORUM_ADMIN_USERNAMES` 在社区治理批次已实现，本次未改动。

当前完成的工作是「阵容成员展示顺序统一」：`src/lib/member-display-order.ts` 新增 `orderMembersForDisplay`，激活的首发按 C→PF→SF→SG→PG 排在前五位，其余成员保持原相对顺序；阵容编辑表与社区帖子成员表共用同一规则，展示排序不改写存储顺序。

## 已完成工作

### 球员中文名称与身份字段保护

- `Player`、前端 API 请求和后端响应新增可选 `chineseName`；中文名称为空时保持英文名称展示。
- 简体中文界面以“英文名（中文名）”显示已有中文名称的球员；英文界面只显示英文名称。
- 球员库与我的阵容候选列表的检索文本包含英文名、中文名和打法，可直接输入中文名称搜索。
- 名称区域使用单行省略与完整名称提示，卡片、候选列表、阵容表、详情面板和社区帖子成员表不会因中文名称自动换行撑开布局。
- 公共球员编辑器禁用英文名、中文名、缩写、身高和体重；后端写入公共球员覆盖时始终从公共目录读取这五项值，接口请求无法改写身份信息。
- 自定义球员创建与编辑时中文名可留空；`V12__add_player_chinese_names.sql` 为 `players` 新增可空 `chinese_name` 列，并初始化 19 名精选球员的中文名称。
- `backend/src/main/resources/player-catalog-chinese-names.json` 保存 397 名历史球员的中文名称；Vite 与 Flyway 共用该资源，浏览器目录和数据库不会维护两份名称清单。
- `V13__seed_historical_player_chinese_names` 将该资源写入公共目录，逐条检查更新结果；加上精选球员后，416 名公共球员均有中文名称。

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

### 本场最佳球员

- `src/lib/player-of-the-game.ts` 新增 `scorePlayerStat` 与 `selectPlayerOfTheGame`：表现分公式为得分 ×1.0 + 篮板 ×1.2 + 助攻 ×1.5 + 抢断 ×2.0 + 盖帽 ×2.0 + 上场时间 ×0.3 +（2 × 投篮命中 − 投篮出手）+ 胜方 3 分加成；平票依次比较得分、上场时间、球员 ID。
- 公式内部以十分之一分为单位做整数运算再除以 10 返回，整数在双精度浮点下精确，平票比较可靠。
- 评选在前端展示层完成，本地战报与云端战报复用同一模块，战报数据结构不变。
- `src/App.tsx` 的 `GameResult` 在记分牌与数据表之间渲染最佳球员卡片：头像、姓名、所属阵容、主要数据行与表现分；头像与姓名优先使用战报快照字段。
- `src/i18n/resources.ts` 新增 `battle.playerOfTheGame` 与 `battle.pogScore`（简体中文、英文）；`src/styles.css` 新增 `.pog-card` 系列样式。
- `src/lib/player-of-the-game.test.ts` 新增 8 项单元测试：公式加权、效率奖惩、小样本限制、跨队选择、胜方加成、三组平票决胜、空统计、真实引擎战报的 argmax 验证。
- `src/App.test.tsx` 新增 1 项界面测试：本地模拟后展示最佳球员卡片。

### FMVP 补齐（1978–2026）

- 1978–2026 共 30 位 FMVP，其中 29 位已通过 NBA 75 大、全明星、最佳阵容、最佳防守阵容等现有数据源进入目录；只有 Cedric Maxwell（1981 年 FMVP）生涯没有上述荣誉，从未被覆盖。
- 上游数据集没有 FMVP 表，`scripts/generate-nba-history-catalog.mjs` 新增 `finalsMvpByYear`（1978–2026 每年 FMVP，含 2026 年 Jalen Brunson）与 `finalsMvp` 数据源，49 个赛季完整性断言失败即中断。
- 覆盖元数据新增 `fmvpSeasons` 与 `sourceNames.finalsMvp`；`src/data/historical-player-catalog.test.ts` 新增 `fmvpSeasons` 覆盖 1978–2026 的断言。
- 再生成只新增 Cedric Maxwell（峰值 1978–79 赛季，波士顿，SF），其余 396 名球员无变化。
- V9 迁移随目录再生成；本地开发库与测试库删除 `flyway_schema_history` 的 V9 行后，以 `SPRING_FLYWAY_OUT_OF_ORDER=true` 运行一次完成重新应用（V9 为幂等 upsert），后续常规启动校验通过。操作步骤记录在 `src/data/README.md`。

### 球员列表按能力值排序

- 球员库网格的排序控件默认即「综合能力」降序，未改动。
- 我的阵容页候选球员列表（`availablePlayers`）由目录原序改为 `average` 降序，新用户优先看到最好的球员；同分保持目录原序。
- 阵容成员表保持首发状态与位置的结构性排序，不属于浏览用球员列表。
- `src/App.test.tsx` 新增 2 项回归测试，分别断言球员库网格与阵容页候选列表按 OVR 降序。

### 社区内容治理

- 新增 `moderation` 后端模块：`SensitiveWordFilter` 从 `moderation-words.txt` 构建 DFA 词表做前置过滤；`TencentModerationClient` 以腾讯云 TMS `TextModeration` 做云端审核（3 秒超时），未配置密钥时保持关闭；`ModerationService` 串联两者，先本地后云端。
- 词表位置由 `app.moderation.word-list`（环境变量 `MODERATION_WORD_LIST`）指定，注入 Spring Resource：默认 `classpath:moderation-words.txt`，支持 `file:` 前缀外置。以 jar 方式运行且用默认 classpath 词表时，修改词表后需要重新 `mvn package` 并重启进程；外置词表只需重启。
- 审核在 Controller 层、数据库事务之外同步执行；云端调用失败或超时拒绝写入（503），未审内容不会落库。命中词条不回显给用户。
- `ForumWriteGuard` 在写事务内做计数限频：评论每秒钟 1 条、每天 50 条，发帖每小时 3 次（只计新建帖子，更新公开内容不占额度）；注册不满 24 小时的账号不能发布含链接的内容。全部额度可在 `application.yml` 配置并经环境变量覆盖。
- 新增 `ApiException`（HttpStatus + code + message），统一错误处理器输出 `{message, code}`；错误码为 `CONTENT_REJECTED`（422）、`RATE_LIMITED`（429）、`MODERATION_UNAVAILABLE`（503）、`LINK_RESTRICTED`（403）。
- 管理员由 `app.admin.usernames`（`FORUM_ADMIN_USERNAMES`）配置：`AdminRegistry` 提供大小写不敏感的判定，删除帖子与评论接口放行管理员；`AuthUserResponse` 新增 `admin` 字段，前端据此对他人的帖子与评论显示删除按钮。
- 前端 `api.ts` 抛出携带 `status` 与 `code` 的 `ApiError`；`src/lib/errors.ts` 的 `communityWriteError` 按 code 映射到四类新文案，无 code 时保持拼接后端 message 的既有行为；发表评论与公开阵容两条路径接入映射，失败时保留草稿。
- 后端 `ForumModerationTest` 新增 8 项真实 PostgreSQL 集成测试（收紧限频配置 + `@DynamicPropertySource` 注入管理员用户名），`SensitiveWordFilterTest` 新增 4 项单元测试；前端 `src/lib/errors.test.ts` 新增 4 项映射测试。

### Hash 路由

- `src/lib/hash-route.ts` 新增 `useHashRoute`：挂载时解析 `window.location.hash` 恢复视图，`navigate` 同步更新状态并写入 hash，`hashchange` 监听让浏览器前进/后退切换视图。
- hash 格式为 `#/players`、`#/lineups`、`#/battle`、`#/community`、`#/community/<帖子id>`、`#/ai-settings`、`#/auth`；无法识别的 hash 回退到球员库。
- `App.tsx` 的视图状态改为由 `useHashRoute` 提供，删除了独立的 `communityPostId` 状态；受限视图（`ai-settings` 要求登录、`community` 要求 API 启用）条件不满足时回退到球员库，URL 保持不变。
- 帖子被撤回后打开旧链接，沿用帖子详情既有的加载失败提示，不展示空白页。
- `src/App.test.tsx` 新增 6 项 hash 路由测试：加载恢复、导航写 hash、前进/后退、帖子详情直达、受限与未知 hash 回退；各测试块的 `beforeEach` 增加 hash 重置，避免 jsdom 内跨用例残留。

## 未完成工作

- 腾讯云 CMS 需要真实 `TENCENT_SECRET_ID` 与 `TENCENT_SECRET_KEY` 才会激活；当前代码就绪、配置门控默认关闭，本地词表始终生效。
- 腾讯云轻量应用服务器部署仍属于后续工作；本机 Docker Compose 验证已经完成。

## 本轮修改过的文件

游客态业务改动已经包含在提交 `47d8020 feat: 支持游客态，更新 AGENTS.md 中的交接规范`：

- 项目与依赖：`.gitignore`、`AGENTS.md`、`package.json`、`package-lock.json`、`backend/pom.xml`
- 前端入口与界面：`src/App.tsx`、`src/styles.css`、`src/i18n/resources.ts`
- 前端数据边界：`src/lib/api.ts`、`src/lib/repository.ts`、`src/lib/guest-workspace.ts`、`src/lib/guest-import.ts`
- 前端测试：`src/App.test.tsx`、`src/lib/repository.test.ts`、`src/lib/guest-workspace.test.ts`、`src/lib/guest-import.test.ts`
- 后端游客导入：`backend/src/main/java/com/basketballgm/guest/` 下全部 Java 文件
- 后端战报导入支持：`backend/src/main/java/com/basketballgm/simulation/SimulationMapper.java`
- 数据库迁移：`backend/src/main/resources/db/migration/V10__add_guest_imports.sql`
- 后端测试：`backend/src/test/java/com/basketballgm/guest/GuestImportApiTest.java`、`backend/src/test/resources/application-test.yml`
- 文档骨架：`docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/plans/current.md`

提交 `13d11b1 docs: 完善 AI 交接规范` 更新了 `AGENTS.md`，提交 `17ef87e docs: Codex 完善交接文档` 更新了三份交接文档。

分页功能改动已经包含在提交 `b9d8364 feat: 球员库与我的阵容球员列表分页`。

社区功能、按钮样式与保存反馈改动已经包含在提交 `8776b65 feat: 社区阵容公开、评论与复制，补全按钮样式与阵容保存反馈`。输入法组合修复包含在提交 `7e9b38a fix: 修复拼音输入法组合期间阵容输入框被保存响应覆盖的问题`。

本场最佳球员改动已经包含在提交 `36ff947 feat: 模拟对战结果展示本场最佳球员`。

FMVP 补齐改动已经包含在提交 `c854c1e feat: 球员库补齐 1978-2026 年全部总决赛 FMVP`。

球员列表排序改动已经包含在提交 `6cceac3 feat: 我的阵容候选球员列表按能力值降序`。

社区内容治理改动已经包含在提交 `a3d2af8 feat: 社区内容治理：敏感词审核、限频、新账号链接限制与管理员删除通道`。

hash 路由改动已经包含在提交 `9de4388 feat: hash 路由：刷新停留在当前页面，支持前进后退与帖子详情链接`。

README 重写与英文版已经包含在提交 `1bcee76 docs: 按当前玩法重写 README 并增加英文版`。

包名重命名改动已经包含在提交 `84e53ba refactor: 后端 Java 包从 com.links.basketballgm 重命名为 com.basketballgm`。

LLM 请求参数按服务商适配改动已经包含在提交 `74e5bf5`：

- 后端：`backend/src/main/java/com/basketballgm/llm/LlmProviderProfiles.java`（新）、`backend/src/main/java/com/basketballgm/llm/LlmSimulationClient.java`
- 后端测试：`backend/src/test/java/com/basketballgm/llm/LlmProviderProfilesTest.java`（新）、`backend/src/test/java/com/basketballgm/llm/LlmSimulationClientRequestBodyTest.java`（新），删除 `LlmSimulationClientProviderOptionsTest.java`
- 文档：`docs/AI_HANDOFF.md`、`docs/plans/current.md`

球队总上场时间约束改动已经包含在提交 `74e5bf5`：

- 前端引擎：`src/lib/simulator.ts`（新增 `distributeTeamMinutes` 归一化，派生统计基于归一化后的分钟）、`src/lib/simulator.test.ts`
- 后端引擎：`backend/src/main/java/com/basketballgm/simulation/SimulationEngine.java`（与前端同算法的 `distributeTeamMinutes`，登录用户的本地对战走这里）、`backend/src/test/java/com/basketballgm/simulation/SimulationEngineTest.java`
- 后端提示词：`backend/src/main/java/com/basketballgm/llm/LlmSimulationClient.java` 的 system 消息加入总分钟公式
- 后端测试：`backend/src/test/java/com/basketballgm/llm/LlmSimulationClientRequestBodyTest.java` 断言提示词含约束文本
- 文档：`docs/AI_HANDOFF.md`、`docs/plans/current.md`

社区总开关改动已经包含在提交 `74e5bf5`：

- 后端：`backend/src/main/resources/application.yml`（`app.forum.enabled`，环境变量 `FORUM_ENABLED`，默认 true）、`backend/src/main/java/com/basketballgm/forum/ForumController.java`（`@ConditionalOnProperty`）、`backend/src/main/java/com/basketballgm/config/SecurityConfig.java`（放行 ERROR 分发）
- 后端测试：`backend/src/test/java/com/basketballgm/forum/ForumDisabledTest.java`（新）
- 文档：`docs/AI_HANDOFF.md`、`docs/plans/current.md`

阵容成员展示顺序改动已经包含在提交 `e9531f1`：

- 前端：`src/lib/member-display-order.ts`（新，共享排序函数）、`src/App.tsx`（阵容编辑表与社区帖子成员表接入）
- 前端测试：`src/lib/member-display-order.test.ts`（新）
- 文档：`docs/AI_HANDOFF.md`、`docs/plans/current.md`

Docker Compose 改造由当前部署提交包含：

- 容器与环境配置：`.dockerignore`、`.env.docker.example`、`Dockerfile`、`backend/.dockerignore`、`backend/Dockerfile`、`backend/src/main/resources/application-production.yml`、`compose.yaml`、`deploy/nginx/default.conf`
- 部署文档：`README.md`、`backend/README.md`、`docs/ARCHITECTURE.md`、`docs/deployment.md`、`docs/AI_HANDOFF.md`、`docs/plans/current.md`

当前未提交的球员中文名称功能修改：

- 前端模型、显示与界面：`src/types.ts`、`src/lib/player-display.ts`、`src/App.tsx`、`src/styles.css`、`src/i18n/resources.ts`、`src/data/players.ts`
- 前端目录资源与配置：`backend/src/main/resources/player-catalog-chinese-names.json`、`vite.config.ts`、`tsconfig.app.json`
- 前端测试：`src/lib/player-display.test.ts`、`src/App.test.tsx`、`src/data/historical-player-catalog.test.ts`
- 后端模型与映射：`backend/src/main/java/com/basketballgm/player/PlayerPayload.java`、`PlayerResponse.java`、`PlayerMapper.java`
- 数据库迁移：`backend/src/main/resources/db/migration/V12__add_player_chinese_names.sql`、`backend/src/main/java/db/migration/V13__seed_historical_player_chinese_names.java`
- 后端测试：`backend/src/test/java/com/basketballgm/forum/ForumApiTest.java`、`backend/src/test/java/com/basketballgm/guest/GuestImportApiTest.java`、`backend/src/test/java/com/basketballgm/llm/LlmSimulationClientRequestBodyTest.java`、`backend/src/test/java/com/basketballgm/simulation/SimulationEngineTest.java`

## 修改中的文件

球员中文名称与身份字段保护功能处于已验证、未提交状态；具体文件见上一节。开始新任务前仍须先检查工作区状态，保留用户已有改动。

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

### 公共球员身份字段以目录为准

公共球员的名称、缩写、身高和体重用于识别目录条目，用户覆盖只保存可调节的属性。前端禁用相应输入项，`PlayerMapper` 读取公共目录的原始值组成覆盖记录并在查询时优先返回原始值，浏览器请求与旧覆盖记录都无法改变这些身份字段。自定义球员由用户创建，中文名保持可选。

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

### 表现分公式的权重与效率项

产量项覆盖用户要求的全部维度：得分、篮板、助攻、抢断、盖帽、上场时间。抢断与盖帽场均只有 0–2 个，权重放大到 2.0 才不会被得分淹没；上场时间 0.3 只作辅助因子。效率项 `2 × 命中 − 出手` 以出手数为乘数：命中率五成时等于命中数，高效多出手加分、低效多出手扣分；小样本高命中率因产量项占主导而无法获奖。

### 胜方加成幅度有限

胜方加成 3 分，约等于两次助攻的权重。胜方球员可以因此胜过数据接近的败方球员，败方巨星仍可凭数据获奖。

### 公式内部使用整数运算

表现分内部以十分之一分为单位做整数运算，返回时再除以 10。直接浮点累加会让两端同分在 `===` 下不成立，平票决胜链失效；整数在双精度浮点下精确，比较才可靠。

### 平票决胜链保证确定性

表现分相同依次比较得分、上场时间，再相同按球员 ID 字典序。任何战报都有唯一获奖者，测试与界面渲染结果可复现。

### 评选放在前端展示层

本地引擎战报与云端 AI 战报的统计结构相同。在前端展示层评选使两种来源复用同一公式，战报数据结构不变，后端无需改动。

### FMVP 名单显式写在生成脚本中

上游数据集没有 FMVP 表。参照 `nba75Names`、`allNba2026` 的既有模式，1978–2026 每年的 FMVP 以 `finalsMvpByYear` 显式列出，名字必须在生涯数据中解析成功、49 个赛季必须完整，否则生成中断。名单显式化让覆盖范围可审计，目录测试逐年断言。

### V9 迁移随目录再生成

`src/data/README.md` 把目录与 V9 定义为一对生成物，再生成时两者一起重写。已应用旧版 V9 的本地数据库删除 `flyway_schema_history` 中的 V9 行并以 `SPRING_FLYWAY_OUT_OF_ORDER=true` 启动一次即可重新应用；V9 是幂等 upsert，重新运行只新增新球员，不影响既有行与用户覆盖。全新数据库按序应用，不需要这些步骤。

### 审核放在数据库事务之外

腾讯云 CMS 是一次 HTTP 调用。放在事务内会让数据库连接被外部调用占住，云服务的延迟会直接拖垮写路径。`ForumController` 在调用写方法前完成审核；限频与链接判断是纯数据库计数，留在 `ForumService` 事务内，被拒绝的写入不会消耗额度。

### 本地词表先行，云端审核全量同步

明显的违规内容在本地直接拒绝，不消耗云端调用；其余内容全量同步过腾讯云 CMS，返回 `Block` 或 `Review` 都按拒绝处理。云服务失败或超时（3 秒）同样拒绝写入：社区写操作短暂不可用可以接受，未审内容上线不能接受。

### 命中词条不回显

审核失败的响应只含统一文案与错误码，不告诉用户命中了哪个词。回显词条等于把词库暴露给试探者。前端按 code 映射本地文案，也不拼后端原始 message；无 code 的错误（例如含自定义球员的 422）保持原有 message 展示，因为球员名单本来就是用户自己的数据。

### 发帖限频只计新建帖子

帖子列表按创建时间排序，更新已公开帖子不会改变排序，无法用于顶帖刷屏。限频只统计窗口内新建的帖子，用户修正阵容后更新公开内容不受额度影响。

### 管理员名单走配置而不是数据库角色

当前只有「删除任意帖子与评论」一个管理动作。用环境变量配置用户名即可覆盖，不值得为此引入角色表。`AdminRegistry` 统一判定，认证响应带 `admin` 字段让前端控制按钮显隐，服务端接口仍做最终鉴权。

### 社区总开关用条件装配摘掉整个控制器

个人 ICP 备案对社区功能敏感，被要求整改时响应必须是一次运维操作而不是一次开发任务。`ForumController` 标注 `@ConditionalOnProperty(name = "app.forum.enabled", havingValue = "true", matchIfMissing = true)`：开关关闭时控制器不进容器，8 个接口的映射全部消失返回 404，比在每个方法里加判断更难漏。`ForumService`、`ForumMapper`、`ModerationService` 不被其他模块引用，控制器消失后它们留在容器里不影响任何功能。数据表与数据不动，开关打开即恢复。前端不做功能标志下发：接口 404 时社区页沿用既有的加载失败提示。

### 安全链放行 ERROR 分发

未映射路径在真实容器里会经 `sendError` 触发 ERROR 分发到 `/error`；安全过滤链默认覆盖 ERROR 分发，`/error` 命中 `anyRequest().authenticated()`，未映射路径因此返回 401 而不是 404。MockMvc 不走真实 ERROR 分发，集成测试看不到这个差异，只有真实进程能复现。按 Spring 官方推荐加 `dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()` 后，`/error` 由 `BasicErrorController` 渲染出真实状态码。

### 阵容成员展示顺序收敛到一个函数

阵容编辑表与社区帖子成员表需要同一条规则：激活的首发按 C→PF→SF→SG→PG 站位顺序排在前五位，未激活的首发按替补对待，其余成员保持原相对顺序。规则抽成 `orderMembersForDisplay` 供两处复用，避免两处各写一份比较器日后分叉。排序只作用于渲染入参，成员的存储顺序（`slot_index` 与快照 jsonb 数组）不变。

### 页面状态以 URL hash 为准

此前视图是 `App.tsx` 的内存状态，刷新即回到球员库。改用 hash 路由后，刷新从 hash 恢复当前页面，浏览器前进/后退可用，社区帖子详情获得可分享的独立链接。项目没有路由库，`useHashRoute` 手写 hash 读写与 `hashchange` 监听即可覆盖需求，不值得为此引入 react-router。受限视图条件不满足时只回退渲染结果、不改写 URL，用户登录后前进/后退仍能回到原链接。

### LLM 请求参数按服务商档案适配

用户可以配置任意 OpenAI 兼容服务，而各服务商对调优参数的约束互相冲突：Kimi K2.6/K2.7/K3 固定 temperature 值，传入其他值直接 400；OpenAI 推理模型拒绝 max_tokens，要求 max_completion_tokens。公共请求体因此只保留所有服务都接受的 model、messages、max_tokens，temperature 不再显式传入，各模型使用自己的默认值。服务商差异收敛到 `LlmProviderProfiles` 注册表：按 baseUrl 的 host 匹配档案后定制请求，Kimi 档案对 kimi-k2.5/kimi-k2.6 关闭思考（思考链会与战报 JSON 争抢输出预算），OpenAI 档案改写 max_completion_tokens 并开启 JSON 模式，OpenRouter 档案压低推理输出，未识别 host 保持保守请求体不动。新增一家服务商只是加一条档案，请求管线不变。

### 球队总上场时间用最大余数法归一化

篮球比赛每队总上场时间恒为 `240 + 25 × 加时次数`（48 分钟 × 5 人，加时 5 分钟 × 5 人）。本地引擎此前的分钟按角色独立随机生成，总和不满足这个约束。现在先按角色生成原始分钟，再用最大余数法把比例分配为恰好 240 的整数分钟：取整后的小数余量按从大到小逐个补齐，平手按球员顺序，同一种子结果可复现。归一化先于出手、篮板等派生统计，保证战报内部数据一致。引擎 V1 没有加时战报，加时次数恒为 0，公式保留在函数参数里供未来加时支持直接传入。同一公式也写入 AI 模拟的 system 提示词，约束云端战报满足同样的总分钟数；响应校验层不对总分钟做硬校验，模型偶发偏离时战报照常展示、由用户重试解决，这是已确认的取舍，避免校验过严导致可用战报被误拒。

约束必须同时落在两个本地引擎实现上：登录用户的「本地引擎对战」由 `App.tsx` 调 `api.simulate` 走后端 `SimulationEngine.java`，只有游客走前端 `src/lib/simulator.ts`。两端算法保持逐行一致，同一种子在两端产出同一战报。

单人上限与球队总分钟在同一个归一化函数里完成：取整后先钳制到 `48 + 5 × 加时` 上限，余量只分配给未达到上限的球员（被钳制球员的余数份额为负，自然排在分配队尾），直到余量分完。五人阵容在 240 总分钟与 48 上限下每人恰好 48 分钟，与真实比赛一致；人数更多时余量流向低分钟球员。提示词侧同样写入 "No player may exceed 48 minutes plus 5 per overtime period."，校验层不做硬校验的取舍不变。

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

2026-09-18 最近一次完整验证：

- 前端：10 个测试文件、41 项测试全部通过（含 4 项社区错误码映射测试）。
- 生产构建：通过。
- Prettier：通过。
- 后端：34 项测试全部通过（真实 PostgreSQL，含 8 项内容治理集成测试与 4 项词表单元测试）。
- 端到端：以真实运行的后端验证 `/auth/me` 的 `admin` 字段、正常评论 201、一分钟内重复评论 429 `RATE_LIMITED`、命中词表 422 `CONTENT_REJECTED`（不回显词条）、新账号含链接评论与发帖 403 `LINK_RESTRICTED`。

2026-09-19 词表扩充后复验：`mvn package` 重新打包（34 项测试通过，词表共 237 行）并以 `java -jar` 重启后端；真实请求验证命中新增词条的评论返回 422 `CONTENT_REJECTED`，正常评论 201，验证产生的数据已清理。

2026-09-19 hash 路由完成后验证：

- 前端：10 个测试文件、47 项测试全部通过（新增 6 项 hash 路由测试）。
- 生产构建：通过。Prettier：通过。
- 真实浏览器（Vite dev server + 运行中的后端）：`#/lineups` 加载恢复与刷新停留、`#/community` 切换、浏览器后退返回阵容页、`#/community/<帖子id>` 直达帖子详情与刷新保持，均验证通过。

2026-09-19 包名重命名后验证：`mvn test` 34 项全部通过（真实 PostgreSQL），`npm run format:check` 通过。前端源码不引用 Java 包名，无需改动。

2026-09-20 LLM 请求参数适配后验证：`mvn test` 41 项全部通过（新增 7 项服务商档案测试与 1 项真实 HTTP 请求体测试），`npm run format:check` 通过；`mvn package` 重新打包并以 `java -jar` 重启后端，健康检查通过。

2026-09-20 球队总上场时间约束后验证：前端 49 项测试全部通过（新增 2 项总分钟归一化测试，种子 42 在归一化后恰为平局，总分一致性断言改用非平局种子 7 与基线 153:150），`npm run build` 与 `npm run format:check` 通过；后端 41 项测试全部通过（请求体测试新增提示词约束断言）；前后端服务均已重启，健康检查通过。

2026-09-20 后端引擎同步总分钟约束后验证：后端 41 项测试全部通过（`SimulationEngineTest` 基线由 101:112 更新为 150:153，与前端同种子结果一致，并新增两队总分钟各为 240 的断言），`npm run format:check` 通过；`mvn package` 重新打包，前后端服务均已重启并通过健康检查。

2026-09-20 单人上场时间上限后验证：前端 50 项测试全部通过（`simulator.test.ts` 新增单人不超过 48 分钟断言，种子 7 基线更新为 149:156），`npm run build` 与 `npm run format:check` 通过；后端 41 项测试全部通过（`SimulationEngineTest` 基线更新为 145:153 并新增单人上限断言，请求体测试新增提示词上限断言）；`mvn package` 重新打包，前后端服务均已重启并通过健康检查。

2026-09-20 社区总开关后验证：后端 42 项测试全部通过（新增 `ForumDisabledTest` 断言开关关闭时 8 个接口全部 404），`npm run format:check` 通过；真实进程实测：`FORUM_ENABLED=false` 启动后匿名 GET 帖子列表与详情均 404，默认配置重启后恢复 200；前后端服务以默认配置运行中。

2026-09-20 阵容成员展示顺序统一后验证：前端 52 项测试全部通过（新增 `member-display-order.test.ts` 2 项），`npm run build` 与 `npm run format:check` 通过；纯前端改动，Vite 热更新生效，无需重启服务。

2026-09-21 Session 收尾验证：前端 52 项测试全部通过，生产构建通过，Prettier 通过；后端 42 项测试全部通过（真实 PostgreSQL）。`main` 与 `develop` 及各自远端分支指向同一提交，工作区干净。

2026-09-22 Docker Compose 本机验证：`docker compose config --quiet` 与 `docker compose up --detach --build` 通过；`web`、`api`、`postgres` 均为 healthy；经 Nginx 的 `http://localhost:8088/api/v1/health` 返回 `{"status":"ok"}`；Flyway 迁移 1–13 全部成功。前端 58 项测试、`npm run build`、`npm run format:check` 与后端 43 项测试均通过。

2026-09-22 球员中文名称与身份字段保护验证：前端 58 项测试、`npm run build` 与 `npm run format:check` 通过；后端 43 项真实 PostgreSQL 测试通过，Flyway 已在测试库应用迁移 1–13。`ForumApiTest` 验证公共球员接口请求携带伪造英文名时，响应仍返回目录中的英文名与中文名；`GuestImportApiTest` 断言全部公共球员的数据库中文名称非空；测试库查询确认 V13 已执行且未命名公共球员数量为零。

## 下一步具体行动

1. 审阅并提交当前球员中文名称与身份字段保护功能。
2. 依照 `docs/deployment.md` 准备腾讯云轻量应用服务器环境、`.env`、防火墙、域名备案、HTTPS 证书与备份任务。
3. 新功能从 `develop` 分支继续开发和验证。
4. 合并或推送 `main` 前，遵守 `AGENTS.md`：完整运行全部测试并确保全部通过。

## 当前 Git 状态

- 当前开发分支为 `develop`。开始工作时运行 `git status --short --branch`、`git diff` 与 `git log -5 --oneline` 获取实时状态。
