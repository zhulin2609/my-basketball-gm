# 微信登录阶段 4 审查问题清单

## 当前任务

- Task：`wechat-login-stage4`。
- 当前版本审查结论：`CHANGES_REQUIRED`；第五轮最后一次定向复核完成，VERIFIED 16、OPEN 4，无新增问题。
- Reviewed Commit：`N/A`；HEAD / 本轮比较基线：`024f7f4c472b0845928a144abd086d8cffd0bbd0`；Snapshot ID：`wechat-stage4-round05-20261014`，输入与摘要保存在 `.cache/code-review-round05/input/` 和 `snapshot.json`。
- 汇总负责人：Codex，`codex-stage4-round05-20261014`；用户确认 Kimi 已停止写入，可由 Codex 接管。
- 报告列表：[第一轮 Codex 历史报告](round-01-codex.md)、[第二轮 Kimi 核验与修复报告](round-02-kimi.md)、[第三轮 Codex 复核报告](round-03-codex.md)、[第四轮 Kimi 核验与修复报告](round-04-kimi.md)、[第五轮 Codex 最终定向复核](round-05-codex.md)。
- 当前入口：[REVIEW_FEEDBACK.md](../../REVIEW_FEEDBACK.md)。
- 后续处置：按用户要求结束本轮，不自动开展下一轮。剩余 I004、I007、I016、I017 保持 OPEN，未获风险接受或延期批准；真实微信及设备验收仍独立保留。

## 历史报告导入说明

原文件 `docs/REVIEW_FEEDBACK.md` 已完整保存在 `round-01-codex.md`。归档保留全部原文、R01–R17 编号、严重度、位置、证据、验证结果和验收结论；本次没有重新审查代码或调整历史发现。

- 原报告 SHA-256：`0d6573dd801e6cc6c3d653fc4dbbc3affa11f0b3e695a1e569356b992c1c4364`。此摘要识别报告文件内容。
- 历史审查日期：2026-10-13；原报告未记录具体时刻和时区。
- 历史审查者：Codex；实施者：Kimi Code，依据当前迁移会话的已确认背景。原报告未记录双方会话标识及完整上下文来源，独立性细节不补写。
- 历史分支：`mini-app-20261004`；历史工作区：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit、历史 HEAD：`b87d67f2eaba02f1db31abec822bda3c9f15e3bd`。
- 历史 Reviewed Commit：`N/A`；原审查包含未提交和未跟踪文件，原报告称暂存区为空。
- 历史 Snapshot ID、完整输入清单、文件摘要及起止核对：原报告未记录，无法仅凭该报告恢复；本次没有重建历史代码快照。
- 历史范围：相对基线的完整 diff 及未跟踪实现与测试，重点为 `backend/`、`packages/`、`apps/`；原报告未逐项核验 `阶段4验收用例.xlsx`。
- 历史需求来源：`docs/plans/wechat-miniprogram.md` 第 4.3、5、11 节、D-005、仓库规则、当前计划和相关架构章节；原报告未固定这些文件的精确内容版本。
- 迁移时核实的 branch、HEAD 与上述值相同；此信息不能证明未提交代码仍与历史审查输入一致。
- 规范符合情况：作为第一轮历史报告导入，保留原始格式及版本证据缺口；本次没有按新规范重新执行该轮审查。

原报告中的“本次执行的验证”“已核对的实现”和“当前不可以进入真机验收”均属于 2026-10-13 的历史记录。历史结论要求修复后再进入验收，按新术语对应 `CHANGES_REQUIRED`；此映射仅描述原报告结论。当前版本结论来自第五轮定向复核。

## 状态与字段约定

历史状态：17 项迁移时均为 NEEDS_CONFIRMATION；第二轮声明修复后待复核；第三轮新增三项并验证七项；第四轮声明修复并将 I016 记为 DISMISSED。第五轮核验后更新如下，前四轮报告原文保留。

- `OPEN`：4。
- `VERIFIED`：16。
- `FIXED_PENDING_REVIEW`、`NEEDS_CONFIRMATION`、`DISMISSED`、`DEFERRED`：均为 0。

以下通用字段适用于 I001–I020；各项的状态、来源和具体证据见对应条目：

- 适用版本 / 复核版本：未提交快照 `wechat-stage4-round05-20261014`；此前七项 VERIFIED 保留第三轮证据并按本次影响范围核对，不声称重跑全部历史验证。
- 处理负责人：后续修复未分配；历史实施者为 Kimi Code。
- I001–I017 实施者回复与历史验证：见第二轮报告对应条目；实现与修复合并提交为 `6d821413c272857b24d8c57ae4c6177c407be7f0`，无法单独分离修复差异。
- 本轮 13 项实施者回复、修复版本与历史验证：见 [round-04-kimi.md](round-04-kimi.md)，修复为未提交内容，输入由第五轮快照固定。
- 复核者 / 报告：Codex，`codex-stage4-round05-20261014`，[round-05-codex.md](round-05-codex.md)。
- 本轮状态日期：2026-10-14（Asia/Shanghai）。VERIFIED 只覆盖原问题及已记录证据，不代表整个功能或平台验收通过；没有用户批准的延期或风险接受。
- 原始位置、触发条件、影响、规则依据和修复方向：见每项来源；第三轮 R01–R12 提供目标版本行号及证据，已关闭项目见第三轮逐项结论表。

## 问题

### I001 · blocker · 浏览器绑定凭据进入请求 URL 和访问日志

- 状态：`VERIFIED`。
- 第三轮证据：请求头传递绑定值，真实 API 正确绑定成功、错误绑定 404；实际 Nginx 日志格式不含该头。跨域回归另记 I020。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R01](round-01-codex.md)。
- 历史证据摘要：原报告记录客户端 URL、服务端领取条件和实际 Nginx `$request` 日志配置；未执行窃取会话操作。

### I002 · blocker · 旧数据源仍能覆盖退出或切换账号后的状态

- 状态：`VERIFIED`。
- 第五轮证据：加载开始取消旧订阅，刷新错误按 entry 隔离；真实双 store/磁盘验证加载中、完成后、加载失败后的隔离及重试恢复通过。
- 第三轮来源与证据：[round-03-codex.md · R01](round-03-codex.md)；真实 store 与磁盘复现切换加载期间旧数据恢复及旧通知覆盖失败状态；迟到错误未校验代次。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R01 条目；加载开始即取消旧订阅，刷新与错误处理绑定发起时代次，账号写路径 401 统一通知运行时。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R02](round-01-codex.md)。
- 历史证据摘要：原报告使用真实 runtime、游客 store 与磁盘存储复现切换 B 后刷新 A 恢复旧 store；账号队列影响来自代码路径分析，未执行跨账号破坏性请求。

### I003 · major · 保存中的新编辑被旧响应删除

- 状态：`VERIFIED`。
- 第三轮证据：真实 API 保存 A 期间写入 B 草稿，完成后后端为 A、本地保留 B；页面使用最新引用保护新编辑。Hook 顺序回归另记 I019。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R03](round-01-codex.md)。
- 历史证据摘要：原报告依据保存请求期间可继续编辑、旧响应清理最新草稿的执行顺序；未执行真机输入复现。

### I004 · major · 运行期间的 401 和刷新失败没有同步到页面状态

- 状态：`OPEN`。
- 第五轮来源与证据：[round-05-codex.md · R01](round-05-codex.md)；保存 401 回调已生效；实际直接 identities 请求的 401 仍仅清会话，runtime 保留 ready/account。详情直接请求亦绕过 guarded。
- 第三轮来源与证据：[round-03-codex.md · R02](round-03-codex.md)；保存、对战等路径未经过刷新包装，401 清除会话后 runtime 仍可保留账号数据。未伪造 401 运行结果。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R02 条目；账号数据源全部读写统一捕获 401 并通知运行时，按会话代次恢复游客工作区。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R04](round-01-codex.md)。
- 历史证据摘要：原报告检查初始化、刷新、API 错误处理和页面缓存读取路径，指出会话清除与页面状态、战报有效期处理存在差异。

### I005 · major · 数据源切换失败后“重新读取数据”不会重新加载

- 状态：`VERIFIED`。
- 第三轮证据：真实损坏 JSON 导致加载失败，恢复存储后重试成功进入 ready；原初始化 Promise 保留问题已消除。旧通知问题归 I002。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R05](round-01-codex.md)。
- 历史证据摘要：原报告依据已完成 Promise 的保留周期及重试按钮调用关系，指出重试会直接返回旧 Promise。

### I006 · major · 登录时卸载认证组件导致新账号导入流程重复启动

- 状态：`VERIFIED`。
- 第三轮证据：认证组件使用 PageShell，脱离 runtime ready 挂载条件，原卸载重挂原因已消除；真实微信交互未执行，新的 submitting 缺陷另记 I018。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R06](round-01-codex.md)。
- 历史证据摘要：原报告检查 React 挂载条件和异步调用关系，指出认证组件重新挂载与旧 continuation 可能竞争；真实微信登录未执行。

### I007 · major · 导入成功后账号快照未刷新，游客草稿也未清理

- 状态：`OPEN`。
- 第五轮来源与证据：[round-05-codex.md · R02](round-05-codex.md)；真实 API 确认首次成功后保留工作区并继续编辑，再次导入返回幂等成功但不上传新内容，客户端仍允许清理；草稿变化也未进入工作区版本检查。
- 第三轮来源与证据：[round-03-codex.md · R03](round-03-codex.md)；新增刷新与清理，但 await 后未校验会话、工作区及内容版本，迟到成功会清除未导入的新游客内容。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R03 条目；导入成功后校验会话与工作区 id、updatedAt，任一变化则保留本地数据。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R07](round-01-codex.md)。
- 历史证据摘要：原报告检查导入流程、独立草稿存储键、游客初始化和页面刷新入口，指出导入后的刷新与清理缺口。

### I008 · major · 已登录冷启动扫码时可能缺少创建游客工作区所需的随机标识符

- 状态：`VERIFIED`。
- 第三轮证据：查询使用 peek，真实空磁盘返回 null 且未创建存储文件；该路径不再初始化工作区或请求随机标识符。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R08](round-01-codex.md)。
- 历史证据摘要：原报告依据冷启动初始化顺序和工作区缺失分支，指出查询游客进度可能触发尚未准备的随机标识符；平台运行未验证。

### I009 · major · 同一绑定的并发请求被错误报告为身份冲突

- 状态：`VERIFIED`。
- 第五轮证据：同绑定冲突消解消费当前凭证，注册预检查重查身份；真实 Spring/PostgreSQL 并发及幂等消费断言通过。
- 第三轮来源与证据：[round-03-codex.md · R04](round-03-codex.md)；真实 bind API 同绑定成功后当前新凭证仍未消费；并发注册的用户名预检查仍可能提前返回冲突。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R04 条目；幂等路径消费当前凭证（行锁保护），注册预检查先核验该身份的已完成结果。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R09](round-01-codex.md)。
- 历史证据摘要：原报告检查事务边界、唯一约束和插入顺序；现有测试主要覆盖顺序重试，当次未执行数据库并发压力复现。

### I010 · major · 凭证和票据的过期检查与状态更新不原子

- 状态：`VERIFIED`。
- 第五轮证据：事务内取得行锁后再检查时间；真实 HTTP 层领取等待锁跨越到期后返回 410，凭证路径同步采用先锁定后校验。
- 第三轮来源与证据：[round-03-codex.md · R05](round-03-codex.md)；真实 PostgreSQL 行锁等待跨越到期后仍消费成功，statement_timestamp 固定于语句开始。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R05 条目；状态转换先取行锁，再按实际时刻核验；clock_timestamp 方案经本机探测否定后未采用。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R10](round-01-codex.md)。
- 历史证据摘要：原报告检查 SQL 状态条件与服务层时间检查位置；锁等待跨越到期边界的动态验证未执行。

### I011 · major · Web 领取失败后永久停留在等待确认

- 状态：`VERIFIED`。
- 第五轮证据：真实 App/React、jsdom、实际 API/PostgreSQL 验证连接中断后重试成功，以及离开面板后迟到成功不登录；未替代本项目响应。真实微信/浏览器平台验收仍 NOT RUN。
- 第三轮证据：代码已处理领取重试、终态及组件失效；真实浏览器失败恢复与离开面板行为未运行，必要证据不足，尚不关闭。
- 第四轮补充：运行验证发现领取遇 5xx 临时错误被误作终态，已修复；新增 `apps/web/src/scan-login.test.tsx` 真实 App、真实 HTTP 与真实定时器验证「失败重试后领取成功」与「过期终态并重新发起」。见 [round-04-kimi.md](round-04-kimi.md) I011 条目。
- 来源：[round-01-codex.md · R11](round-01-codex.md)。
- 历史证据摘要：原报告检查 Web 状态机及服务端终态转换，指出停止轮询后的领取失败和面板失效处理缺口。

### I012 · major · 未配置微信时 Web 只显示失效图片，缺少明确反馈

- 状态：`VERIFIED`。
- 第三轮证据：真实应用/数据库测试验证未配置微信时创建票据和 exchange 返回明确 503、密码认证兼容；图片错误已连接失败状态，平台界面交互未执行。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R12](round-01-codex.md)。
- 历史证据摘要：原报告检查配置检查调用链及图片渲染路径，指出创建票据成功后图片请求失败缺少可见错误处理。

### I013 · major · 三处用户名规则的汉字范围不一致

- 状态：`VERIFIED`。
- 第五轮证据：core、HTML pattern、Java、V15 均为 U+4E00–U+9FFF；实际边界用例及 typecheck 通过。
- 第三轮来源与证据：[round-03-codex.md · R06](round-03-codex.md)；core 仍止于 U+9FA5，实际拒绝 U+9FA6/U+9FFF，真实 API/数据库接受 U+9FFF，与第二轮修复声明不符。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R06 条目；core 统一为 U+4E00–U+9FFF 并补充边界用例，三处一致。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R13](round-01-codex.md)。
- 历史证据摘要：原报告记录实际 core 与 PostgreSQL 边界结果，并核对 Java 范围；JShell 探针退出异常未计为通过验证。

### I014 · major · 登录战报只加载最近 30 场，无法查看全部有效历史

- 状态：`VERIFIED`。
- 第三轮证据：真实生成 31 场战报，账号数据源加载全部记录及最早详情；真实应用测试覆盖分页、所有权和到期 404。并发新增期间的分页一致性未覆盖。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R14](round-01-codex.md)。
- 历史证据摘要：原报告检查固定 `limit=30`、列表渲染、详情查找及后端接口，指出全部有效历史要求与固定列表范围的差异。

### I015 · major · 扫码及身份交换限频可通过更换绑定值绕过

- 状态：`VERIFIED`。
- 第五轮证据：事务咨询锁保护计数和插入，二维码并发合并及失败冷却；35 并发的 30 成功/5 限频与同票据仅一次上游调用通过。真实微信配额未测试。
- 第三轮来源与证据：[round-03-codex.md · R07](round-03-codex.md)；票据限额 count/insert 非原子，同票据并发二维码和失败请求仍可重复请求上游；未执行真实微信配额消耗测试。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R07 条目；创建额度经咨询锁串行化，二维码并发合并、失败冷却，生成前限频。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R15](round-01-codex.md)。
- 历史证据摘要：原报告检查计数键、调用顺序和 Web 创建逻辑；未对微信发起配额消耗测试。

### I016 · major · 新测试使用伪造微信及业务响应，违反仓库验证规则

- 状态：`OPEN`。
- 第五轮来源与证据：[round-05-codex.md · R03](round-05-codex.md)。用户本轮明确“仅允许替代微信等外部平台，不包含本项目 API”；第四轮 DISMISSED 撤销。本项目票据、会话及业务 API 仍被前端测试服务器预设，未获许可；微信外部上游替代可以保留。
- 第三轮来源与证据：[round-03-codex.md · R08](round-03-codex.md)；预设微信及业务响应仍存在，增加说明没有消除规则冲突；本轮未运行这些替代响应测试。
- 第四轮处理：见 [round-04-kimi.md](round-04-kimi.md) R08 条目；测试形态保留（真实 HTTP 与真实 PostgreSQL，本地契约服务器扮演微信上游）。用户于 2026-10-14 决定接受该形态，规则解释见 [docs/DECISIONS.md](../../DECISIONS.md) D-006。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R16](round-01-codex.md)。
- 历史证据摘要：原报告检查预设响应生成代码并运行现有测试，指出测试替身与仓库规则冲突，且不足以证明真实微信及跨客户端行为。

### I017 · minor · 当前计划的目标和完成状态相互矛盾

- 状态：`OPEN`。
- 第五轮来源与证据：[round-05-codex.md · R04](round-05-codex.md)。第四轮输入的计划仍为第三轮、交接与计划 Owner/Status 不符、问题计数和逐项状态不同。本轮更新审查状态不改变对该输入修复声明的核验结果。
- 第三轮来源与证据：[round-03-codex.md · R09](round-03-codex.md)；目标版本的计划、未决事项、完成说明和交接仍描述相互矛盾的实施与提交状态。本轮独立工作区记录更新不改变目标提交结论。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R09 条目；current plan 的 Goal、Open Questions、Completion 与 AI_HANDOFF 已更新为当前状态。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R17](round-01-codex.md)。
- 历史证据摘要：原报告引用 current plan 内部的目标、授权和完成状态冲突；本次迁移保留该历史发现，未修改或重新审查 current plan。

### I018 · major · 绑定或注册成功后后续按钮持续禁用

- 状态：`VERIFIED`。
- 第五轮证据：finally 在成功/失败/提前返回均复位 submitting；代码路径核验、typecheck 和构建通过。设备交互验收未执行。
- 来源：[round-03-codex.md · R10](round-03-codex.md)。
- 证据：submit 设置 submitting 后成功路径未复位；组件保留挂载后，导入选择或扫码确认按钮持续禁用，处理函数也提前返回。源码明确，真实微信设备流程未运行。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R10 条目；submit 增加 finally 复位，成功进入后续步骤后按钮恢复可用。

### I019 · major · 阵容编辑页失败恢复改变 Hook 调用顺序

- 状态：`VERIFIED`。
- 第五轮证据：useRef 位于所有条件返回之前；真实磁盘编辑相关测试、typecheck 和构建通过。完整设备页面恢复未执行。
- 来源：[round-03-codex.md · R11](round-03-codex.md)。
- 证据：latestLineup 的 useRef 位于 failed 提前返回之后；同一组件失败后重试成功增加 Hook 调用，违反 React Hook 顺序。typecheck 通过无法排除此错误；设备复现未运行。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R11 条目；useRef 移到条件返回之前，赋值保留在 ready 分支，调用顺序固定。

### I020 · major · 新绑定请求头未加入 CORS 允许列表

- 状态：`VERIFIED`。
- 第五轮证据：真实 API OPTIONS 返回 200，允许请求头包含 x-login-ticket-binding，原来源限制不变。
- 来源：[round-03-codex.md · R12](round-03-codex.md)。
- 证据：真实目标版本 API 对携带 X-Login-Ticket-Binding 的预检返回 403 Invalid CORS request，允许列表仅含 Content-Type、Authorization；影响跨域扫码查询与领取，同源代理不受此条件影响。
- 第四轮修复：见 [round-04-kimi.md](round-04-kimi.md) R12 条目；`WebConfig` 允许该受控请求头，来源限制保持不变。

## 第三轮验证

63 项前端定向测试、16 项真实 Spring/PostgreSQL 测试、四包 typecheck、Web 与小程序构建通过。独立真实 API、磁盘和数据库探针同时确认有效修复与剩余缺陷；进程成功退出不代表业务验证通过。命令、环境、证据范围与 NOT RUN 项详见第三轮报告。未重新执行含替代响应的全量测试；真实微信和设备验收未完成。

## 历史迁移验证（2026-10-14，仅迁移时执行）

- `cmp docs/REVIEW_FEEDBACK.md docs/reviews/wechat-login-stage4/round-01-codex.md`：PASS；在原入口改写前执行，两份原始内容逐字节一致。
- `shasum -a 256 docs/reviews/wechat-login-stage4/round-01-codex.md`：PASS；归档内容与上方迁移前原报告摘要一致。
- `node node_modules/prettier/bin/prettier.cjs --check docs/REVIEW_FEEDBACK.md docs/reviews/wechat-login-stage4/issues.md docs/reviews/wechat-login-stage4/round-01-codex.md`：PASS；三份文档格式通过，归档原文未格式化改写。
- `node .cache/code-review-skill/validate-migration.cjs`：PASS；使用现有 Markdown 解析器检查 17 项一对一来源映射、标题和严重度保留、全部 `NEEDS_CONFIRMATION` 状态、入口与清单计数、21 个有效文件链接及原文 SHA-256。脚本位于本地 Git 忽略目录，记录可依照上述验收项重新核验。
- `git ls-files -z --cached --others --exclude-standard -- . ':(exclude)docs/REVIEW_FEEDBACK.md' ':(exclude)docs/reviews/wechat-login-stage4/**' | xargs -0 shasum -a 256 | shasum -a 256`：PASS；迁移前后其他已跟踪与非忽略未跟踪文件的汇总摘要均为 `f20c3fe5a64e0c8e2192657aae2be729b03f5b6322fd673406d9913bc8ee6317`。
- `git diff --check`：PASS；无差异空白错误。
- `git diff --cached --binary | shasum -a 256`：PASS；迁移前后暂存差异均为空，未暂存或提交本次变更。
- 代码审查、业务测试、typecheck、构建及平台验收：NOT RUN；本次授权仅迁移文档，原报告的历史结果未计为本次验证。
