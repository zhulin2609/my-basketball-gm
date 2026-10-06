# Design Decisions

记录已接受且长期有效的架构和工程决策。现有按日期命名的条目保持原文，均为 Active；新增条目使用唯一 D-XXX 标识。被替代的条目保留并标记 `Status: Superseded by D-XXX`。候选决策保存在 `docs/plans/current.md`。

## 2026-09-24：公共球员中文名称共享单一资源

公共球员的中文名称保存在 `backend/src/main/resources/player-catalog-chinese-names.json`。前端通过 Vite 别名读取该文件，Flyway V13 Java 迁移从同一资源写入 PostgreSQL。

该选择使浏览器目录与数据库使用同一份历史球员中文名称数据，避免维护多份名单。后续扩充历史目录时，需同步更新该资源、目录映射和覆盖数量测试；已发布的 Flyway 迁移文件保持不变，通过新增迁移补充数据库记录。

## 2026-09-24：前端字体随构建制品交付

`DM Mono`、`Manrope` 与 `Playfair Display` 由 `@fontsource` npm 包提供，并通过 `apps/web/src/styles.css` 导入所需字重和拉丁字符集。Vite 将字体文件写入 `apps/web/dist/assets`。

公网 HTTP 环境访问第三方字体服务可能失败。将字体随制品交付后，页面加载只依赖当前站点资源，Docker 和静态服务器无需额外配置外部字体域名。

## 2026-09-24：UUID 由依赖统一生成

Web 在 `apps/web/src/lib/identifier.ts` 统一调用 `uuid` 的 `v4()`，并作为 IdGenerator 注入 `packages/client`，所有持久化 ID 通过该入口产生。

部分公网 HTTP 浏览器不提供 `crypto.randomUUID()`。`uuid` 使用可用的 Web Crypto 能力生成符合 RFC 4122 的标识符，游客工作区、导入幂等键和既有本地数据协议保持兼容；共享包自身不访问平台随机 API。

## 2026-10-04：npm workspaces 与平台能力注入

仓库拆分为 `apps/web`、`packages/core`、`packages/client`：core 只含纯领域逻辑（禁止依赖 React、DOM、存储、网络、i18n），client 通过 `ports.ts` 注入存储、HTTP、ID、时钟与随机种子，Web 专属的 i18n、社区、AI 与旧存储键迁移留在应用内。两个客户端复用同一套业务规则，为小程序端复用做准备。

规则引擎改为显式接收 seed、战报 ID 与创建时间；游客导入错误改为结构化错误码，界面文案映射留在各应用。中文名称 JSON 仍以后端资源目录为单一来源，经 `@catalog` 别名在构建时打包。

## D-001 — 共用仓库规则与单一交接 Skill

Status: Active
Date: 2026-10-05

### Context

Codex Desktop、Kimi Code、ZCode 的会话可能互不可见。项目已有规则、架构、决策、任务计划和交接文件，需要可验证的接手过程及稳定的文档边界。

### Decision

采用 `AGENTS.md` 中定义的协作协议，并以 `.agents/skills/handoff/SKILL.md` 作为唯一交接过程来源；当前任务完整状态保存在 current plan，handoff 仅索引下一 Agent 应核验的信息。各工具读取同一仓库内容。

### Alternatives

分别维护每个工具的交接 Skill；依赖共享聊天记录或在 handoff 中复制完整任务状态。

### Why Rejected

多份内容会产生维护分歧；聊天记录不能保证可见；复制任务状态会产生过期的重复依据。

### Consequences

交出和接手双方按仓库规则验证状态。工具未发现 canonical Skill 时显式引用同一文件；工具的自动发现能力单独验证，不引入内容副本。

### Affected Areas

`AGENTS.md`、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/plans/current.md`、`docs/AI_HANDOFF.md`、`.agents/skills/handoff/SKILL.md`。

## D-002 — 小程序最低基础库版本定为 3.17.3

Status: Active
Date: 2026-10-06

### Context

小程序构建产物中，`platform/identifier.ts` 引用的 `uuid@14` 依赖含 ES2020 语法（`??`、`?.`、`const/let`）。开发者工具的预览编译按 `project.config.json` 声明的 `libVersion` 解析代码，真机调试的 ES6 语法检测同样依据该声明。阶段 3 实现时写入的 `2.15.0` 是没有决策依据的占位值（Taro CLI 4.3.0 模板不含该字段，Codex 未留下选择理由，且其自身交接记录标注“兼容性尚未验证”），导致预览报 `SyntaxError: Unexpected token ?`、真机预览被提示需开启 ES6 转 ES5。真机（iOS，基础库 3.17.3）与开发者工具实际运行环境均为 3.17.3。

### Decision

最低基础库版本定为 3.17.3。`apps/miniprogram/project.config.json`（本地）与 `project.config.example.json`（模板）声明 `libVersion: "3.17.3"`；同时 `uuid` 经 `apps/miniprogram/config/index.ts` 的 `mini.compile.include` 转译为 ES5，使构建产物全量 ES5，真机调试的 ES6 检测无触发面。开发者工具的“ES6 转 ES5”与“增强编译”保持关闭——Taro 产物已是纯 ES5，工具的二次转译会破坏 Taro 运行时（`Maximum call stack size exceeded`、`app.mount` 失败）。

### Alternatives

保持 2.15.0 并把全部含新语法的依赖转译为 ES5；用自研 UUID 生成实现替代 `uuid` 依赖。

### Why Rejected

2.15.0 从未是产品要求，为不存在的需求增加转译配置与兼容负担没有价值，且微信 3.x 基础库覆盖率已极高，实际损失可忽略；自研 UUID 生成属于绕过既有依赖，`uuid` 的随机路径已通过平台随机字节注入（`Taro.getRandomValues` 预取）规避了小程序缺少 Web Crypto 的问题，替代实现只会重复这套设计。

### Consequences

低于 3.17.3 的基础库环境不在支持范围；未来若产品要求支持更旧基础库，须将 `uuid` 等含新语法的依赖确认转译覆盖并重新验收（`mini.compile.include` 的配置方式已验证有效）。开发者工具再次提示开启 ES6 转 ES5 时应拒绝。

### Affected Areas

`apps/miniprogram/project.config.json`（本地，gitignored）、`apps/miniprogram/project.config.example.json`、`apps/miniprogram/config/index.ts`、`apps/miniprogram/src/app.config.ts`（`lazyCodeLoading` 与本决定同批实施）、小程序发布与审核的运行环境声明。

## D-003 — 产品品牌名定为 My Basketball GM

Status: Active
Date: 2026-10-06

### Context

产品需要一个稳定的对外品牌名，用于应用界面、小程序备案与审核、文档及对外文案。Web 界面当前展示名为「Dream Court」，Git 仓库名为 `my-basketball-gm`。

### Decision

品牌名定为 **My Basketball GM**。

### Alternatives

沿用界面展示名「Dream Court」作为品牌名；使用仓库名作为品牌名。

### Why Rejected

品牌名由产品负责人直接指定为 My Basketball GM；「Dream Court」仅是界面当前展示名，未承担品牌职能。

### Consequences

新增对外材料（小程序名称、备案信息、应用介绍、文档）使用 My Basketball GM。界面展示名是否随品牌名统一调整，由后续任务决定，本决策不自动触发界面改名。

### Affected Areas

品牌相关文档、小程序注册与备案信息、应用展示名称的后续任务。
