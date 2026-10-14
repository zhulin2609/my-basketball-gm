# 微信登录阶段 4 审查问题清单

## 当前任务

- Task：`wechat-login-stage4`。
- 当前版本审查结论：`INCOMPLETE`；17 项历史发现已核验并修复，待独立复核。
- 当前待审版本：工作区未提交变更；Reviewed Commit 为 `N/A`；修复后快照以 2026-10-14 工作区为准，HEAD `b87d67f2eaba02f1db31abec822bda3c9f15e3bd`。
- 汇总负责人：Kimi Code，任务标识 `kimi-stage4-review-fix-20261014`；后续更新须重新确认写入归属。
- 报告列表：[第一轮 Codex 历史报告](round-01-codex.md)、[第二轮 Kimi 核验与修复报告](round-02-kimi.md)。
- 当前入口：[REVIEW_FEEDBACK.md](../../REVIEW_FEEDBACK.md)。
- 下一步：独立审查者固定当前快照复核修复；通过后由用户按验收清单继续真实微信平台与真机验收。

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

原报告中的“本次执行的验证”“已核对的实现”和“当前不可以进入真机验收”均属于 2026-10-13 的历史记录。历史结论要求修复后再进入验收，按新术语对应 `CHANGES_REQUIRED`；此映射仅描述原报告结论。当前版本保持 `INCOMPLETE`。

## 状态与字段约定

17 项于 2026-10-14 经 Kimi Code 核验并修复，状态均为 `FIXED_PENDING_REVIEW`，逐项修复与验证证据见 [round-02-kimi.md](round-02-kimi.md)；独立复核前不计为已解决。

- `FIXED_PENDING_REVIEW`：17。
- `OPEN`、`NEEDS_CONFIRMATION`、`VERIFIED`、`DISMISSED`、`DEFERRED`：均为 0。

以下通用字段适用于 I001–I017；后续有实际信息时，在对应问题下记录其变化：

- 适用版本：历史报告所描述的未提交工作区；精确快照缺失，当前版本适用性未核验。
- 处理负责人：未分配；历史实施者身份不自动构成本次修复指派。
- 实施者回复、修复版本、修复验证证据、复核者、复核报告：均未记录。
- 原始位置、触发条件、影响、规则依据和修复方向：见每项来源报告条目；本清单的证据摘要均转述历史报告。
- 状态记录：2026-10-14，由本次迁移导入为 `NEEDS_CONFIRMATION`；没有新增修复、复核、驳回或延期决定。

## 问题

### I001 · blocker · 浏览器绑定凭据进入请求 URL 和访问日志

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R01](round-01-codex.md)。
- 历史证据摘要：原报告记录客户端 URL、服务端领取条件和实际 Nginx `$request` 日志配置；未执行窃取会话操作。

### I002 · blocker · 旧数据源仍能覆盖退出或切换账号后的状态

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R02](round-01-codex.md)。
- 历史证据摘要：原报告使用真实 runtime、游客 store 与磁盘存储复现切换 B 后刷新 A 恢复旧 store；账号队列影响来自代码路径分析，未执行跨账号破坏性请求。

### I003 · major · 保存中的新编辑被旧响应删除

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R03](round-01-codex.md)。
- 历史证据摘要：原报告依据保存请求期间可继续编辑、旧响应清理最新草稿的执行顺序；未执行真机输入复现。

### I004 · major · 运行期间的 401 和刷新失败没有同步到页面状态

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R04](round-01-codex.md)。
- 历史证据摘要：原报告检查初始化、刷新、API 错误处理和页面缓存读取路径，指出会话清除与页面状态、战报有效期处理存在差异。

### I005 · major · 数据源切换失败后“重新读取数据”不会重新加载

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R05](round-01-codex.md)。
- 历史证据摘要：原报告依据已完成 Promise 的保留周期及重试按钮调用关系，指出重试会直接返回旧 Promise。

### I006 · major · 登录时卸载认证组件导致新账号导入流程重复启动

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R06](round-01-codex.md)。
- 历史证据摘要：原报告检查 React 挂载条件和异步调用关系，指出认证组件重新挂载与旧 continuation 可能竞争；真实微信登录未执行。

### I007 · major · 导入成功后账号快照未刷新，游客草稿也未清理

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R07](round-01-codex.md)。
- 历史证据摘要：原报告检查导入流程、独立草稿存储键、游客初始化和页面刷新入口，指出导入后的刷新与清理缺口。

### I008 · major · 已登录冷启动扫码时可能缺少创建游客工作区所需的随机标识符

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R08](round-01-codex.md)。
- 历史证据摘要：原报告依据冷启动初始化顺序和工作区缺失分支，指出查询游客进度可能触发尚未准备的随机标识符；平台运行未验证。

### I009 · major · 同一绑定的并发请求被错误报告为身份冲突

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R09](round-01-codex.md)。
- 历史证据摘要：原报告检查事务边界、唯一约束和插入顺序；现有测试主要覆盖顺序重试，当次未执行数据库并发压力复现。

### I010 · major · 凭证和票据的过期检查与状态更新不原子

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R10](round-01-codex.md)。
- 历史证据摘要：原报告检查 SQL 状态条件与服务层时间检查位置；锁等待跨越到期边界的动态验证未执行。

### I011 · major · Web 领取失败后永久停留在等待确认

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R11](round-01-codex.md)。
- 历史证据摘要：原报告检查 Web 状态机及服务端终态转换，指出停止轮询后的领取失败和面板失效处理缺口。

### I012 · major · 未配置微信时 Web 只显示失效图片，缺少明确反馈

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R12](round-01-codex.md)。
- 历史证据摘要：原报告检查配置检查调用链及图片渲染路径，指出创建票据成功后图片请求失败缺少可见错误处理。

### I013 · major · 三处用户名规则的汉字范围不一致

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R13](round-01-codex.md)。
- 历史证据摘要：原报告记录实际 core 与 PostgreSQL 边界结果，并核对 Java 范围；JShell 探针退出异常未计为通过验证。

### I014 · major · 登录战报只加载最近 30 场，无法查看全部有效历史

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R14](round-01-codex.md)。
- 历史证据摘要：原报告检查固定 `limit=30`、列表渲染、详情查找及后端接口，指出全部有效历史要求与固定列表范围的差异。

### I015 · major · 扫码及身份交换限频可通过更换绑定值绕过

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R15](round-01-codex.md)。
- 历史证据摘要：原报告检查计数键、调用顺序和 Web 创建逻辑；未对微信发起配额消耗测试。

### I016 · major · 新测试使用伪造微信及业务响应，违反仓库验证规则

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R16](round-01-codex.md)。
- 历史证据摘要：原报告检查预设响应生成代码并运行现有测试，指出测试替身与仓库规则冲突，且不足以证明真实微信及跨客户端行为。

### I017 · minor · 当前计划的目标和完成状态相互矛盾

- 状态：`FIXED_PENDING_REVIEW`（2026-10-14，kimi 修复并核验，待独立复核）。
- 修复记录：见 [round-02-kimi.md](round-02-kimi.md) 对应条目，含修改位置与验证命令。
- 来源：[round-01-codex.md · R17](round-01-codex.md)。
- 历史证据摘要：原报告引用 current plan 内部的目标、授权和完成状态冲突；本次迁移保留该历史发现，未修改或重新审查 current plan。

## 本次迁移验证

- `cmp docs/REVIEW_FEEDBACK.md docs/reviews/wechat-login-stage4/round-01-codex.md`：PASS；在原入口改写前执行，两份原始内容逐字节一致。
- `shasum -a 256 docs/reviews/wechat-login-stage4/round-01-codex.md`：PASS；归档内容与上方迁移前原报告摘要一致。
- `node node_modules/prettier/bin/prettier.cjs --check docs/REVIEW_FEEDBACK.md docs/reviews/wechat-login-stage4/issues.md docs/reviews/wechat-login-stage4/round-01-codex.md`：PASS；三份文档格式通过，归档原文未格式化改写。
- `node .cache/code-review-skill/validate-migration.cjs`：PASS；使用现有 Markdown 解析器检查 17 项一对一来源映射、标题和严重度保留、全部 `NEEDS_CONFIRMATION` 状态、入口与清单计数、21 个有效文件链接及原文 SHA-256。脚本位于本地 Git 忽略目录，记录可依照上述验收项重新核验。
- `git ls-files -z --cached --others --exclude-standard -- . ':(exclude)docs/REVIEW_FEEDBACK.md' ':(exclude)docs/reviews/wechat-login-stage4/**' | xargs -0 shasum -a 256 | shasum -a 256`：PASS；迁移前后其他已跟踪与非忽略未跟踪文件的汇总摘要均为 `f20c3fe5a64e0c8e2192657aae2be729b03f5b6322fd673406d9913bc8ee6317`。
- `git diff --check`：PASS；无差异空白错误。
- `git diff --cached --binary | shasum -a 256`：PASS；迁移前后暂存差异均为空，未暂存或提交本次变更。
- 代码审查、业务测试、typecheck、构建及平台验收：NOT RUN；本次授权仅迁移文档，原报告的历史结果未计为本次验证。
