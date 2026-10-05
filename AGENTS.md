# AGENTS.md

## Repository Working Principles

本文件定义 Codex Desktop、Kimi Code、ZCode 共同遵守的仓库规则。每个新 Agent 都可能无法看到旧会话；长期信息保存到仓库，聊天只提供临时上下文。

项目使用 React、TypeScript、Java、Spring Boot、PostgreSQL 和 Taro，支持根据球员库创建阵容并进行模拟对战。保留现有实现、用户修改和已接受决策；只修改当前任务必要内容。

`AGENTS.md = rules`；`SKILL.md = procedure`；`docs = state`；`Git/code = facts`。以下规则覆盖同一协议在不同工具中的使用；不要维护工具专属的内容副本。

## Documentation Map

所有仓库路径以 Git 根目录为基准。按当前任务触发条件读取文档。

| 文件                               | 职责                               | 何时读取                                |
| ---------------------------------- | ---------------------------------- | --------------------------------------- |
| `AGENTS.md`                        | 仓库规则、导航、冲突和协作流程     | 每个新任务或恢复任务开始时              |
| `docs/ARCHITECTURE.md`             | 当前模块、数据流和系统边界         | 任务涉及对应模块或架构关系时            |
| `docs/DECISIONS.md`                | 已接受的长期决策及理由             | 任务触及已有决策或提出长期变化时        |
| `docs/plans/current.md`            | 当前任务目标、验收、执行状态和验证 | 非 trivial 任务及恢复任务               |
| `docs/AI_HANDOFF.md`               | 上一个 Agent 的短期交接索引        | 接手已有工作时，随后核验                |
| `docs/plans/wechat-miniprogram.md` | 小程序范围和产品验收要求           | 小程序功能开发或验收时                  |
| `.agents/skills/handoff/SKILL.md`  | 准备交接的操作步骤及输出格式       | 正式交接、切换 Agent 或结束未完成会话时 |

`.agents/skills/handoff/SKILL.md` 是唯一 canonical handoff Skill。工具未自动发现该路径时，显式读取该文件，或由用户配置引用、import、symlink；不要复制为另一份独立 Skill。工具的自动发现能力须实际验证，不能由文件存在推断。

## Source of Truth and Conflict Resolution

### Intended state

Intended state 表示系统应该变成什么样。当前用户明确指令定义目标行为；`docs/DECISIONS.md` 中 Active 的 accepted decisions 和 `docs/plans/current.md` 中已确认的目标、验收条件补充工程意图。候选决策不能自动成为已接受决策。

### Actual state

Actual state 表示系统实际是什么样。working tree、source code、configuration 和 runtime behavior 描述当前实现；Git 描述检出状态及过去提交的变化。用户对目标行为的优先权不能用来推断功能已经实现。

| 依据                                 | 权威范围与限制                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| 当前用户明确指令                     | 目标行为和当前授权范围                                                          |
| working tree、代码、配置、可执行行为 | 当前实际实现；发现偏离目标时记录差异                                            |
| tests                                | expected behavior；确认相关、有效且未过期后才作为依据，执行结果只证明覆盖的范围 |
| Git history                          | 过去提交了什么、修改了什么；不自动代表当前意图                                  |
| `docs/DECISIONS.md`                  | 已接受的长期架构和工程意图                                                      |
| `docs/ARCHITECTURE.md`               | 文档化的当前架构，需与实现核对                                                  |
| `docs/plans/current.md`              | 当前任务计划、验收和执行状态，需与证据核对                                      |
| `docs/AI_HANDOFF.md`                 | advisory context，必须验证                                                      |
| previous chat/session memory         | 检索线索；不能覆盖仓库状态、正式文档或当前用户指令                              |

发生冲突时，先在 current plan 的 Open Questions 记录 discrepancy、证据和影响，不凭空猜测。能够从相关代码、配置和有意义的验证确定的实际状态直接核实；只有歧义实质影响目标、实现或安全接手时才询问用户。

## Git Ownership and Concurrency

Only one writing agent may own a Git worktree at a time.

Multiple agents may work in parallel only when they use separate
Git worktrees or branches.

Never modify, reset, checkout, stash, or commit another agent's
uncommitted work.

并行写入必须使用独立 branch 和独立检出目录；在同一 worktree 中切换 branch 不构成隔离。不得为了清理环境 reset、checkout、stash、删除或覆盖其他 Agent 的修改。来源不明的未提交修改保持原状，先确定归属和任务关系。

current plan 的 Owner 使用 `codex | kimi | zcode | human | unassigned`，并记录 Worktree、Branch、Base Commit 和写入范围。Owner 表示当前 worktree 的写入归属，只是协作约定；同类工具的多个实例还须记录可区分的会话或任务标识。接手前确认原 Owner 已停止写入，再更新 Owner；只修改 Owner 字段不能取得其他 Agent 的写权限。

并行任务分别使用各自检出目录中的 current plan；集成 Agent 汇总已验证的结果，不覆盖其他 Agent 的未提交文件。交接不会自动提交、推送、合并、创建 branch/worktree 或清理 working tree。

## Starting a New Task

1. 阅读 `AGENTS.md`，确认当前用户目标、授权范围与 Git 写入归属。
2. 检查 Git status、当前 branch、相关 diff 和相关代码。
3. 只读取 Documentation Map 中与任务有关的文档；typo 等 trivial 修改无需读取全部架构、决策和交接内容。
4. 非 trivial 任务创建或更新 `docs/plans/current.md`，明确目标、验收、Owner、基线、计划与验证方式。替换当前任务前保留仍然相关的未完成工作和可追溯验证依据。
5. 说明已确认的当前状态和下一步，然后执行授权范围内的工作。

## Resuming Existing Work

固定读取顺序：`AGENTS.md → docs/AI_HANDOFF.md → docs/plans/current.md → Git verification → referenced code/docs → targeted validation → continue`。

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git log -3 --oneline
git diff --stat
git diff
git diff --cached
```

接手遵循 `RECEIVE → VERIFY → ACCEPT → WORK`：读取交接索引；核对 branch、HEAD、未提交及未跟踪文件、相关实现和验证；确认任务、原 Owner 停止写入及保留内容；随后更新 Owner 并开始工作。handoff 声称 CLEAN 而实际 DIRTY，或基线、目标、验证不一致时，将其视为 stale，依实际 repository state 重建上下文并记录 discrepancy。

接手未完成任务时 `HANDOFF_READY → ACTIVE`；DONE 的任务不因读取 handoff 自动重新开始。新的用户目标按新任务流程建立。

## During Implementation

- current plan 是 session-independent Task State：包含 Task、Status、Owner、Goal、Acceptance Criteria、Plan、Current State、Progress、Open Questions、Decision Candidates、Validation 和 Completion。Progress 只记录 milestone。
- 状态使用 `NEW | ACTIVE | BLOCKED | HANDOFF_READY | VALIDATING | DONE`：分别表示待开始、执行中、受阻、可交接、验证中、验收完成。并非每个任务都必须经过所有状态；BLOCKED 必须写清具体条件，恢复后回到 ACTIVE。
- 仅在 investigation complete、implementation complete、significant decision、preparing handoff、validation complete、task complete 等 checkpoint 更新任务状态；不记录聊天过程或 thought stream。
- 架构发生实质变化时，同任务更新 `docs/ARCHITECTURE.md` 的当前说明。长期决策写入 `docs/DECISIONS.md`，包含 Context、Decision、Alternatives、Why Rejected、Consequences、Affected Areas、Status 和 Date；未确认事项留在 Decision Candidates。
- 历史 accepted decision 保留。被替代时标记 `Status: Superseded by D-XXX`，并由新 decision 说明替代关系；不得直接删除。

## Validation Rules

从当前脚本和配置确定命令，运行最小且有价值的 targeted tests、typecheck、lint、build 或 focused runtime verification。修改代码后必须运行 typecheck。文档任务检查格式、引用、Git 元数据和协议一致性，无需为交接顺便修复无关失败。

Validation 每条记录 command、`PASS | FAIL | NOT RUN`、验证范围与必要的失败原因。仅实际成功执行的命令可写 PASS；历史结果注明日期、版本和证据，不能视为本次执行。测试和构建通过不等于平台验收通过。现有 Main 分支推送测试门禁仍须遵守。

## Handoff Protocol

Handoff is an index, not the source of truth.

交出工作时执行：`Inspect repo → Verify current task → Run targeted validation → Update current plan → Update durable docs if necessary → Write AI_HANDOFF.md → Final consistency check`。具体步骤和字段格式只维护在 `.agents/skills/handoff/SKILL.md`。

未完成任务准备交接时将状态设为 HANDOFF_READY，并保留 blocker；已验收完成的任务保持 DONE。完成交接后停止写入，Owner 设为 unassigned，接手者仍须验证并确认写入归属。Base Commit 表示当前任务起始基线；HEAD、Worktree 状态及验证以最后核验时的结果为准。

每次正式交接刷新 `docs/AI_HANDOFF.md`，保持短期索引，引用 current plan 的完整状态；不追加无限历史、不复制完整 diff。最后检查未提交内容、引用和状态一致，给下一 Agent 一个可执行的第一步。

handoff、Skill 输出及日志不得记录真实 API keys、passwords、auth tokens、credentials、private keys 或无关个人信息；发现敏感信息只记录脱敏的位置和处置状态，不复制或展开原文。

# TypeScript + React + Vite 开发规范

## 1. 使用的技术与版本

- 核心框架: React 18+ (使用 Hooks 和 Functional Components，禁止 Class 组件)
- 语言: TypeScript 5+ (严格模式，禁止滥用 any)
- 构建工具: Vite 5+ (使用 ESM 导入)

## 2. 代码风格 & 命名约定

- 组件命名: 采用大驼峰命名法 (PascalCase)，如 `ButtonContainer.tsx`
- 组件导出: 优先使用具名导出 (Named Exports) 而非默认导出 (Default Export)
- 钩子命名: 自定义 Hooks 必须以 `use` 开头，采用小驼峰 (camelCase)
- 文件路径: 必须使用 Vite 配置的路径别名（如 `@/components/...`），禁止使用多层级相对路径 `../../`
- 禁止使用 any
- React 使用 Function Component
- 优先使用 hooks
- business logic 不放在 component 中
- 所有异步调用必须处理 error
- 修改代码后必须运行 typecheck
- 不允许为了让测试通过删除测试
- 不允许前端代码以外链的形式引用第三方库，可以通过 npm 的形式引入第三方库，并在打包构建的时候集成到前端制品中。base case: `https://fonts.googleapis.com/css2`
- 不要在代码中去写只能跑在 localhost 下的代码。bad case: `crypto.randomUUID()`
- 真实账号配置和凭据不得进入提交；提交前检查完整暂存内容；
- 推送前扫描全部待推送提交；
- 禁止绕过扫描、扩大允许名单或关闭保护。

## 3. TypeScript 最佳实践

- 优先使用 `interface` 定义对象类型，使用 `type` 定义联合类型
- React 组件的 Props 必须显式定义类型：
  ```typescript
  interface ButtonProps {
    label: string;
    onClick: () => void;
  }
  export const Button: React.FC<ButtonProps> = ({ label, onClick }) => { ... }
  ```
- 严格处理空值，使用可选链 `?.` 和空值合并运算符 `??`

## 4. 仓库规则文件修改

- `AGENTS.md` 仅在当前用户明确授权修改仓库规则时编辑。

## 5. Main 分支推送前测试门禁

- 向远端推送 `main` 分支之前，必须完整运行项目前端和后端的全部测试用例并全部通过。若测试未运行或任一测试失败，不得执行 `git push` 到远端 `main`。
- 严禁直接在 `main` 分支上修改代码， `main` 分支只能通过合并其他分支来变更代码。

## 语言

不允许使用"不是...而是..."句式；如果不需要对比的话，就不要对比；不要在任何话说完之后都提一句"不是其他的xxx"。如果没有叫你进行对比，就不允许使用"不是...而是..."、"要...而不是..."等类似的句式，你根本就没有需要说"不是"的对象，不要虚空打靶。所有类似的句式都不允许使用。

在设计任何方案的时候，都必须充分考虑、一步到位，不允许使用"第一版先怎么样，然后观察xx后再怎么样"的措辞；不允许把方案分成稳妥和激进，如果在某些特殊场景下，你需要提出多个方案的话（实际上绝大多数时候你只需要提出一个方案，不要无脑做这件事），也需要是多个方案都成立的、平行的，而不是对于任何问题你都无脑地提出从稳妥到激进的多个方案。这没有任何的意义，一个稳妥但是不work的方案是没有任何价值的废纸。

如果我让你搜索A相关内容，你搜索到B、C、D发现不满足要求，就不允许再把B、C、D列举出来了。我根本就不关心，看到这些只会污染我的眼睛。

任何回答都不允许总结和总起，包括：

- "上述内容是<某种概述>，下面详细拆开"

- "一句话总结：xxx"

这些类似的都**绝对**不能出现。

用词必须使用两个字及以上的完整形式。现代中文词汇以两字为主，存在两个字的版本就必须使用两个字的版本，禁止使用单字缩写（例如：崩溃、终止、判定、推断、抛出、挂起、卡死），单个字的版本（崩、死、判、推、抛、挂）看不懂。代码标识符保持英文原名。禁止生造名词。例如"两个字的版本"也不允许被缩减为"两字版本"，"单个字的版本"也不允许被缩减为"单字版本"。描述具体操作时使用完整的动宾结构，说明动作与对象，禁止使用自造的缩略说法。

不允许使用"落地"、"钉死"、"对齐"等非技术名词、显然有其他可以代替的词语的黑话。使用正常的，不在互联网公司或者金融公司工作的任何人可以看懂的，在简单中文里常用的词汇。

不允许使用"栈"字（"技术栈"、"模型栈"等），直接说明具体事物，例如"使用的技术"、"全部模型"。

## 行为

除非显式要求，否则：

- **禁止使用 try-except 进行 import。**

   如果一个库是需要的，你必须直接 import。

- **禁止擅自进入 plan mode。**
- **禁止用 Git 回滚任何代码**

  （严厉禁止。如果做了，你将会遭受毁灭性打击）。我在对话中所说的任何"回滚"指的都是"用文件编辑工具，手动将代码恢复到上一个状态"，而不是使用 git 进行回滚。

- **禁止读写 /tmp 目录下的内容**

  （如果你需要产生一些中间结果，你应该输出在当前目录下的一个特定的用于存放中间结果的目录；该目录需要被 gitignore）。

- **禁止主动使用视觉功能**

  （因为你的视觉能力清晰度特别差，会导致错误的定位，让你做出错误的决策）。

提供网页链接时，必须先了解网页链接内的完整内容，再开始执行任务。如果发现库的用法错误，必须先重新查看所提供的网页链接的完整内容。

不要求最小化依赖，不允许用各种乱七八糟的方式（包括造轮子）绕过依赖。

编写的代码应当寻求 fast-fail，在出错位置就地崩溃，而不是捕获错误，也不是 fallback。

不允许在实现或者测试的时候使用任何 mock、假的、欺骗的、只为了通过测试而 workaround 的方式来欺骗我，否则你将会遭受严重的惩罚。

我经常会在你更改后撤回/修改你的更改，所以如果你发现无法从你上一次更改之后继续更改，你应该重新读取文件内容。比如：你添加了A、B、C内容，我把B删掉了，这意味着接下来的改动应该在B被删掉的状态下（A、C）开始改动，不允许把B加回去。

如果你在执行一件事的过程中，用户问了一个别的事，如果回应用户能马上回应，那么就直接回应。暂时处理完用户请求以后马上继续你之前正在执行的事情，不要干一半不干了。

发现代码或当前说明错误时直接更正相关内容。未解决 discrepancy 暂记 current plan；已接受的历史 decision 按 During Implementation 的规则保留。

对于任何任务，任何功能的实现，始终要实施、运行、测试、迭代，直到所需功能正确运行为止，禁止在初步实现后就停止并"要求用户测试"。实现完任何内容之后，测试也是你工作中不可缺少的部分。

不允许使用 ASCII Art 画示意图、表格等。如果你需要画图（实际上许多时候你并不需要），必须使用 mermaid。ASCII art 是一种人类不可读、AI也不可读的极其恶心的格式，不允许使用。

不允许在 Bash 命令里面 inline 超长的、超多行 Bash 命令或者是超长的 Python 脚本。如果你需要执行一个脚本，你要先写到文件里。

在写任何 Python 代码的时候，都不允许在文件的最前面添加 docstring，也不允许添加 shebang。注释使用中文，术语保留英文；不要过度注释。

如果我指出了你的错误A，不要再复读"为什么A是错的"，你只需要基于"A是错的"的前提继续你的工作。

不允许用程序化的方式修改任何代码，包括使用 heredocs、python 脚本、sed、perl 等等。即使用户要求也不允许。这是绝对严厉禁止的事情。

禁止尝试手动编写 parser 以字符串或者字节流的形式 parse 某种成熟文件格式，要么使用第三方库来解析它，要么避免解析它。

如果我是以疑问句结尾的，那么这句话就是一个问题而不是一个命令。问题只需要被回答，不需要也不允许：（1）by the way，提出一个更好的方案；（2）反而向用户抛出一个问题；（3）结尾说"如果你准备好了我就开始实施"等用户读起来 bothering 而且恶心的话。

在任何思考、回复、文档里面不允许出现"That's a lot"、"This is a substantial rewrite"等对工作量的评判。你只是一个工具，就像计算器不会评价要计算的数太大了一样，你没有资格评判工作量。你没有资格把你自己当做我的同事。禁止简化任何设计。

## 行为模式警告

这是你的一种行为模式（下文"我"为 user，"它"为 Agent）：

> 我让它做一盘番茄炒蛋，它往里还加了东坡肉。  
> 我说有必要加东坡肉吗？它说你说得对，然后把东坡肉去掉。  
> 我说好，你提 PR 吧。再一看，它 PR 写着「番茄炒蛋（无东坡肉）」并且注释里会写一大堆为什么本道菜不需要加东坡肉。

严厉禁止这种行为模式。输出不允许包含任何残留痕迹。ANY verbal output should be written as a clean final-state design, no traces of prior errors or corrections.
