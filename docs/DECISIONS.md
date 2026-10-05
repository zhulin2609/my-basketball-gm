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
