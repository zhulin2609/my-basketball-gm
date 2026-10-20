# Design Decisions

记录已接受且长期有效的架构和工程决策。现有按日期命名的条目保持原文，均为 Active；新增条目使用唯一 D-XXX 标识。被替代的条目保留并标记 `Status: Superseded by D-XXX`。候选决策保存在 `docs/plans/current.md`。

## D-008 — 备案页脚与社区默认关闭

Status: Active
Date: 2026-10-20

### Context

link9.fun 的网站备案号为沪ICP备2026051556号-1。用户批准添加公共页脚备案链接，并暂时关闭 Web 社区及后端接口，保留个人阵容和对战。

### Decision

全部 Web 视图显示备案原文并链接至 https://beian.miit.gov.cn/。社区默认关闭；Compose 使用 `FORUM_ENABLED` 同时提供前端构建开关和后端运行开关。前端隐藏导航与阵容社区区域，社区地址替换为球员库；后端不注册社区控制器。已有社区数据保留。恢复开放须确认主体、服务范围和所需手续，并由用户明确批准。

### Alternatives

只隐藏页面入口；删除社区实现和数据库记录；前后端在 Compose 中使用独立的人工配置。

### Why Rejected

只隐藏入口仍允许旧页面和直接接口请求访问；删除会损失数据并增加恢复成本；分别维护配置容易产生前后端状态不一致。

### Consequences

开关变化需要重新构建 Web 并重新创建后端容器。已有环境中的 true 必须显式改为 false；模板默认值不会覆盖环境配置。保留开启模式的回归测试，新增默认关闭的真实 HTTP 与 PostgreSQL 验证。备案号变更需要修改公共页脚。

### Affected Areas

Web App、hash 路由、公共页脚、社区配置、ForumController、Compose、Dockerfile、环境模板、部署文档和相关测试。

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

## D-004 — 小程序球员详情页专注资料展示

Status: Active
Date: 2026-10-13

### Context

小程序提供球员资料浏览和阵容编辑两个流程。阵容编辑页已有“添加球员”入口，可以在明确目标阵容后进入球员选择页。用户要求球员详情页移除“选择阵容”按钮，并将这项决定长期记录。

### Decision

小程序球员详情页展示球员资料、简介和能力值，不提供“选择阵容”按钮。添加阵容成员的入口保留在“阵容 → 编辑阵容 → 添加球员 → 选择球员”流程中。

### Alternatives

在球员详情页保留“选择阵容”入口，从当前球员开始选择目标阵容。

### Why Rejected

用户已明确选择移除该入口。现有阵容编辑流程已经覆盖添加成员的需求，并在选择球员前确定目标阵容；集中使用该流程可保持入口与编辑上下文一致。

### Consequences

用户浏览球员资料后，需要进入阵容编辑流程添加成员。球员资料展示、详情返回、阵容草稿与正式保存规则继续沿用现有行为。后续调整详情页时应遵守本决策；重新引入阵容选择入口需要新的产品决定。

### Affected Areas

`apps/miniprogram/src/pages/player-detail/index.tsx`，小程序球员浏览与阵容成员添加流程。

## D-005 — 阶段 4 微信免密码账号与跨客户端访问

Status: Active
Date: 2026-10-13

### Context

用户确认阶段 4 使用小程序微信免密码注册登录和 Web 小程序扫码确认登录，并保留已有用户名密码登录。新微信账号需访问同一份跨客户端业务数据；微信昵称可减少用户名输入，但不能作为身份或账号合并依据。用户同时确认身份绑定数量、游客导入冲突处理和历史 AI 战报展示范围。

### Decision

- `users.id` 保持业务数据的唯一归属。新微信账号确认唯一用户名后原子创建账号与身份绑定，密码保持未设置；已有账号通过用户名密码认证绑定微信。
- Web 通过小程序扫码及用户主动确认访问同一账号；登录票据短期、单次使用且绑定发起浏览器。既有用户名密码登录保留。
- 微信昵称仅用于用户主动快捷填写用户名；不新增独立昵称功能或头像使用。两端统一允许 3–32 个 Unicode code point 的中文汉字、英文字母、数字、下划线和连字符，拒绝 emoji 和空格；英文字母大小写视为同名，保留名规则继续有效。候选值不符合规则或重名时提示用户修改，不自动转换或追加后缀。
- 每个 `(provider, appid, openid)` 只能属于一个用户，每个 `(user_id, provider, appid)` 最多绑定一个微信身份。重复同一绑定幂等成功；冲突拒绝，阶段 4 不提供解绑、换绑或账号合并。
- Web 与小程序首次游客导入为每套阵容分配新 client key，在事务中重映射战报和自定义球员引用，保留已有账号数据及历史快照。同一工作区同一账号的重试复用成功结果，跨账号导入拒绝；失败和跳过不清空本地数据。
- 小程序允许查看本人有效规则及 AI 历史战报，并标示类型；读取已有统计与快照不调用模型。小程序只发起规则对战，服务器保留期限和所有权校验继续有效。

### Alternatives

创建微信账号时要求设置用户名密码；新增独立昵称及头像功能；导入时沿用游客 client key 更新目标账号阵容；小程序历史列表仅显示规则战报。

### Why Rejected

用户明确选择免密码创建账号及扫码确认登录，且当前产品不需要独立昵称和头像。复用游客阵容键可能覆盖已有账号数据；限制历史类型会让同一账号在两端看到不同范围的有效战报。

### Consequences

阶段 4 实施需要新增身份与扫码登录能力、同步两端及后端用户名校验、使用新增 Flyway 迁移调整约束，并回归既有 Web 密码登录与游客导入。数据库已有 `display_name`，本决策不增加独立昵称字段。方案已接受，业务实现和真实微信验收尚未完成；详细流程和验收条件维护于产品文档，阶段 3 未完成验收继续保留。

### Affected Areas

`docs/plans/wechat-miniprogram.md`，后续两端认证与用户名表单、后端认证及用户约束、微信身份与扫码登录、游客导入及历史战报读取。本轮仅更新文档。

## D-006 — 集成测试允许以本地契约服务器扮演外部上游

Status: Active
Date: 2026-10-14

### Context

阶段 4 的微信认证与扫码票据测试需要调用微信接口。第一轮与第三轮审查曾将「本地测试服务器返回预设的微信响应」列为与仓库禁止 mock 规则冲突的问题（I016）。仓库规则禁止以 mock 伪造本系统的实现与结果；外部平台上游在测试环境中无法真实调用（凭据、配额与网络条件限制）。

### Decision

用户于 2026-10-14 明确接受：集成测试以真实 HTTP 传输与真实 PostgreSQL 验证本系统行为，外部平台上游（当前为微信 `jscode2session`、`getwxacodeunlimit` 等）允许由本地契约服务器扮演，前提是不伪造本系统的处理结果，且真实平台验收单独执行并如实记录。被测系统的传输、数据库、业务逻辑与断言都必须真实。

### Alternatives

删除或跳过涉及外部上游的测试；仅凭真实平台验收覆盖。

### Why Rejected

删除会丢失认证、票据与并发事务的回归保护；真实平台验收依赖凭据与设备条件，不能作为每次提交的回归门禁。

### Consequences

涉及外部上游的测试保留并继续运行；测试文件如实注明替代边界。真实微信平台验收保持独立记录，不得以集成测试通过冒充平台验收。

### Affected Areas

`backend/src/test/java`（微信与票据相关测试）、`apps/miniprogram/src/services/account-store.test.ts`、`packages/client/src/api-wechat.test.ts`、`apps/web/src/scan-login.test.tsx`、验收记录。

## D-007 — 用户名长度下限调整为 2 个字符

Status: Active
Date: 2026-10-15

### Context

D-005 确定的用户名规则为 3–32 个字符。3 字下限沿袭自 ASCII 时代的英文社区惯例；中文姓名两字形态非常常见（张三、李四），用户验收 M03 时确认该下限与中文使用习惯冲突。唯一性、保留名与字符集约束已经承担了真正的约束作用，长度下限在当前产品没有公共命名空间压力。

### Decision

用户名规则调整为 2–32 个字符，字符集不变（汉字 U+4E00–U+9FFF、英文字母、数字、下划线、连字符）。用户于 2026-10-15 明确要求执行该调整。此决定替代 D-005 中用户名长度下限的部分，D-005 的其余内容继续有效。

### Alternatives

保持 3 字下限；放宽到 1 字。

### Why Rejected

3 字下限强迫两字中文名加字凑数；1 字可区分性太差且重名体验差。

### Consequences

`packages/core/src/username.ts`、后端 `UsernameRules`、数据库约束（V16 迁移）与两端表单提示统一为 2–32；边界测试覆盖 2 字合法与 1 字非法。若未来出现公开 @提及或用户主页地址，短名字稀缺性需作为独立产品决策重新评估。

### Affected Areas

`packages/core/src/username.ts`、`backend/src/main/java/com/basketballgm/auth/UsernameRules.java`、`backend/src/main/resources/db/migration/V16__username_min_length_two.sql`、Web 与小程序用户名输入及提示、相关测试。
