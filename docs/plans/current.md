# Current Plan

更新时间：2026-10-20（Asia/Shanghai）

本文件保存 session-independent Task State；字段与状态语义遵循 `AGENTS.md`。路径以仓库根目录为基准。

## Task

当前任务：`deploy-tencent-skill-20261020`。用户授权创建仓库内项目 Skill，将腾讯云连接检查、main 更新、数据库备份、Web/API 重建启动及验证保存为可重复执行的流程。2026-10-20 最新授权：检查当前变更后提交并推送 `codex/deploy-tencent-skill` 分支。本次不连接云端执行变更。此前 main 合并与推送已完成，实际结果见 `.cache/icp-main-push-20261020/receipt.md`；以下历史任务记录保留。

### 腾讯云部署 Skill 当前记录

- Status：DONE。
- Owner：codex；Instance：codex-stage4-takeover-20261016-01a1421b。
- Worktree：/Users/zhulin/Workspace/my-basketball-gm。
- Branch：codex/deploy-tencent-skill。
- Base Commit：efe729d45acf1ea4ea23eae309525d5f6c1941be。
- 写入范围：新增 `.agents/skills/deploy-tencent/`、部署文档中的入口、本计划。
- Goal / Acceptance Criteria：形成可直接使用的项目 Skill；区分只读检查与部署授权；核验固定发布版本和独立测试证据；备份失败停止，保留生产 PostgreSQL 容器与数据卷；包含社区配置、服务及公网验证和失败处理；文档结构、格式与引用检查通过。
- Plan：检查现有部署配置与 Skill 约定 → 编写流程及发现入口 → 执行结构、格式与引用检查 → 更新结果。
- Current State / Progress：已核验 main 工作区干净并创建工作分支；已阅读 Compose 和部署文档，已完成 Skill、界面元数据和部署文档入口。结构、格式、引用与凭据扫描通过。此前只读 SSH 检查成功，服务状态仅代表当时状态。
- Open Questions / Decision Candidates：无。本次不改变产品行为或 accepted decisions。
- Validation：
  - `python3 /Users/zhulin/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/deploy-tencent`：FAIL，系统 Python 缺少 PyYAML；随后在忽略目录 `.cache/deploy-skill-validation/venv` 安装 PyYAML 6.0.3，不修改项目依赖。
  - `.cache/deploy-skill-validation/venv/bin/python /Users/zhulin/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/deploy-tencent`：PASS；名称、frontmatter 和占位内容检查。
  - 同一 Python 使用 `yaml.safe_load` 读取 `agents/openai.yaml`：PASS；描述长度与 `$deploy-tencent` 提示词检查。
  - `npm exec prettier -- --check .agents/skills/deploy-tencent/SKILL.md .agents/skills/deploy-tencent/agents/openai.yaml docs/deployment.md docs/plans/current.md`：PASS；首次发现 YAML 引号格式后已手动修正并复查。
  - `git diff --check`、相关引用目标存在性检查：PASS。
  - `.cache/security-audit/tools/gitleaks dir .agents/skills/deploy-tencent --redact --no-banner`：PASS，无发现。
  - 云端部署、备份恢复演练与新会话自动发现：NOT RUN；本次创建 Skill 不授权部署。业务测试及 typecheck：NOT RUN，仅修改 Skill 与文档。S01–S07 平台验收保持 BLOCKED。
- Completion：项目 Skill 创建完成；本记录为提交前状态，提交与推送结果以 Git 和执行回执为准。没有部署或重启服务。

以下为历史任务状态：

当前任务：`icp-community-disable-20261020`。用户批准在 develop 添加公共页脚备案链接（沪ICP备2026051556号-1，https://beian.miit.gov.cn/），通过统一配置关闭 Web 社区入口、阵容公开操作、社区路由及后端接口。保留全部社区数据及个人阵容、对战功能。更新相关文档、完整测试。

2026-10-20 最新授权：将 develop 合并到 main，本地保持 main，完整运行前后端全部测试；全部通过且待推送提交扫描通过后推送 main。合并前在 develop 提交本轮计划记录；合并后只生成忽略的测试产物和 `.cache/icp-main-push-20261020/receipt.md`，记录实际命令、版本、独立数据库名称、验证结果及推送结果。Owner 继续 codex。此执行记录为合并前 checkpoint，最终结果以回执和 Git 为准；不部署服务器。

2026-10-20 文档交付完成：三份汇总文档已提交为 4ddade06dfebaf7e68ce4ec036347af2115ddb87 并推送 develop。合并条件检查通过，main / origin/main 为 b01c45316643dfd2688736ea2187e89ab8cf4452，可快进到 develop；业务代码与 Kimi 已审提交 d5b240802bbb3d8e5457ae58d97882b398f2947a 一致。证据见 `.cache/icp-community-20261020/delivery-receipt.md`。

2026-10-20 汇总阶段授权与结果：仅更新本任务 issues.md、REVIEW_FEEDBACK.md 与本计划，已核验 Kimi Round 01 的 PASS；该阶段没有提交或推送。

2026-10-20 提交阶段记录：用户确认本地验收通过，授权提交当前变更并提供独立审查提示词。已提交至本地 develop，提交为 d5b240802bbb3d8e5457ae58d97882b398f2947a；未推送。当前汇总以该提交为 Reviewed Commit，独立审查结果见下方当前状态。

2026-10-20 本地验证补充授权：重新构建并启动本机 Web/API 服务。核验本地 Docker Desktop 与 develop / b01c453 后，将忽略文件 `.env` 中 `FORUM_ENABLED=true` 改为 false；备份当前开发数据库，仅重新构建及创建 web/api 容器，保留 PostgreSQL 容器与数据卷。完成后核验首页、静态资源、API 健康及社区接口关闭。用户自行进行本地产品验收；不提交、不推送、不部署远端服务器。

本地验证服务已于本轮重建完成：入口 `http://127.0.0.1:8088/`，Web/API 均 healthy，备案页脚与社区关闭已生效；具体命令见 Validation 的本地服务记录。下方实施阶段“开发容器未更新”描述补充授权之前的状态。

前一任务：`develop-main-local-validation-20261020`。用户授权提交当前三份文档并推送 develop，随后将 develop 合并到本地 main，保持本地 main，重新构建小程序、Web、后端并完整运行全部测试。起始 HEAD 为 `96219f24fef340d5533e6481cefcf9adf5577005`，三份未提交文档均来自上一轮汇总。Owner 继续 codex / ACTIVE。本轮推送目标为 develop；合并后的 main 用于本地验证。提交前更新本计划，合并后只生成忽略的构建产物与 `.cache/develop-main-local-20261020/` 验证记录，不直接修改 main 上的代码。

本轮执行结果索引：`.cache/develop-main-local-20261020/receipt.md`，记录实际提交、推送、合并、测试、构建、服务验证及未验证范围。该文件在命令执行后更新；未完成的命令不得预记 PASS。测试使用独立 PostgreSQL 数据库，用户开发库不用于自动化测试；本地 Web/API 服务使用现有 Compose 环境重新构建并启动。

前一任务：`wechat-stage4-round11-consolidation-20261020`。已核验 Kimi Round 11 并关闭 R05，三份状态文档待本轮提交。用户已接受历史报告格式问题，不再将其作为本次复核及合并条件检查的阻碍，原文与检查规则保持不变。

前一交付任务：`develop-stage4-delivery-20261020`。26 个文件的阶段 4 修复、测试和文档已提交并推送 origin/develop，提交为上述 HEAD，回执为 `.cache/develop-stage4-delivery-20261020/receipt.md`。该轮结束时 R05 待独立复核；本轮结果见下文。S01–S07 BLOCKED 和微信登录网络诊断未恢复的状态继续保留。

前一任务：`wechat-login-stage4-fixes-20261020`，处理 `wechat-login-stage4` Round 10 汇总与 R05 格式修复。核验 I004、I007、I016、I017 的独立复核结论，仅格式化报告列出的十个文件，更新三份当前状态文档并执行格式与类型检查。基线为 `494c9ca5c7a45821dab2098964f5621c71b1cb53`。该阶段没有提交、推送或合并；历史报告、用户验收表、身份备份和 Kimi worktree 保留。以下历史任务的授权范围仅适用于对应任务。

2026-10-20 补充诊断：用户清除缓存、重启并重新登录微信开发者工具后，继续定位 `微信登录失败：login:ok`。Owner 保持 codex / ACTIVE；仅检查实际原生登录、工具日志与网络路径，在 `.cache/wechat-login-diagnosis-20261020/` 保存诊断脚本和记录，并更新本计划。业务代码、数据库、VPN 配置和原有未提交修改保持原状。验收依据为实际 `wx.login()` 返回值及网络对照；当前确认 FreeGecko 接管的 IPv6 连接在 TLS 握手时失败，关闭 TUN 后的登录恢复尚未验证。此诊断不改变 R05 待独立复核及 S01–S07 BLOCKED 的状态。

前一任务：`develop-docs-delivery-20261019`，六份文档已提交并推送 origin/develop，收尾 HEAD 为上述基线，工作区干净。验证回执为 `.cache/develop-delivery-20261019/receipt.md`。

前一任务：`develop-local-validation-build-20261019`，已完成本地快进与三端构建。develop 从 `787c2729a98abac1d555cebb230442cdf188f632` 快进到 `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`；切换前后六份文档 SHA-256 一致。构建产物、本地服务和验证证据见下方历史记录。

前一任务：`wechat-login-stage4-round09-recheck-20261019`，已完成归档与核验。用户授权原样归档 Kimi Round 02 报告、汇总密码表单 R01 为 VERIFIED，并核验 I004、I007、I016、I017 在 `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9` 的状态。以下按日期保留历史任务授权与记录，当前范围以本段之前的当前任务为准。

2026-10-19 当前授权：记录用户反馈的 M01–M12、W01–W06 真机验收通过；S01–S07 因等待注册普通小程序账号而受阻。验证并提交、推送当前分支的 R01 修复、对战按钮文案、M11 错误提示及相关记录，提供 Kimi Round 02 独立复核提示词。原工作区 Owner 继续 codex / ACTIVE；R01 保持 FIXED_PENDING_REVIEW，不合并。用户验收表、本地身份备份、历史报告及 Kimi 独立 worktree 保留原状，不纳入本次提交。

2026-10-18 补充任务：M11 对战失败提示。用户确认断网文案为“网络错误，请稍后重试。”，原因未明确时为“暂时无法对战，请稍后重试。”。仅修改小程序对战错误展示与必要的平台网络状态读取；验收要求：不向用户暴露底层错误字符串，失败后保留所选阵容并允许再次提交；四包 typecheck、小程序构建及相关前端回归通过。本次增量基线为 `6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`。

当前修复：仅处理 Kimi Round 01 的 R01（第五次密码失败与正确请求并发时误报身份冲突）。原 Reviewed Commit 为 `6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`；任务 Base Commit 保持 `03c11587a11c28336693d64ee6f8e5d77e1a9a10`。原始报告在 `.cache/review-worktrees/wechat-password-form-20261017-round-01-kimi/docs/reviews/wechat-password-form-20261017/round-01-kimi.md`，只读保留。

本轮任务：`wechat-password-form-20261017`。用户授权实现小程序绑定错误保留表单、原位置重新验证微信身份，以及 Web 登录/注册与小程序绑定共用各端的 PasswordInput 控件。密码默认隐藏，可切换显示；错误后保留输入，切换不提交表单，保持焦点与选区。绑定请求与登录后数据加载分别处理，后端区分密码错误、凭证失效和次数耗尽。此前 M06 临时解绑和备份保留，恢复另待用户指令。交出工作时执行 `.agents/skills/handoff/SKILL.md`。

2026-10-16 的 Codex 接手核验已完成，Owner 为 codex，状态为 ACTIVE；接手证据及历史任务保留如下。

第八轮历史任务：`wechat-login-stage4-round08-review`，已完成。按用户要求，对第七轮 Kimi 修复的 I021–I023 及直接相关回归执行当前变更的最后一轮复核。输入为 HEAD `5450385c5c3b9bdff1950613acd889dcd979e3a7` 上的未提交快照 `wechat-stage4-round08-20261016`，保存于 `.cache/code-review-round08/input/`，清单为 `.cache/code-review-round08/snapshot.json`。仅更新第八轮报告、问题清单、入口及本计划；完成后停止，不自动修复或开启后续轮次。

第五轮历史任务：`wechat-login-stage4-round05-review`，已完成；输入快照 `wechat-stage4-round05-20261014` 保存于 `.cache/code-review-round05/input/`。其审查范围和验证证据继续以第五轮报告为准。以下保留实施任务背景与尚未完成的平台验收。

`wechat-miniprogram-stage4-implementation`：用户于 2026-10-13 明确授权开始阶段 4 业务实现，按产品文档第 4.3、5 节、D-005 与本文件 Plan 第 4 节实施：微信免密码账号与身份绑定、Web 小程序扫码确认登录与密码登录兼容、两端中文用户名、新键幂等游客导入、小程序登录数据切换与本人历史战报类型标示。阶段 3 剩余验收继续保留，已完成实现与验证见 Current State、Progress 和 Validation。此前 `wechat-miniprogram-stage4-preparation` 已完成，保持 DONE 里程碑。

## Status

ACTIVE

当前状态：功能与独立审查汇总已完成，本轮执行 main 合并、完整测试与推送。备案页脚与社区关闭的 Round 01 结论 PASS；Reviewed Commit 为 d5b240802bbb3d8e5457ae58d97882b398f2947a，基线为 b01c45316643dfd2688736ea2187e89ab8cf4452；本任务六类问题状态计数均为 0，无分歧。三份汇总文档已提交推送，业务代码与已审版本一致。历史阶段 4 为 24 VERIFIED；M01–M12、W01–W06 保留用户反馈 PASS，S01–S07 BLOCKED。下面均为历史 checkpoint。

2026-10-19：M01–M12、W01–W06 为 PASS，依据为用户本次真机验收反馈；S01–S07 为 BLOCKED，待用户注册普通小程序账号后继续。本轮未由 Agent 重新执行真机验收。R01 独立复核及阶段 4 历史四项 OPEN 均保持待处理，以下日期段落保留其当时的验证范围。

2026-10-18：Kimi Round 01 已完成，R01 已确认并修复，当前为 FIXED_PENDING_REVIEW，证据见[本任务问题清单](../reviews/wechat-password-form-20261017/issues.md)。原 Reviewed Commit 上的 CHANGES_REQUIRED 保留，修复后的独立复核尚未执行。以下 2026-10-17 状态属于修复前 checkpoint。

本轮密码控件与绑定错误处理已实现，自动化验证见本轮 Validation；小程序开发者工具页面验证未通过，真机键盘、选区与 M06 复验仍待完成。阶段 4 审查记录保留为 19 VERIFIED、4 OPEN（I004、I007、I016、I017，未获风险接受或延期批准）。用户此前真机验收 M01–M04 通过。第八轮复核 DONE 的记录保留。Kimi Code 的交接记录明确停止写入；用户于 2026-10-16 确认 ZCode 已停止写入，Codex 已取得当前工作区写入归属。

历史状态说明（保留）：第五轮核验第四轮未提交修复后，I004、I007、I016、I017 保持 OPEN，其余 16 项 VERIFIED；平台验收未完成，未获得风险接受批准。第八轮最终定向复核 DONE，I021–I023 全部 VERIFIED，该轮范围结论 PASS；阶段 4 产品验收保持 VALIDATING，任务汇总结论仍为 CHANGES_REQUIRED：19 VERIFIED、4 OPEN。

## Owner

- Owner: codex
- Instance: codex-stage4-takeover-20261016-01a1421b
- Last Writing Agent: codex，codex-stage4-takeover-20261016-01a1421b；继续持有当前工作区写入归属。
- Worktree: /Users/zhulin/Workspace/my-basketball-gm
- Branch: develop（计划提交后合并到 main，并保持本地 main；实际结果见本轮回执）
- Base Commit: b01c45316643dfd2688736ea2187e89ab8cf4452
- Takeover HEAD: 03c11587a11c28336693d64ee6f8e5d77e1a9a10
- Write Scope: develop 上的本轮计划记录提交、合并到 main、完整测试、待推送提交扫描及 main 推送；忽略目录中的执行回执。Kimi worktree、报告及证据目录只读；保留用户开发库、身份备份、验收表与 AGENTS.md，不修改业务代码或测试，不部署。

2026-10-18 后续授权：按当前 WiFi 地址重新构建小程序产物并记录验证；本次构建不修改业务代码或用户数据库，R01 仍待独立复核。

2026-10-18 M06 数据准备授权：用户明确要求备份并临时解除当前微信与账号 `link` 的绑定，随后明确授权恢复账号 A 的绑定。已在本地开发库 `basketball_gm` 完成这一条 `user_identities` 记录的备份、临时删除和原样恢复；备份继续保留，等待用户在已有表单提交账号 B 进行真机冲突验收。Owner 保持 codex，状态 ACTIVE。

## Goal

当前目标：备案号在全部 Web 视图可见；社区关闭时没有入口、公开操作、可访问页面或接口；已有数据不变，个人功能正常。以下为历史目标。

当前目标：完成 develop 文档交付，在本地 main 提供重新构建的三端产物及可访问的 Web/API 服务，完整运行小程序、Web、共享包与后端测试，保留真实运行证据。以下为历史目标，未完成的平台验收继续保留。

2026-10-19 M12：用户确认测试通过，并明确授权将当前微信从 `linktest` 恢复绑定到 `link`。已在本地开发库 `basketball_gm` 将唯一对应身份行原样恢复为 M12 前的备份内容，两个账号的数据保留。原绑定备份继续保留；手机已有会话须退出后重新微信登录，才能进入 `link`。

本次目标：修正 R01 的凭证消费原因解析，以真实 HTTP 与 PostgreSQL 固定两个锁顺序并验证响应与持久结果；完成当前增量的验证、提交与推送，提供固定提交版本的独立复核依据。

本轮目标：用户在原表单完成错误修改与重试，两端账号密码输入使用统一交互控件；验证正确密码、错误密码、凭证到期、次数耗尽、网络失败、重复提交与可见性切换。此前 M06 解绑准备、第八轮复核与 Codex 接手证据保留。

按已确认产品要求完成阶段 4 实现并通过验收：微信免密码账号、Web 小程序扫码确认登录与既有密码登录兼容、中文用户名、唯一身份绑定、安全游客导入与本人历史 AI 战报。2026-10-13 用户授权实施；第三轮审查仍有未解决缺陷，真实微信平台与真机验收未完成。阶段 3 未完成验收及历史证据持续保留。

## Acceptance Criteria

本轮交付验收：本地 main 包含 develop；合并后的版本通过根目录 `npm test`（Web、小程序、core、client）与后端完整 `mvn test`，测试使用独立 PostgreSQL 数据库和真实 Spring Boot；全部待推送提交扫描通过；推送后 main 与 origin/main 一致、工作区干净。当前 checkpoint 的测试和推送均为 NOT RUN，执行后在 `.cache/icp-main-push-20261020/receipt.md` 写入实际结果；既有 S01–S07 BLOCKED 保持不变。

本次验收：备案文字与链接准确，中英文及移动端可读；游客和已登录用户均无社区入口，未公开和已公开阵容均无社区区域；旧社区地址替换为球员库地址；真实 HTTP 验证接口关闭、数据库记录保留及个人功能；前后端完整测试、四包 typecheck 和 Web 构建通过。恢复开放需用户明确批准。

### develop 合并与本地验证（2026-10-20）

- develop 文档提交和远端引用一致，提交前检查完整暂存内容，推送前扫描全部待推送提交。
- 本地 main 合并 develop 后内容一致，最终保持 main，工作区无未提交的源码变更。
- 完整 `npm test`、后端 `mvn test` 使用独立真实 PostgreSQL，记录数据库及 PASS/FAIL；不使用用户开发库运行测试。
- 小程序采用当前局域网 API 地址重新构建；Web、后端 JAR 与本地 Compose Web/API 构建及健康检查完成。
- 逐项结果记录到本轮回执；S01–S07 仍 BLOCKED，自动化与服务健康不替代平台验收。

### Round 11 汇总与合并条件检查（2026-10-20）

- [x] 报告 Reviewed Commit、复核 worktree HEAD、原工作区 HEAD 和远端 develop 一致；报告及快照 SHA-256 已核验。
- [x] 核对 Kimi 日志，重算 347 个输入摘要与十个文件的格式化输出；R05 更新为 VERIFIED，当前计数为 24 VERIFIED。
- [x] 用户接受的历史报告格式例外明确记录，格式检查的 FAIL 不改记 PASS；S01–S07 保持 BLOCKED。
- [x] 更新三份状态文档；不修改业务、测试、原始报告或 Kimi worktree，不提交、推送或合并。

### Round 10 汇总与 R05 修复（2026-10-20）

- [x] HEAD、19 个已跟踪修改、7 个未跟踪文件、空暂存区及 347 个输入文件摘要与恢复记录一致。
- [x] 核对四项实现、Kimi 原始报告及日志；I004、I007、I016、I017 更新为 VERIFIED，复核版本和复核者明确。
- [x] R05 十个文件仅经 Prettier 格式化，逐字节比较格式器输出，类型检查通过。
- [ ] 全仓 `npm run format:check` PASS：受既有归档报告格式问题阻碍，原文按授权保留；本轮十个文件单独检查通过。
- [x] 三份当前状态文档同步；R05 为 FIXED_PENDING_REVIEW，结论保持 CHANGES_REQUIRED；历史段落及 S01–S07 BLOCKED 保留。

### I004、I007、I016 修复（2026-10-20）

- [x] 直接身份、战报与数据源请求的 401 均更新运行时；旧账号迟到响应不影响新账号。
- [x] 相同工作区重复导入验证实际内容；不同内容、会话变化、未保存或新增草稿均不丢失本地数据。
- [x] 移除预设项目 API 响应的测试方式，保留原回归覆盖并使用真实 Spring Boot 与独立 PostgreSQL；外部微信仅按 D-006 契约替代。
- [x] 完整前后端测试、四包 typecheck、Web 与小程序构建通过；记录实际命令、数据库、失败与未验证范围。
- [x] 更新问题清单为 FIXED_PENDING_REVIEW，复核输入与 Kimi 提示词见[实施记录](../reviews/wechat-login-stage4/fixes-20261020-codex.md)。

### develop 文档交付与完整测试（2026-10-19）

- [x] 前端完整测试、后端完整测试和四包类型检查通过；后端使用本轮独立 PostgreSQL 数据库。
- [x] 六份文档记录审查结果、既有问题和本轮实际验证；两份原始报告保持原文。
- [x] 检查完整暂存内容及全部待推送提交，提交并推送 develop，收尾为 `494c9ca`，回执见上述路径。
- [x] 收尾确认本地保持 develop，main 未变化，工作区没有未提交修改（2026-10-19）。

### 本地 develop 合并与构建（2026-10-19）

- [x] develop 快进到源分支 HEAD，保持 develop 检出，六份未提交文档内容通过摘要核验。
- [x] Web、小程序和后端构建通过；小程序使用当前局域网 API 地址，产物校验通过。
- [x] 后端打包测试使用本轮独立 PostgreSQL，记录命令、结果与未验证范围。
- [x] 本地 Web/API 镜像构建及容器健康检查通过，首页、JS、CSS 和局域网 API 健康请求通过。

### 第九轮归档与核验（2026-10-19）

- [x] Kimi Round 02 原样归档，副本与原文 SHA-256 一致；密码表单 I001 / R01 依据独立复核改为 VERIFIED。
- [x] 核验四个历史问题在 HEAD 的实现、规则及文档证据，完成真实 API 与独立 PostgreSQL 验证。
- [x] 完成第九轮报告、处理建议与未验证范围，更新当前入口、问题清单和本计划；业务代码、既有测试、用户验收表、身份备份、历史报告及 Kimi worktree 保留。
- [ ] I017 当前文档整理待独立复核；三项 OPEN 的修复与 S01–S07 验收待安排。此项不属于本轮核验完成条件。

### 当前交付与平台验收（2026-10-19）

- [x] M01–M12、W01–W06：用户确认真机验收通过，按用户提供的编号记录。
- [ ] S01–S07：BLOCKED，等待用户注册普通小程序账号后继续验收。
- [x] 当前增量独立复核：Kimi Round 02 对 `ba80e11` 给出 PASS，R01 已汇总为 VERIFIED；本结论不关闭阶段 4 四个历史问题。

### R01 修复（2026-10-18）

- [x] 修复前通过真实 HTTP 并发测试复现错误请求先取得锁时正确请求误报 409。
- [x] 无实际身份绑定且凭证耗尽时返回 CREDENTIAL_ATTEMPTS_EXCEEDED；真实双向身份冲突保持 IDENTITY_CONFLICT。
- [x] 固定并验证两个请求锁顺序的 HTTP 状态、错误码、失败次数、身份表及消费状态；普通错误后正确重试、成功重试保留。
- [x] WechatAuthApiTest 17 项、后端完整测试复跑 83 项、四包 typecheck 通过；首次完整运行的非本轮 LLM 测试错误保留记录。
- [x] R01 独立复核：Kimi Round 02 已确认，见本任务归档报告。

### 密码输入与绑定错误处理（2026-10-17）

- [ ] Web 登录/注册与小程序绑定使用各端 PasswordInput，默认隐藏、可切换、禁用与错误样式一致；切换模式或重新进入时恢复隐藏。
- [ ] 绑定密码错误、冲突及网络失败保留输入；修改字段清除普通错误，凭证失效或次数耗尽在原位置重新验证微信，保留输入且不自动提交。
- [x] 区分认证失败与认证成功后的数据加载失败，小程序提交使用同步锁并禁用按钮。
- [x] 执行真实项目 API/PostgreSQL 验证、控件交互测试、四包 typecheck、两端构建和相关格式检查；平台证据与自动化结果分开记录。

### M06 真机验收准备（2026-10-17）

- [x] 核验本地 Docker 数据库、服务连接、小程序构建地址及身份表约束。
- [x] 确认当前唯一微信绑定对应的账号与用户期望一致。
- [x] 备份原绑定，精确删除一条记录并核验业务数据保留。
- [x] 用户于 2026-10-19 确认 M01–M12 真机验收通过；原微信与 link 的绑定已按授权恢复，备份保留。

### Codex 接手核验（2026-10-16）

- [x] 按 `AGENTS.md → docs/AI_HANDOFF.md → docs/plans/current.md → Git verification` 核验，并读取 canonical handoff Skill。
- [x] 核对相关实现与历史审查状态，保留四项 OPEN 和未完成的平台验收。
- [x] 取得 ZCode 停止写入的用户确认，结合 Kimi 交接声明，将 Owner 设为 codex、状态设为 ACTIVE。
- [x] 记录类型检查、文档检查和 Git 核验结果；业务代码及既有文件修改保持原样。

### 第八轮最终定向复核

- [x] 固定未提交修复快照、来源、文件摘要及可写范围；保留历史报告和验收表。
- [x] 实际执行后端相关测试，在同一隔离测试数据库重复执行并检查新增固定用户名的残留。
- [x] 核对边界断言、架构说明、修复前后版本及历史验证边界。
- [x] 更新第八轮报告、I021–I023、入口及本计划；收尾检查输入保留，完成后停止。

### 第五轮最终定向复核

- [x] 保存 322 个输入文件及摘要，绑定未提交快照；现有业务修改和历史报告保持原样。
- [x] 定向复核 13 项处理，9 项验证通过、4 项仍 OPEN；此前 7 项证据按影响范围保留，无新增问题。
- [x] 运行实际相关测试、API/磁盘探针、typecheck、构建及 CORS 预检，独立记录平台缺口。
- [x] 用户明确外部微信替代的授权不包含本项目 API；I016 恢复 OPEN。
- [x] 更新报告、问题清单、入口及本轮计划；不自动继续审查循环，不提交、不推送。

### 第三轮复核

- [x] 固定目标完整提交，核实四次提交顺序与远端分支，保留首次审查快照缺失的边界。
- [x] 逐项复核 I001–I017，新增相关回归 I018–I020；独立工作区完成验证后，经用户确认接管，将四份审查相关文档同步至当前工作区。
- [x] 实际执行必要测试、typecheck、构建及真实磁盘/API/数据库验证，记录未验证范围。
- [x] 保留现有未提交内容、业务代码、测试、配置和历史报告；不提交、不推送。

### 阶段 4 实施（Kimi 历史声明；第三轮未全部认可）

- [x] V14 迁移：`user_identities`、身份确认凭证、扫码票据三张表及用户名约束重建；既有库升级与新库初始化通过真实 PostgreSQL 验证。
- [x] 微信 exchange、bind、register 与 `GET /auth/identities`；新微信账号密码保持未设置且不能密码登录；双向绑定唯一约束、重复绑定幂等、冲突拒绝；身份确认凭证短期、一次性消费。
- [x] 扫码票据全流程：浏览器绑定、小程序内主动确认或拒绝、到期、一次性领取；小程序码由服务端生成，票据内容不含凭据。
- [x] 两端与数据库用户名规则统一：汉字、英文字母、数字、下划线、连字符，3–32 个字符；重名、保留名、emoji、空格明确拒绝，不自动改写。
- [x] 游客导入：首次导入每套阵容分配新 client key，同事务重映射战报与自定义球员引用；成功重试复用结果，跨账号冲突拒绝；Web 导入流程回归通过。
- [x] 小程序 account 与 auth 页面：微信登录、绑定已有账号、创建新账号、游客导入选择、退出与会话切换清理；昵称仅快捷填写用户名。
- [x] 小程序登录后阵容、规则对战与战报切换为 API 数据源；战报列表与详情按 `engineVersion` 标示“规则对战”或“AI 对战”，读取不触发模型调用。
- [x] Web 登录页增加扫码登录方式，保留用户名密码登录；既有 Web 功能回归通过。
- [x] `mvn test`、`npm test`、四包 typecheck、两端构建、格式与差异检查全部通过。
- [ ] 真实微信联调（A01–A13、P06–P08、P10、P11）：NOT RUN；需要真实 AppID 与 AppSecret 配置、开发者工具及真机条件，微信接口在本轮测试中由真实本地 HTTP 服务器替代，不以替代结果充当平台验收。

### 阶段 4 后续准备与交接（已完成）

- [x] Kimi Code 按 `RECEIVE → VERIFY → ACCEPT → WORK` 核验四份未提交文档、Git 元数据与引用实现，确认 Codex 停止写入后接手。
- [x] 核对认证请求与 JWT 颁发边界、V7 用户约束、保留名及管理员规则，形成中文用户名、无密码账号及身份绑定的新增迁移和接口计划。
- [x] 明确扫码票据的浏览器绑定、主动确认、到期与一次领取，游客导入的新键映射和历史战报读取边界，列出真实联调条件及 Web 回归项。
- [x] 获得后续业务开发授权前保持业务代码与配置不变；准备完成后按同一 Skill 交接或按新的用户指令继续。

### 本轮阶段 4 产品定义

- [x] 产品文档记录免密码注册与 Web 扫码主动确认登录，保留现有用户名密码登录；新微信账号不设置隐藏或随机密码。
- [x] 微信昵称仅快捷填写用户名，不新增独立昵称或头像功能；用户已确认两端允许中文汉字，保持其他字符、3–32 字符长度、唯一性和保留名规则。
- [x] 记录已确认的绑定数量、首次导入分配新键及历史 AI 战报范围，更新验收条件，将已确认项移出待确认列表。
- [x] 接受的长期决定归档为 D-005；注明 `display_name` 已有、ASCII 用户名校验及阶段 4 功能尚未改变。
- [x] 阶段 3 编号 08/11/12、Android 与剩余基础库兼容性验收保留，不标为 PASS 或 DONE。
- [x] 文档格式、引用、差异和敏感信息检查通过；修改范围仅为上述三份文档。

### 阶段 3 保留验收与历史实现

- [x] Google Docs 与本文件同步用户确认的 iPhone 验收结果：编号 01–06、09、10 通过，编号 07 已修复；本轮仅更新记录。
- [x] 开发者工具代码质量面板重新扫描后，按需注入、JavaScript 压缩、WXSS 压缩三项均为“已通过”（2026-10-13，用户确认）。
- [ ] 编号 08 游客离线流程、11 真实存储失败与恢复、12 战报到期与旧详情：暂无验收条件，保持 NOT RUN。
- [ ] Android 编号 01–12 真机验收：尚未执行，保持 NOT RUN。
- [x] 点击阵容卡片的背景、文字及按钮均打开对应阵容编辑页，单次点击只增加一个页面。
- [x] 点击历史战报卡片的背景、文字及按钮均打开对应战报详情，空列表继续正常展示。
- [x] 本轮相关测试、四包 typecheck、两端构建及开发者工具交互通过，导航不修改阵容或战报数据，Web 主资源保持一致。
- [x] 编辑页首次加载及重新显示时，按照所读取的草稿或正式阵容将首发置顶，两组内部保持原顺序。
- [x] 页面内切换首发不移动卡片；取消、移除、增加球员和正式保存继续正常。展示操作不新增草稿或改变存储顺序。
- [x] 真实磁盘存储回归测试、四包 typecheck、两端构建和开发者工具页面验证通过，Web 主资源保持一致。
- [x] 两个球员浏览页面实际翻页后，新列表渲染完成再立即滚动到浏览区域起点；上方显示“第 X / Y 页”，保留底部分页。
- [x] 分页滚动只由上一页、下一页触发；添加球员及详情返回保留页码和位置。搜索重置、第一页、末页和空结果边界通过开发者工具验证；筛选重置逻辑保留。
- [x] 本轮相关测试、四包 typecheck、两端构建与开发者工具分页交互通过，Web 源码与构建资源保持一致。
- [x] 保留已完成实现、历史验证和后续待办；交接可脱离聊天记录读取。
- [ ] 核验有权限的本地小程序配置、开发者工具服务端口、基础库及 iOS、Android 设备条件；不输出真实凭据。
- [ ] 完成 P01–P05、P09 的游客相关部分、P10 的本地保留规则及第 11.4 节的平台操作验收，记录具体环境、步骤和结果。
- [ ] 完成两种手机平台的连续中文输入、键盘、安全区域、返回、后台恢复、真实存储失败与随机 API 兼容性验证；iPhone 对应编号 01–06、09、10 已通过，真实存储失败及 Android 仍未验收。
- [ ] 验证所声明的基础库兼容范围；不能执行的项目保留 NOT RUN 和具体原因。
- [ ] 如验收引起代码修改，执行对应测试、四包 typecheck、Web 与小程序构建及必要的 Web 回归。
- [x] 修复小程序草稿提示：列表明确标示未保存草稿及对战限制；编辑页使用红色加粗的“有草稿未保存”；通过真实磁盘存储和运行状态通知测试，Web 构建产物保持一致；iPhone 草稿恢复与正式保存用例已通过，Android 未验收。
- [x] 超过 13 名激活或 5 名首发时，调用 toast 并显示对应球员卡片内的红色原因；开发者工具验证开关和草稿状态保留。用户确认 iPhone 用例 07 的体验问题已修复，Android 未验收。
- [x] 首发未满且激活未满时，非激活球员设置首发同时激活，只写入一次完整草稿；首发已满优先提示首发限制，激活已满时提示激活限制。
- [x] 覆盖拒绝操作、释放名额后重试、自动激活、取消激活清除首发与草稿恢复；相关测试、四包 typecheck、两端构建、Web 产物一致性及开发者工具页面交互验证通过。
- [x] 九个页面的 `backgroundColorContent` 声明为深绿色，保留 page CSS、PageMeta 根背景及窗口背景；iPhone 四个原生 tab 首次与重复切换、滚动后切换、详情与编辑页返回完成验证。80 张真机过渡采样截图未捕获白色画面，用户确认修复版本普通预览没有白色闪烁。
- [x] 独立排查记录覆盖复现环境、原生静态复现、颜色实验、三层背景、修复、真机结果与采样局限；README 和本文件提供有效引用，文档格式与事实核验通过。
- [x] 小程序球员详情页保留资料和能力值展示，移除“选择阵容”按钮；详情返回及阵容编辑页“添加球员”流程通过实际页面验证，四包 typecheck、小程序构建与格式检查通过，长期决策记录为 D-004。
- [ ] 全部阶段 3 必需验收有有效证据后设为 DONE；身份、联网和分享需求按后续阶段处理。

## Plan

本轮汇总计划已完成：核验两个 worktree 的版本与改动 → 阅读 Round 01 全文及抽查日志、运行探针与结果 → 核对五项需求与 Compose 三态 → 更新问题清单、当前入口与本计划 → 检查文档格式、链接及原始报告摘要。

实施阶段计划已完成：核验 develop 与所有权 → 页脚及统一关闭配置 → 覆盖旧地址、游客与登录用户及已有公开数据 → 真实 HTTP / 独立 PostgreSQL 验证 → 完整测试、类型检查、构建、浏览器交互与文档检查 → 本地验收、提交与独立审查。

本轮计划：检查三份文档与远端基线 → 检查格式及敏感信息 → 提交并推送 develop → 快进到本地 main → 完整测试与三端构建 → 更新本地服务并验证 HTTP → 将实际结果写入忽略目录回执，确认最终 Git 状态。以下计划仅为历史记录。

Round 10 汇总计划已执行：核对恢复与快照证据 → 汇总四项结论 → 仅格式化 R05 十个文件 → 比较格式器输出并执行格式与类型检查 → 同步当前状态文档。

第九轮计划已执行：归档独立报告并同步 R01 → 核验四项当前证据 → 隔离数据库验证 → 更新报告、状态和建议。下面实施计划属于此前任务，不能作为本轮业务修改授权。

### M11 对战失败提示（2026-10-18）

已完成：检查错误来源与 Taro 网络类型契约 → 失败后读取网络状态并映射用户确认文案 → 执行纯函数提示测试、比赛与阵容规则回归、四包 typecheck 和小程序构建。网络状态为 `none` 时显示网络文案，其余状态及状态查询失败时显示原因未明确的文案。

### R01 修复（2026-10-18）

核验报告与当前代码 → 通过真实 HTTP 和 PostgreSQL 行锁等待队列固定两种请求顺序，先复现错误 → 修复事务失败后的凭证状态解析 → 执行 WechatAuthApiTest、完整后端测试、typecheck 与差异检查 → 记录 R01 为 FIXED_PENDING_REVIEW，等待独立复核。测试数据库计划为 `password_form_r01_20261018` 与 `password_form_r01_full_20261018`，不连接用户开发库。

### 当前密码表单任务

本轮实施顺序：拆分认证失败与登录后失败 → 新增两端 PasswordInput → 原表单保留输入与错误提示 → 原位置重新验证微信 → 原子记录失败次数并返回明确错误码 → 真实 API、控件与构建验证。实现已完成；平台验证限制见 Validation。正式交出工作时执行 `.agents/skills/handoff/SKILL.md`，刷新交接索引并释放 Owner。

### 第八轮复核安排

固定输入 → 检查修复与相关调用 → 在独立 PostgreSQL 数据库执行定向测试及重复运行 → 核对文档和类型检查 → 更新报告与状态 → 检查快照、清理本轮资源并停止。

### 1. Investigation

- [x] 阅读仓库规则及相关产品、架构、决策、交接与计划，核验 Git 基线和干净 working tree。
- [x] 核对用户数据库字段、认证校验、身份缺口、游客导入冲突与历史战报字段，区分实际实现和已确认目标。

### 2. Implementation

- [x] 更新产品流程、验收条件、当前计划和长期决策，保留阶段 3 待办和历史验证。
- [ ] 阶段 4 业务实现：已获用户授权（2026-10-13），按 Plan 第 4 节实施，顺序为迁移与后端、共享包与 client、Web、小程序；每步执行对应测试。
- [ ] 阶段 3 剩余平台验收：条件就绪后按保留清单执行；本轮不执行。

### 3. Validation

- [x] 执行本轮文档格式、路径引用、差异与敏感信息检查，结果见本轮 Validation。
- [ ] 阶段 4 实施后执行相关行为测试、四包 typecheck、两端构建、后端集成测试及真实微信跨客户端验收；本轮 NOT RUN。
- [ ] 补齐阶段 3 剩余开发者工具、基础库兼容性和两种手机平台的真实运行证据。

### 4. 阶段 4 实施设计（kimi 核对形成，2026-10-13 获授权并已实施）

对应产品文档第 10 节第 4 项。V1–V13 不修改，新迁移从 V14 递增；接口路径遵循第 5.3 节建议，实现时可统一调整。

1. 迁移 V14：新增 `user_identities`（id、user_id、provider、appid、openid、可空 unionid、created_at；唯一约束 `(provider, appid, openid)` 与 `(user_id, provider, appid)`）；身份确认凭证表（服务端随机值的摘要、过期时间、消费状态）；扫码票据表（票据标识、浏览器绑定值摘要、状态、批准的 user_id、创建与过期时间）；删除 V7 的 `users_username_format_check` 并按明确字符集重建（汉字、英文字母、数字、下划线、连字符，3–32 字符）。迁移测试覆盖既有库升级与新库初始化。
2. 后端认证：`AuthService` 复用保留名校验、大小写不敏感唯一性与私有 `issue` 的 JWT 签发；新增微信 exchange、bind、register 及 `GET /auth/identities`；身份确认凭证在绑定事务成功时消费，重复同一操作幂等识别；`WechatLoginClient` 隔离微信 `jscode2session` 调用，AppID 与 AppSecret 由配置注入，缺失时明确报告该能力未配置，密码登录不受影响。`SecurityConfig` 精确放行新增的匿名接口，不放行整个 `/auth/**`；凭证交换、绑定、注册与票据接口按配置限频。
3. 扫码登录：Web 创建票据时提交浏览器生成的随机绑定值，服务端保存其摘要并返回票据标识；Web 展示进入小程序确认页的小程序码（服务端调用 `wxacode.getUnlimited`，票据标识须适配 scene 参数长度限制）；小程序确认页要求登录态，明确展示正在请求登录 My Basketball GM 网页端，由用户主动确认或拒绝；领取接口校验票据、浏览器绑定值与批准状态，一次性签发 JWT；到期、拒绝、重复领取均明确结束。
4. 用户名校验统一：共享规则进入 `packages/core` 供两端表单使用，后端 `@Pattern` 同步；允许字符均在基本多文种平面内，字符计数与 Unicode code point 计数一致；重名、保留名、emoji、空格与超长明确报错，不静默改写候选值。Web `App.tsx` 的 `pattern` 属性同步更新。
5. 游客导入改造：`GuestImportService` 首次导入为每套阵容由服务端生成新 client key，同一事务内重映射战报主客队引用与自定义球员 ID；保留 `guest_imports` 主键 reserve/finish 幂等与跨账号冲突行为；成功后客户端才清空游客工作区，失败与跳过保留数据。该改动同时改变 Web 导入行为，列入回归。
6. 小程序账号与数据：account 页增加账号与绑定状态、登录与退出入口；新增 auth 页完成微信登录、绑定已有账号、创建新账号及游客导入选择；登录后阵容、规则对战与战报切换为 API 数据源（`simulationMode: 'local'` 表示服务端规则引擎）；战报列表与详情按 `engineVersion` 标示“规则对战”或“AI 对战”，读取不触发模型调用；会话切换清理上一账号缓存，迟到的异步响应不得写入新会话。
7. Web 扫码入口：登录页增加扫码登录方式并保留密码登录；接入票据创建、状态轮询或领取与各类结束状态展示。
8. 配置与文档：`application.yml`、`compose.yaml`、`.env.example` 增加微信配置占位，真实凭据不进仓库；实施后更新 `docs/ARCHITECTURE.md` 相应章节。

实施后的验证：`mvn test`（127.0.0.1:5432 的真实 PostgreSQL 测试库）覆盖迁移升级与新库初始化、双向唯一约束与并发绑定、凭证与票据生命周期、导入新键映射和成功重试、无密码账号拒绝密码登录；`npm test`、四包 typecheck、两端构建；Web 回归覆盖密码注册登录、游客导入、球员编辑、阵容、规则与 AI 对战、社区与国际化；微信联调按验收清单 A01–A13、P06–P08、P10、P11 在开发者工具及 iOS、Android 真机执行，缺少凭据或设备的项目逐项注明 NOT RUN，不以产品确认代替平台验收。

## Current State

2026-10-20 Round 01 汇总：develop HEAD 为 d5b240802bbb3d8e5457ae58d97882b398f2947a，与 Kimi detached worktree 相同；汇总开始时原工作区干净。Kimi 原始报告 Findings 为空，五项重点检查均有对应证据，汇总结论 PASS；详情见[问题清单](../reviews/icp-community-disable-20261020/issues.md)。以下为历史 checkpoint。

2026-10-20 备案与社区关闭：页脚覆盖全部视图及独立登录页面；前端隐藏社区导航与阵容公开区域，旧地址替换为球员库；后端默认不注册社区控制器。新增关闭状态测试，既有社区开启测试显式配置 true。完整前后端测试、四包 typecheck、Web 构建及 Compose 配置验证通过。基线 b01c453，独立后端测试库 `icp_community_backend_20261020`，前端完整测试库 `stage4_frontend_1792487561717`；用户开发库未用于测试。变更保留未提交状态，开发容器及服务器未更新。

当前状态：develop 与 origin/develop 为 `96219f24fef340d5533e6481cefcf9adf5577005`，main 与 origin/main 为 `787c2729a98abac1d555cebb230442cdf188f632`；main 是 develop 的祖先，`main...develop` 为 0 / 32，可以快进。已记录的代码审查阻碍已解除，本轮三份文档尚未提交；正式合并若需包含本轮记录，需先提交这些文档。main 推送前必须完整运行前后端测试并扫描全部待推送提交，本轮未执行该门禁。S01–S07 是未完成的平台验收，仓库未将其单独定义为 Git 合并硬性门禁；不得据此宣称产品验收全部通过。以下均为历史 checkpoint。

Round 10 汇总 checkpoint：原工作区与 Kimi worktree 的 347 个快照输入均核验一致，报告所述源码恢复得到确认；依赖目录重装只按报告记录，不据此声称逐文件一致。本轮四项 VERIFIED，R05 对应稳定编号 I024、FIXED_PENDING_REVIEW。报告物理位置为 `.cache/review-worktrees/wechat-stage4-round-10-kimi/docs/reviews/wechat-login-stage4/round-10-kimi.md`，SHA-256 为 `021b4c53929c5225fd603334d1effc8d051ebb69aad94f67a269d479e11e1bcd`，只读保留，未另行复制归档。该阶段仅十个 R05 文件格式变化及三份文档更新，没有连接数据库或更新服务。

2026-10-20：保持 develop，HEAD 为 `494c9ca5c7a45821dab2098964f5621c71b1cb53`，修复未提交。V17 及新运行时逻辑已完成；前端使用本轮独立真实 API，完整 29 个文件、158 项通过；后端完整 83 项通过。Web、小程序及后端 JAR 构建完成，小程序地址仍为 `http://192.168.1.12:8088/api/v1`。没有更新用户开发服务或数据库。修复文件、验证与快照见[实施记录](../reviews/wechat-login-stage4/fixes-20261020-codex.md)。

以下均为历史 checkpoint。

2026-10-19 交付 checkpoint：完整前端 27 个文件、140 项测试通过；完整后端 83 项测试通过，0 failures/errors/skipped；四包类型检查通过。独立数据库 `develop_delivery_20261019` 位于 `basketball-gm-test-pg`，未操作用户开发库。日志位于 `.cache/develop-delivery-20261019/`。交付前 origin/develop 与 origin/main 均为 `787c2729a98abac1d555cebb230442cdf188f632`，develop 领先 30 个提交；文档最终提交为 `494c9ca`，推送与工作区干净已由回执及 Git 核验。

历史 checkpoint（develop 合并构建）：检出 develop，HEAD 为 `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`，与 mini-app-20261004 相同；当时本地 develop 比 origin/develop 领先 30 个提交，未推送。六份此前未提交文档保留，其中 current plan 随该任务更新。产物为 `apps/web/dist/`、`apps/miniprogram/dist/`、`backend/target/basketball-gm-api-0.0.1-SNAPSHOT.jar`。本地入口 `http://127.0.0.1:8088/`；当时局域网入口 `http://192.168.1.12:8088/`，小程序 API 为该地址下的 `/api/v1`。Web/API 容器已使用该轮构建镜像并通过健康检查；数据库容器未重建。以下记录为之前核验与实施的历史 checkpoint。

当前事实（2026-10-19 Round 09）：HEAD 为 `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`。`ba80e115f72c48d81ded5d85fb607256f45361bb` 已包含 R01、M11 和按钮变更；HEAD 相对该提交只增加 `阶段4验收用例.xlsx`。Kimi Round 02 PASS、R01 VERIFIED。I004、I007 的残余路径已由真实 API 复现；I016 的预设项目 API 响应仍在测试源码；I017 本轮文档整理待独立复核。微信与 link 绑定的恢复、M/W 用户验收结果沿用已记录证据，本轮未连接用户开发库。以下均为历史 checkpoint，旧 HEAD、未提交、解绑待恢复及待验收描述只适用于对应日期。

2026-10-18：R01 仅修改 WechatAuthService 与 WechatAuthApiTest。事务失败后的绑定解析先核验实际身份关系；没有绑定时重新读取凭证，按耗尽或无效状态返回错误。真实 PostgreSQL 行锁与等待队列固定两个并发顺序，新增双向真实 HTTP 冲突回归，并补充普通错误后成功重试断言。HEAD 仍为 `6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`，修复未提交，源码快照 `wechat-password-form-r01-fix-20261018` 保存在 `.cache/password-form-r01/snapshot/`。Owner codex / ACTIVE；I001（来源 R01）为 FIXED_PENDING_REVIEW。

2026-10-17，密码表单修复：Web 登录和注册复用 Web PasswordInput，小程序绑定使用 Taro PasswordInput；默认隐藏、显示切换、禁用和错误提示由控件负责。小程序认证请求移到 `services/account-auth.ts`，普通失败保留输入，编辑清除普通错误；凭证失效或次数耗尽提供原位置重新验证，重新验证成功后等待用户再次提交。认证成功后的加载失败使用独立提示。后端第五次错误立即返回 `CREDENTIAL_ATTEMPTS_EXCEEDED`，更新次数与消费凭证在同一条条件 SQL 中完成。具体证据与未验证范围见本轮 Validation；没有执行独立审查，合并前仍须按 canonical code-review Skill 进行。

2026-10-17，M06 准备完成：用户确认目标后，在本地 Compose PostgreSQL 精确删除一条微信绑定，事务已提交；独立连接核验目标绑定为 0。原始记录备份位于 `.cache/m06-unbind-20261017/identity-backup.csv`，目录权限 700、文件权限 600，已被 Git 忽略。备份导入临时表后完整记录摘要匹配。删除事务内 users、lineups、simulations 全表内容摘要未变化；全库仍有 5 个用户、27 套阵容、47 场战报。用户自行执行真机 M06，结果待反馈；恢复原绑定须按用户后续指令执行，并处理测试产生的新绑定冲突。

2026-10-16，Codex 接手：分支 `mini-app-20261004`，HEAD `03c11587a11c28336693d64ee6f8e5d77e1a9a10`；本地 `origin/mini-app-20261004` 引用与 HEAD 一致，未查询远端实时状态。接手前仅两份交接文档未提交、验收表未跟踪，暂存区为空，与 Kimi 交接一致。当前源码的 core、Java 和 V16 用户名规则均为 2–32 字符；已核对小程序账号数据源、直接身份/详情请求、游客导入清理和生产构建地址校验。四项 OPEN 继续保留，本次没有执行新一轮审查或平台验收。`docs/AI_HANDOFF.md` 的验证结果属于 Kimi 交出时记录，本次执行结果见下方 Codex 接手验证。

2026-10-16，第八轮复核完成：I021–I023 全部 VERIFIED。两次定向后端测试各 7 项、完整后端 77 项、core 用户名 5 项与四包 typecheck 通过；每次定向运行及完整后端运行后，固定两字符及 32 字符测试值的数据库残留均为 0。细节、范围与快照见 [第八轮报告](../reviews/wechat-login-stage4/round-08-codex.md)。历史四项 OPEN 与平台验收保持原状态。

2026-10-16，第八轮输入核验：HEAD 为 `5450385`，暂存区为空，工作区有 5 个已跟踪文件修改及第六、七轮报告与验收表三个未跟踪文件。业务实现未变化，修复代码仅涉及 AuthApiTest，架构文档更新长度说明。178 个输入摘要已记录，验收表只保留摘要。测试库使用 `codex_stage4_review08_20261016`，不使用既有共享测试库。

2026-10-13，kimi 阶段 4 实施完成：基线 HEAD `b87d67f`，开始时工作区仅有四份交接与产品文档修改。本轮实现微信免密码注册登录、已有账号密码验证绑定、Web 小程序扫码确认登录、两端与数据库统一的中文用户名规则、首次导入分配新 client key 的幂等游客导入、小程序登录态数据源切换与战报类型标示。后端 63 项测试（含真实 PostgreSQL 既有库升级与全新库初始化）、前端 119 项测试、四包 typecheck、两端构建通过；另以本地真实进程启动新 JAR 对新库冒烟验证中文注册、规则拒绝、微信未配置明确报错、票据全流程与导入新键。真实微信联调与真机验收未取得凭据与设备条件，保持 NOT RUN。未提交、未推送。

实现要点：`AuthTokenIssuer` 统一 JWT 签发；`WechatAuthService` 管理 code 交换、一次性身份确认凭证（仅存摘要、过期、失败次数上限、事务内消费、成功后可识别重试）与绑定双向唯一约束；`WebLoginTicketService` 管理短期票据（票据与浏览器绑定值仅存摘要、状态机、一次性领取）；`WechatLoginClient` 以服务端配置调用 `jscode2session` 与 `getwxacodeunlimit`，会话密钥不读取、不保存。小程序 `data-store.ts` 统一游客与账号数据源，`account-store.ts` 经 API 读写并串行化写操作，草稿按账号隔离在本机；`pages/auth` 处理登录、绑定、注册、导入选择与扫码确认。Web 登录页新增扫码面板（创建票据、轮询、领取后走既有游客导入路径）。用户名规则由 `packages/core/src/username.ts`、后端 `UsernameRules` 与 V14 数据库约束保持一致。

阶段 4 产品文档所述 `GET /simulations/{id}` 私有详情接口未新增：列表响应已包含详情所需全部字段，小程序详情页直接读取列表数据。`.env.docker.example` 受工具敏感文件保护未修改；微信环境变量占位已写入 `application.yml` 与 `compose.yaml`，真实凭据不进仓库。

2026-10-13，kimi 接手核对与阶段 4 实施设计形成：按 `RECEIVE → VERIFY → ACCEPT` 核验，分支 `mini-app-20261004`、HEAD `b87d67f2eaba02f1db31abec822bda3c9f15e3bd`，四份未提交文档与交接声明一致，无暂存或未跟踪文件；四份文档最后修改时间为 19:10，交接后无变化，Codex 声明停止写入且 Owner 已释放。随后设置 Owner 为 kimi、Status 为 ACTIVE，只读核对认证、用户、游客导入、战报与小程序源码，并对运行中的 Compose PostgreSQL 执行只读 SELECT 正则探测（不修改数据）。业务代码与配置未修改。核对结论：

- 中文用户名：`AuthRequest.java` 的 `@Pattern` 与 Web `App.tsx` 登录表单的 `pattern` 属性只允许 ASCII；V7 的数据库约束 `^[[:alnum:]_-]{3,32}$` 在当前 UTF-8 库实测已接受中文、拒绝 emoji 与空格、`{3,32}` 按字符计数，但同时接受韩文与带重音拉丁字母等产品规则之外的字符。V14 删除该约束并按明确字符集重建；`varchar(32)` 与 `lower()` 唯一索引对中文无需变更；允许字符均在基本多文种平面内，字符计数与 code point 计数一致。
- 无密码账号：`users.password_hash` 可空；`AuthService.login` 已拒绝 `passwordHash()` 为空的账号，微信新账号插入空密码即不能密码登录；现有注册接口强制 `@NotBlank` 密码，微信注册使用独立请求类型；`display_name` 沿用注册时赋值用户名的现状。
- 微信绑定与 JWT：`AuthService.issue` 私有方法统一签发 HS256 JWT（sub 为 `users.id`、含 username claim、TTL 由 `app.auth.token-ttl` 配置，默认 PT8H）；微信登录、绑定、注册与扫码领取共用该签发路径；保留名与管理员判断按账号用户名执行，微信昵称不参与身份。
- 扫码票据：`SecurityConfig` 当前只放行注册、登录、健康检查、社区读取与 OPTIONS；票据创建与领取需显式加入匿名放行，确认与拒绝要求小程序会话。小程序码计划由服务端调用 `wxacode.getUnlimited` 生成，票据标识适配 scene 参数长度；个人主体可用性与同机进入方式列入 Open Questions。
- 游客导入新键：`GuestImportService` 当前以 `lineupMapper.upsert(ownerId, imported.id(), …)` 沿用游客 client key，相同键会覆盖账号已有阵容（如内置 `classic-five`）；首次导入改为服务端生成新 client key，并在同一事务重映射战报主客队引用与自定义球员 ID；重试经 `guest_imports` 主键命中既有结果，不重复创建。
- 历史战报读取：`GET /simulations?limit=30`（允许 1–100）按 owner 与 `expires_at > now()` 过滤，响应含 `engineVersion`（规则为 `v1`，AI 为 `llm:<model>`）、阵容名快照与技术统计，小程序据此标示类型且读取不触发模型调用；当前无按 ID 的私有详情接口，列表字段已覆盖详情展示，是否新增在实现时按页面需求决定。
- 前端现状：小程序 account 页仍为游客工作区展示；`packages/client` 尚无微信登录、扫码票据与账号服务接口，`config/env.ts` 已有 `MINI_API_BASE_URL` 校验；Web 登录注册与游客导入流程位于 `apps/web/src/App.tsx`。

2026-10-13，preparing handoff：交接前核验 HEAD `b87d67f2eaba02f1db31abec822bda3c9f15e3bd`、分支 `mini-app-20261004`；三份未提交文档均为当前 Codex 上一轮产品定义修改，无暂存或未跟踪文件。旧 `AI_HANDOFF.md` 指向 ZCode 的 `0688735` 和旧验收待办，已判定 stale，本轮刷新为 Kimi Code 的交接索引。产品定义保持完成；未完成的阶段 4 准备及阶段 3 保留验收设为 HANDOFF_READY，不将交接视为业务开发授权。最终交付共保留四份未提交文档，逐项归属见交接文件。

2026-10-13，阶段 4 产品定义：Git HEAD 为 `b87d67f2eaba02f1db31abec822bda3c9f15e3bd`，本轮开始时 working tree 干净。用户确认微信免密码账号、Web 小程序扫码主动确认登录并保留密码登录；微信昵称只快捷填写用户名，不新增独立昵称或头像功能。用户随后确认允许中文汉字，保持其他用户名规则。绑定数量、游客导入新键策略及本人历史 AI 战报展示范围已接受，完整规则见产品文档第 4.3、5、11 节与 D-005。本轮只修改产品文档、计划和决策；阶段 4 业务功能尚未实施，阶段 3 剩余验收保持未完成。

实现差异已核对：V1 已有 `users.display_name`，当前注册将其赋值为用户名；没有独立昵称功能。`AuthRequest` 用户名校验仍为 `^[A-Za-z0-9_-]{3,32}$`，V7 包含用户名格式约束及大小写不敏感唯一索引；允许中文的目标需要后续同步调整两端、API 和数据库约束，不修改已发布迁移。现有游客导入按 owner/client key 保存，阶段 4 要改为首次导入分配新键；现有历史接口尚需核对 AI 类型展示和私人详情读取。后续实现必须回归 Web 功能，不能将产品决定当作已完成实现。

2026-10-13，代码质量面板复验完成：用户明确确认在微信开发者工具重新扫描后，组件代码按需注入、JavaScript 压缩与 WXSS 压缩三项均显示“已通过”。本文件据此记录 PASS（用户确认），Codex 本轮未独立执行扫描；这些项目已从剩余工作移除。用户授权提交当前文档变更并推送当前分支，业务代码不变；编号 08/11/12 暂无条件与 Android 尚未验收的状态保留。

2026-10-13，验收记录同步：用户明确确认 iPhone 编号 01–06、09、10 真机验证通过，编号 07 的三项体验问题已修复；编号 08 游客离线流程、11 真实存储失败与恢复、12 战报到期与旧详情暂无验收条件，Android 尚未验收。Google Docs 原表已同步这些结果，步骤、通过标准和设备信息保留。表中设备为 iPhone 14 Pro Max、系统 26.6.2、微信 8.0.79；预览构建版本未填写，各用例的基础库及具体构建映射未提供，不将该轮 Git 基线推定为全部用例的验收版本。该轮 Git 基线为 `1e027f29ebcce53109135903bac283854419a643`，阶段 3 保持 ACTIVE。下方各轮记录保留其执行时间与范围，阶段 3 当前验收状态以本段和 Validation 的最新记录为准。

2026-10-13，卡片导航实现及验证完成：基线 `2e69eed`，开始时工作区干净。两个列表将导航绑定到卡片外层，保留原按钮，按钮与文字的点击事件通过冒泡到达同一入口。独立游客项目八项页面检查通过：正确目标 ID、单次增加一个页面、返回原列表、导航前后存储不变及战报空列表提示。105 项测试、四包 typecheck、两端构建、格式与差异检查通过，Web 主 JavaScript 和 CSS 保持一致。用户随后确认真机测试没有问题，并授权提交和推送；未提供设备、系统及基础库，不据此判定两种手机平台分别通过。此前首发置顶已提交并推送为 `2e69eed`，用户确认真机测试通过。

2026-10-13，首发展示实现及验证完成：基线 `3969134`，开始时工作区干净，分页优化已提交并推送。编辑页在初始化及 useDidShow 中读取草稿或正式阵容，将进入页面时的首发集合保存为展示状态，稳定分组后渲染；编辑期间不更新该集合，重新显示时从最新编辑状态重建，存储及开关规则保持原实现。新增四项真实磁盘回归测试，全部 105 项测试、四包 typecheck、两端构建及格式检查通过。独立游客项目在开发者工具基础库 3.17.3 验证草稿与正式阵容重新进入、页面内替换首发保持位置、选择页返回重新排序及存储保留通过；退出再进入采用真实 reLaunch 及列表按钮，系统返回手势未完成自动化验证。Web 主 JavaScript 和 CSS 与修改前完全一致。用户随后确认真机测试没有问题，并授权提交及推送；未提供设备、系统与基础库，不据此判定 iOS、Android 分别通过。

2026-10-13，分页优化完成：Git 基线 `b62fb25`，开始时工作区干净；上一 Owner 已停止写入。两个页面共用 `apps/miniprogram/src/components/PlayerBrowser.tsx`，原来的分页只替换列表，开发者工具复现翻页后搜索框位于视口上方约 1600px。现仅实际翻页在 Taro 原生渲染完成后立即滚动到搜索框所在的浏览区域起点，上方显示页码；搜索和筛选仍重置第一页，加入阵容及详情返回保留页码与位置。101 项测试、四包 typecheck、两端构建及独立游客项目真实页面验收通过；Web 主 JavaScript 和 CSS 与修改前完全一致。没有操作原项目存储或手机调试连接。用户随后确认真机测试没有问题，并授权提交及推送；未提供设备型号、系统和基础库，不据此推断 iOS、Android 分别通过。

2026-10-13，球员详情页入口调整：用户要求移除“选择阵容”按钮，并将决策写入 `docs/DECISIONS.md`。Git 基线为 `4ad9657`，开始时工作区干净，白闪记录已提交并推送。已移除小程序详情页按钮与未使用导入，决策记录为 D-004。四包 typecheck、小程序构建及格式检查通过；独立游客项目在开发者工具基础库 3.17.3 验证资料与能力值展示、按钮移除、详情返回、无效参数提示及阵容编辑与球员选择页往返，业务存储不变且无运行异常。用户已确认功能并授权提交、推送；本轮未进行手机端复验。

2026-10-13，排查记录整理：代码修复已提交并推送为 `33bf7330c7e2b0caa94224d2e6de5da74e12cc42`，文档任务开始时工作区干净。已撰写[微信小程序原生 tab 白屏闪烁排查记录](../troubleshooting/miniprogram-tab-white-flash.md)，记录复现环境、原生静态与颜色实验、背景层职责、修复和验证范围；README 已添加入口。文档格式、引用与证据核验通过。本文件继续保存任务结果和阶段 3 剩余验收。

2026-10-13，白闪继续定位：用户明确反馈根背景修改后，真机调试的四个 tab 和已打开的 tab 仍然出现白屏，并提供 `ScreenRecording_10-13-2026 14-40-18_1.MP4`。本轮定位基线为 `52a8030`，接手时有 11 个未提交文件，原 Codex 会话已 idle。此前自动化的 `switchTab` 在 SDK 内等待 3000ms，检查的是切换后的页面数据与节点，未捕获过渡帧。本轮已建立录屏检测及真机切换截图检测。用户明确要求保留原生 tab，继续定位平台问题。

本轮录屏检测与真机连接：9.24 秒、553 帧，检测出 19 个内容区域白色占比超过 80% 的帧，分为 13 段，每段连续 1–4 帧。视觉检查确认导航栏与 tabBar 保持深绿色，中间内容整块变白。用户重新连接后，官方 `cli agent start` 返回 `openedProjectWindow: false`，9420 接口实际返回 `platform: ios`、iPhone 14 Pro Max、SDK 3.17.4；工具窗口显示 iOS 26.6.2、微信 8.0.79。真机两轮四 tab 切换中页面 ID 2/3/4/5、PageMeta sid 与根子节点数量保持稳定，p6 均为 `#102b23`，未收到 exception。官方 CDP 接口返回四个页面宿主节点背景均为 `rgb(16, 43, 35)`；该接口暴露合成组件树，本项未读取真实 HTML/body 的计算样式。截图接口返回较慢，但与 `wx.switchTab` 并发发起时能捕获过渡白帧；稀疏截图未捕获白帧不能证明没有闪烁。未发现业务切 tab 清空页面的路径。证据位于 `.cache/tab-flash-followup`。

平台边界验证：增加 PageMeta 的窗口背景属性后用户仍观察到白闪；为四页 `.screen` 临时增加不透明背景与 `min-height: 100vh` 后，32 次切换仍捕获 9 张白色截图。两组内存实验均已恢复。用户授权上传开发预览后，官方 CLI 生成普通预览；用户确认普通预览仍闪白。独立原生诊断项目只包含四个原生 tab、静态文字、深色 page CSS 和 page-meta，不包含 Taro、业务逻辑或存储操作；同一 iPhone 上 32 次切换捕获 2 张内容区域完全白色截图（零起始 index 17、18，均为重复切换）。独立项目在 9433 端口运行；此前 9420 端口冲突导致的空窗口已关闭。

定位颜色实验与修复：微信[官方 WebView 背景说明](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/custom-route#webview-下的页面背景色)明确区分 page CSS、页面容器 `backgroundColorContent`、窗口 `backgroundColor` 三层，页面容器默认白色。在原生诊断项目中只给四页 JSON 增加 `backgroundColorContent: "#ff00ff"` 后，32 次切换捕获 2 张整块洋红色画面、0 张白色画面，确认切换期间暴露的页面容器层。业务项目九页现已将该字段设为 `#102b23`，四个原生 tab 和九个路径保持一致。官方将 PageMeta.rootBackgroundColor 描述为页面内容背景色，将页面 JSON 的 backgroundColorContent 描述为页面容器背景；二者底层映射和覆盖顺序未由本次定位确定。四包 typecheck、101 项测试、两端构建与格式检查通过；9/9 个构建页面 JSON 已核验。

修复后 iPhone 验证：实际业务构建在独立 9434 接口完成 64 次 tab 切换采样，以及 16 次滚动、球员详情、阵容编辑、球员选择、历史战报和战报详情的进入与返回采样，共 80 张截图未捕获白色画面，无 exception。球员列表滚动到 600px 后切换再返回仍为 600px；页面标题、路径、实际容器背景正确；测试前后游客工作区及草稿存储的 SHA-256 一致。验证完成后恢复屏幕常亮设置，原开发窗口保持原状。记录为 `.cache/tab-flash-followup/capture-fixed.json` 和 `verify-fixed-pages.json`；稀疏截图的证据范围见 Validation。用户随后扫描官方 CLI 生成的修复版本普通预览二维码，在没有调试浮层的同一 iPhone 上首次及重复切换四个 tab，明确反馈“没有白色闪烁”。用例 09 本次 iOS 白闪修复完成，Android 与阶段 3 其他未完成场景仍按 Remaining Product Work 保留。

2026-10-13，此前 PageMeta 配置验证记录：基线为 `52a8030a27a7a4eb11b29cfee80caecd8e7b7ff0`，该轮开始时工作区干净。Screen 使用 PageMeta.rootBackgroundColor 声明页面内容背景 `#102b23`，全部九个页面开启 enablePageMeta，并在 PageMeta 内保留白色导航文字、深绿色背景和品牌标题。两端构建与四包 typecheck 通过，Web JavaScript 和 CSS 的 SHA-256 与修改前一致。独立游客项目在基础库 3.17.3 上验证四个 tab 连续切换四轮、九个页面根背景、导航栏配置及编辑与详情页返回通过，未收到运行异常。本地录屏证据位于 `.cache/tab-flash-analysis`，运行验证位于 `.cache/tab-background-acceptance`，两者均被 Git 忽略。该轮未捕获真机过渡帧；当前白闪定位与真机证据见上方记录。该轮没有提交或推送。

2026-10-13：用户报告优化前真机测试用例 07“阵容规则限制”全部通过，设备型号与系统未提供。本轮已完成用户确认的三项体验优化：开关点击进入前置校验，超限显示 toast 和卡片内红色加粗原因，并重新挂载原生开关恢复原值；符合人数条件时，非激活球员设置首发同时激活，保存一次完整草稿。正式保存语义保持一致。8 项新增回归测试、全部 101 项前端测试、四包 typecheck、两端构建、格式与差异检查通过。独立游客项目在开发者工具基础库 3.17.3 上验证实际点击、开关恢复、限制优先级、红色样式、草稿保留、自动激活与保存清理通过；未清理原项目存储。Web JavaScript 和 CSS 的 SHA-256 与修改前一致。用户随后确认本轮测试没有问题并授权提交推送；未提供本轮测试设备和平台，不据此推断 iOS、Android 分别通过。

阵容开关体验优化的变更基线为 `b8791ce71c21e50891cd8ee68a46dd5cb053afb0`，分支 `mini-app-20261004`，开始时工作区干净。此前草稿提示修复已提交并推送为 `b8791ce`；开关优化涉及四个小程序实现与测试文件及本文件，已提交为 `52a8030`。ZCode 的旧 handoff 仅作为历史索引，当前状态以本文件、Git 与实现为准。

2026-10-12 真机验收发现：移除球员后直接返回时，编辑页读取草稿，列表读取正式保存阵容，人数可能不同。用户授权列表增加未保存提示并修正对战文案、编辑页统一红色加粗提示。当前修复仅涉及 `apps/miniprogram`；草稿写入成功后发布新的快照通知列表，正式数据仍由“保存阵容”更新。全部 93 项测试、四包 typecheck、两端构建与格式检查通过，Web 主 JavaScript 和 CSS 与运行中资源的 SHA-256 一致。真实设备复验尚未完成。

Codex 于 2026-10-07 接手：ZCode 的 `docs/AI_HANDOFF.md` 明确声明已停止写入，current plan 原 Owner 为 unassigned。两次 Git 核验的 HEAD 均为 `0688735b519a230172ac1aee4bffee9ab2e57c1d`，仅两份交接文档未提交、无暂存或未跟踪文件；与交接声明一致。Codex 保留原有文档内容，设置 Owner 为 codex、状态为 ACTIVE；ZCode 的 handoff 保留为上一轮交出记录，本次验证见 Validation。

交接开始时 `mini-app-20261004` 分支 HEAD 为 `4810976cf006b4bbe82506f3ab13362da3a001bc`，工作区干净。本次交接（2026-10-06）时 HEAD 为 `0688735b519a230172ac1aee4bffee9ab2e57c1d`，工作区除两份交接文档外干净。zcode 任期内完成：接管并修复四项小程序真机缺陷（页面级背景、双重转译、基础库声明 3.17.3、uuid 转译）、三项代码质量配置（`lazyCodeLoading`、发布压缩）、两项 Web 调整（移除“加入当前阵容”按钮、窄屏精简导航文案）、品牌名统一为 My Basketball GM（D-003）并归档最低基础库决策（D-002）；iOS 真机复验通过，Android 因设备缺失待验。全部改动已提交推送（`e1a883b`、`0688735`）。协议建设、文档职责及唯一 Skill 保留。小程序真实配置保持本地文件，模板与忽略规则已提交。

### Deferred Project Work

微信小程序在 `mini-app-20261004` 分支推进，产品文档为 `docs/plans/wechat-miniprogram.md`。阶段 2 已提交（`bd5b8a5`），阶段 3 开发基线为 `0c06e0f`。阶段 3 游客端代码已实现并通过业务测试、类型检查和构建。完整微信运行验收仍未完成，阶段 3 保持待验收状态。

此前交接记录显示已配置 AppID、导入开发者工具并开启服务端口；当时用户授权范围为准备交接。当前环境与授权范围见 Owner 和本轮 Validation。游客端提交为 `337fb3a`，本地配置提交为 `33361f2`，敏感信息规则提交为 `2d286c3`；历史中的 AppID 暴露记录仍须与后续凭据检查区分。

### Deferred Product Goal

阶段 3 未完成验收继续保留；阶段 4 产品选择已确认，本轮完成文档准备。后续取得业务开发授权后推进身份、扫码确认登录、联网数据和规则对战，再实施独立分享。恢复时按 `AGENTS.md` 验证接手，并确认当前用户目标与授权范围。

### Implemented Product State

- Taro 4.3.0 + React 18.3.1 + Webpack 5.91.0 小程序，独立 React 依赖与类型解析，`react-dom` 使用 Taro 的 `@tarojs/react` 渲染器，共享源码通过 Taro 编译。Web 使用自身的 React、ReactDOM 和 Vite 配置。此前本机验证使用 Node 24.18.0，容器使用 Node 22。
- 球员列表和详情：416 名球员、中文及英文搜索、位置过滤、综合评分/三分/薪资排序、每页 12 名、能力只读。九个页面包含球员列表/详情、阵容列表/编辑/选择、对战、战报列表/详情、我的；底部入口为球员、阵容、对战、我的。
- 阵容列表、编辑和球员选择：创建、名称/描述、成员增减、位置/首发/激活；人数与重复校验；逐次保存草稿与恢复；明确正式保存状态和错误。
- 初始化与草稿读取失败时提供重新读取入口；保留草稿原始内容；没有编辑时进入选择页不写入草稿；初始化执行 API 地址校验。
- 游客规则对战、战报列表与详情、最佳球员、历史快照、20 场上限与 30 天清理。
- 同步存储、平台随机 UUID、HTTP 实现；游客流程复用 core/client。阶段 3 游客端实现保持共享包和后端业务源码原状；后续 Web 交互及品牌调整见已提交记录。
- `dev:weapp`、`build:weapp`、四包 typecheck、真实磁盘存储业务测试与 Docker workspace 安装配置；Git 和 Docker 忽略 `.swc`、真实 `project.config.json` 和 `project.private.config.json`，保留配置模板。

### Remaining Product Work

- 阶段 3 剩余真机用例：编号 08 游客离线流程、11 真实存储失败与恢复、12 战报到期与旧详情暂无验收条件，保留 NOT RUN；Android 编号 01–12 尚未验收。iPhone 编号 01–06、09、10 已通过，编号 07 已修复，具体结果见最新 Validation；关闭重进、草稿恢复、后台与锁屏、对战持久化、中文输入、返回、渲染与安全区域、20 场上限及阵容快照不再列为 iPhone 未完成项。
- 最低基础库已按 D-002 定为 3.17.3；模板及 uuid 转译配置与该决策一致，2.15.0 不在支持范围。剩余兼容性验收按 3.17.3 及受支持环境执行。
- 阶段 4 已实现，审查与验收进行中：微信免密码账号及身份绑定、Web 小程序扫码确认登录与密码登录兼容、两端中文用户名校验、新键及引用重映射的幂等游客导入、登录规则对战、本人历史 AI 战报查看与会话切换；审查发现见 `docs/reviews/wechat-login-stage4/`，验收条件见产品文档第 11 节。
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

后端测试使用 `127.0.0.1:5432` 上的真实 PostgreSQL 数据库 `basketball_gm_test`，执行前确认测试数据库已启动；现有 Compose 业务数据库使用 5433 端口。游客模式运行时不需要 API 地址；`build:weapp` 生产构建必须提供 `MINI_API_BASE_URL`，缺失或产物未包含该地址时构建失败（`apps/miniprogram/scripts/verify-dist.mjs`）。

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

1. Kimi Code 先执行 `AGENTS.md` 的 Git verification，核验四份未提交文档与本轮验证范围；确认 Codex 停止写入后，将 Owner 设为 kimi、Status 设为 ACTIVE。
2. 第一个调查步骤：读取 `backend/src/main/java/com/basketballgm/auth/AuthRequest.java`、同目录 `AuthService.java` 和 `backend/src/main/resources/db/migration/V7__add_password_authentication.sql`，核对产品文档第 5 节与 D-005，记录用户名校验、无密码注册和 JWT 颁发所需变化。随后核对 `GuestImportService` 与战报接口，形成完整实现和验证计划，获得业务开发授权后实施。
3. 阶段 3 编号 08/11/12、Android 和基础库兼容性验收在条件具备时补齐，不以阶段 4 产品确认替代。
4. 阶段 5 的分享身份、可见性和有效期等剩余产品选择仍见第 12 节，未自动接受。

## Progress

2026-10-20 Round 01 consolidation complete：核验原报告全文、版本、测试日志、八类接口矩阵、数据保留和显式开启结果；重跑只读 Compose 三态检查通过。建立无新增问题的清单并更新审查入口，任务 DONE，S01–S07 继续 BLOCKED。

2026-10-20：核验当前 develop 干净；按批准方案完成实现、真实接口验证、前后端完整测试及构建。新增测试发现登录页提前返回导致缺少页脚，已修复并重跑通过。真实浏览器在 375/390/1280px 与中英文页面完成页脚、旧地址、个人阵容保存及规则对战验证；没有社区请求或页面脚本错误。Owner 继续 codex，进入独立审查前的 VALIDATING 状态。

2026-10-20 Round 11 汇总：核对 Kimi 原始报告、日志和 Reviewed Commit，重算十个文件的格式化输出及输入摘要，确认 I024 / R05 VERIFIED。24 项均 VERIFIED，代码审查维度 PASS；历史报告格式例外已获用户接受。Git 可快进合并，文档提交与 main 推送门禁尚待执行，平台验收 S01–S07 保持 BLOCKED。

2026-10-20 Round 10 汇总：核验四项独立复核证据并确认为 VERIFIED；R05 十个文件完成纯格式修复，四包类型检查通过。全仓格式检查仅剩历史归档报告失败，独立复核仍待安排，汇总 CHANGES_REQUIRED。

2026-10-20：完成 I004/I007 实现与 I016 测试迁移，新增 18 项真实 API 回归；完整前端 158 项、后端 83 项及两端构建通过。状态更新为待独立复核，保留历史报告与用户数据。以下为历史 milestone。

2026-10-19 develop 文档交付：完整前端 140 项、独立数据库完整后端 83 项和四包类型检查通过；已检查六份文档，Kimi 原文归档摘要一致。用户授权提交并推送 develop，最终提交及同步状态由 Git 核验。

2026-10-19 develop 构建：完成本地快进与分支切换；切换前后六份文档摘要一致。Web、小程序、后端 JAR 和 Web/API Docker 镜像构建完成，四包 typecheck 与独立库后端 83 项通过。更新本地验证服务并验证首页、静态资源与 API 健康接口。

2026-10-19 Round 09：原样归档 Kimi 报告并验证 SHA-256；完成四项核验和独立库真实 HTTP 探针，后端 AuthApiTest + GuestImportApiTest 共 12 项通过；更新当前状态文档。后续段落保留各历史任务当时的状态。

2026-10-19：记录用户 M01–M12、W01–W06 验收通过和 S01–S07 受阻；开始提交前验证，新增隔离测试库 `wechat_form_delivery_20261019`，不连接用户开发库。当前授权包括提交与推送分支 `mini-app-20261004`，R01 待独立复核。

2026-10-19，M12 用户验收通过：用户明确反馈“M12 测试通过了”；按其指令完成 `linktest` → `link` 微信绑定恢复，原始绑定内容和业务数据校验通过。此结论记录为用户验收结果，R01 待独立复核及其他验收状态保持不变。

2026-10-18，M11 implementation complete / automated validation complete：对战页失败提示按用户确认的两条文案处理，17 项定向测试、四包 typecheck、小程序构建、格式和差异检查通过。产物保留当前 API 地址；真机断网及恢复网络后的交互验证尚未执行，Owner 保持 codex / ACTIVE。

2026-10-18，R01 implementation complete / validation complete：修复前两种锁顺序测试中 1 项复现 409；修复后 WechatAuthApiTest 17 项全部通过。完整后端首次运行有 1 项 LLM HTTP 404，相关代码没有改动；单独复跑及保持代码不变的完整复跑通过，完整复跑为 83 项。四包 typecheck 通过。按协议记录为 FIXED_PENDING_REVIEW，等待独立复核。

2026-10-17，本轮实现与自动化验证完成：前端 132 项、后端 80 项、真实 API 小程序服务 2 项、Web 真实浏览器交互通过。小程序开发者工具在独立项目中出现连接超时和 `page node not found`，未获得完整页面交互证据；不将服务测试或构建结果作为真机验收结论。

2026-10-17，本地开发服务更新完成：Docker Web/API 镜像已重建并启动，三个服务 healthy；小程序最终产物指向现有局域网地址。开发库数量仍为 5 个用户、27 套阵容、47 场战报、0 条微信绑定，原备份保留。独立开发者工具项目和测试运行进程已关闭；测试数据库与忽略目录保留验证材料。当前状态为 ACTIVE，Owner 为 codex，继续由上述实例负责。

2026-10-17，M06 preparation complete：用户确认当前唯一微信绑定为本次目标。已备份并在带行数、账号和完整绑定摘要检查的事务中删除，提交后独立连接复核通过；备份恢复到临时表后与原记录摘要一致。业务数据保留，等待用户真机反馈。

2026-10-17，M06 investigation complete：本地 Docker 的 API 连接 `postgres:5432/basketball_gm`，小程序当前构建地址的健康接口返回成功。核验时唯一微信绑定所属账号有 0 套阵容、0 场战报；全库有 5 个用户、27 套阵容、47 场战报。身份表不存在被其他表引用的外键或自定义 trigger。

2026-10-16，takeover complete（codex）：用户确认“ZCode 已停止写入，可以接手”；重新核验 Git 与文档未发生变化后，将 Owner 设为 codex、状态设为 ACTIVE。接手写入范围仅为本计划，保留 Kimi 交接索引和用户验收表。

2026-10-16，用户真机验收记录：M01（新微信免密码创建账号）、M02（新账号自动导入游客进度）、M03（用户名规则）、M04（退出与重新登录）通过（用户明确反馈）；其余验收用例保持 NOT RUN。

2026-10-16，第八轮 validation complete / task complete：I021–I023 三项独立复核通过；更新问题清单与入口为 19 VERIFIED、4 OPEN。按用户要求本轮结束，不自动修复或启动后续轮次。

2026-10-16，第八轮 investigation complete：已读取共享协议、原始发现、第七轮修复、D-007 和 A11，核对未提交修复并固定快照。第七轮完成记录与用户交接支持本轮 Codex 串行接手。

2026-10-15，第六轮审查发现修复完成：R01 后端注册恰好两字符的中文与 ASCII 用户名并断言持久化与重复 409；R02 用例按名精确清理，同一测试库连续两次执行通过且无残留，数据库层补齐长度 1/2/32/33 与非法字符断言；R03 架构文档更新为 2–32 并引用 D-007。对应 I021–I023 标记 FIXED_PENDING_REVIEW，待 Codex 复核。记录见 `docs/reviews/wechat-login-stage4/round-07-kimi.md`；本轮未提交、未推送。

2026-10-15，小程序生产构建防呆：`build:weapp` 缺少 `MINI_API_BASE_URL` 或产物未包含该地址时构建失败（`apps/miniprogram/scripts/verify-dist.mjs`）；缺变量失败、带变量通过并确认产物含地址两条路径均已实际验证。开发 watch（`dev:weapp`）不拦截，保持游客模式本地开发能力。

2026-10-14，第五轮最终定向复核完成：输入 `wechat-stage4-round05-20261014`，CHANGES_REQUIRED；VERIFIED 16、OPEN 4，无新增问题。真实应用/数据库及磁盘验证确认 I004、I007 的剩余缺口；I016 按用户本轮明确边界恢复 OPEN，I017 的输入文档不一致保留。详见 [第五轮报告](../reviews/wechat-login-stage4/round-05-codex.md)。不自动开启下一轮。

2026-10-14，用户决定：集成测试以真实 HTTP 与真实 PostgreSQL 验证本系统行为、外部平台上游允许由本地契约服务器扮演的测试形态获接受，归档为 `docs/DECISIONS.md` D-006；审查问题 I016 记为 DISMISSED。真实微信平台验收保持独立记录。

2026-10-14，Codex 第三轮复核完成：目标 `024f7f4c472b0845928a144abd086d8cffd0bbd0`，CHANGES_REQUIRED；7 项 VERIFIED、12 项 OPEN、1 项 FIXED_PENDING_REVIEW。实际验证与缺口见 [第三轮报告](../reviews/wechat-login-stage4/round-03-codex.md)。本轮独立工作区完成报告与汇总，原工作区保持只读。

2026-10-14，用户确认 Kimi 已停止写入，Codex 接管当前工作区。重新核实 HEAD 仍为目标提交、无已跟踪差异，仅保留未跟踪验收表格后，同步第三轮报告原文及问题清单、审查入口、本计划。独立验证结果与审查版本不变；本次同步没有重新执行业务验证。

- changes committed（kimi，2026-10-14）：阶段 4 实施与审查修复已提交并推送至 `origin/mini-app-20261004`：`ad1c4fc`（共享审查流程与审查记录）、`6d82141`（阶段 4 实现与审查修复）。推送前完整运行 `npm test`（124 项）与 `mvn test`（73 项）均通过，两个待推送提交经 Gitleaks 扫描，命中项均为已核对的文案、类型声明与测试占位。
- review fixes complete（kimi，2026-10-14）：按 `.agents/skills/code-review` 流程核验 Codex 第一轮 17 项发现（`docs/reviews/wechat-login-stage4/`）。全部确认成立或部分成立后修复：浏览器绑定值移出 URL、数据源切换隔离与重试生命周期、保存期间编辑保护、401 与刷新失败同步页面状态、auth 页不随加载卸载、导入后清理游客草稿、游客进度只读查询、并发绑定幂等、过期与状态原子化、Web 领取终态与图片失败反馈、用户名汉字范围统一（V15）、战报分页与按 ID 详情、限频加固、测试边界说明、计划状态修正。后端 73 项、前端测试与四包 typecheck 通过；报告与清单更新见 Validation。
- bugfix complete（kimi，2026-10-14，登录后账号数据不刷新）：用户真机验收 M01/M02 时发现登录并导入游客进度后「我的」页显示 0 套阵容 0 场战报，进入战报页再返回才正常。定位为时序问题：`loginWithSession` 切换账号数据源时加载的是导入前的账号数据，`importGuestProgress` 绕过数据源直写服务器后快照未刷新，账号页也没有切回刷新。修复：`importGuestProgress` 成功后等待 `refreshRuntimeAsync` 再进入页面；账号页增加 `useDidShow` 刷新。新增 refreshAsync 回归测试（账号数据源经真实本地 HTTP 服务器刷新取得新数据），全部 120 项前端测试、四包 typecheck、小程序构建与格式检查通过。
- implementation complete（kimi，2026-10-13，阶段 4）：用户授权后按 Plan 第 4 节实施。后端新增 V14 迁移、微信认证与扫码票据模块；core 增加共享用户名规则；client 增加微信与票据 API；小程序新增 auth 页、账号数据源与会话切换；Web 登录页新增扫码登录。`mvn test` 63 项、`npm test` 119 项、四包 typecheck、两端构建、格式与差异检查通过；本地真实进程冒烟通过。真实微信联调待凭据与设备条件。
- takeover and stage-4 design complete（kimi，2026-10-13）：核验 Git 元数据、四份未提交文档与引用实现后接手，Owner 设为 kimi、Status 由 HANDOFF_READY 转为 ACTIVE。只读核对认证、游客导入、战报读取与小程序现状，实测现有数据库用户名约束对中文及其他字符的行为；形成阶段 4 实施设计（Plan 第 4 节）与验证计划。业务代码与配置未修改，实施待用户授权。
- handoff prepared（codex，2026-10-13）：按 canonical Skill 核验 Git 与认证、导入、小程序游客入口，刷新旧 ZCode 交接索引。已完成产品定义保留 DONE 里程碑，阶段 4 后续准备与阶段 3 保留验收设为 HANDOFF_READY；文档检查通过，Owner 释放为 unassigned，Codex 停止写入，目标接手者为 Kimi Code。
- investigation and product definition complete（codex，2026-10-13）：核对用户名与展示名字段、认证、导入及战报实现；用户确认阶段 4 四项选择及中文用户名规则。更新产品文档、计划与 D-005，保留阶段 3 剩余验收，业务代码未修改。
- validation complete（用户，2026-10-13，代码质量面板）：重新扫描后，按需注入、JavaScript 压缩与 WXSS 压缩三项均显示“已通过”；Codex 同步复验记录，保留阶段 3 未验收项。用户授权提交及推送当前文档变更。
- acceptance records updated（codex，2026-10-13）：依据用户明确反馈同步 Google Docs 和 current plan；iPhone 编号 01–06、09、10 通过，07 已修复；08/11/12 暂无条件，Android 未验收。仅更新记录，保留历史验证和阶段 3 剩余工作。
- user acceptance（2026-10-13，卡片导航）：用户确认真机测试没有问题，授权提交并推送当前分支；设备、系统及基础库未提供，保留阶段 3 其余验收项目。
- implementation and validation complete（codex，2026-10-13，卡片导航）：阵容与历史战报整张卡片均可点击，保留按钮。独立开发者工具验证背景、标题、比分与按钮点击的正确目标和单次导航，以及返回、存储保留和空列表提示；105 项测试、四包 typecheck、两端构建与格式检查通过，Web 主资源保持一致。
- user acceptance（2026-10-13，首发置顶）：用户确认真机测试没有问题，授权提交并推送当前分支。未提供设备、系统及基础库，保留开发者工具系统返回路径的自动化限制记录。
- implementation and validation complete（codex，2026-10-13，首发置顶）：仅调整小程序编辑页展示，进入或重新显示时首发置顶，组内顺序稳定，页面内开关操作保持位置。四项回归测试、全部 105 项前端测试、四包 typecheck、两端构建及开发者工具真实页面验证通过；Web 主资源保持一致，真机本项未运行。
- user acceptance（2026-10-13，分页优化）：用户确认真机测试没有问题，授权提交和推送当前分支；未提供设备与平台，不替代阶段 3 其余验收项目。
- implementation and validation complete（codex，2026-10-13，分页优化）：共用 PlayerBrowser 增加列表顶部页码，分页后等待原生渲染并立即定位到浏览区域起点。独立开发者工具验证两个页面翻页、详情返回、加入阵容位置保留及搜索边界通过；101 项测试、四包 typecheck、两端构建通过，Web 主资源 SHA-256 保持一致。
- implementation and validation complete（codex，2026-10-13，球员详情页）：移除“选择阵容”按钮及未使用导入；用户确认的入口决定记录为 D-004。四包 typecheck、小程序构建、格式及独立开发者工具页面验证通过，现有资料、返回与阵容添加入口保持正常。
- documentation and validation complete（codex，2026-10-13）：新增独立白屏闪烁排查记录，README 和 current plan 提供引用；核验本地实验数据、官方背景配置职责、修复提交和源码，文档格式与引用检查通过。设备与代码测试保留原执行记录，本轮未重新执行。
- investigation and validation complete（codex，2026-10-13，白闪修复）：录屏与原生静态项目复现白色过渡，页面容器颜色实验确认暴露层受 backgroundColorContent 控制。九页配置增加深绿色页面容器背景；iPhone 64 次 tab 切换及 16 次滚动/详情/编辑/选择/战报返回采样均无白色截图、无 exception，滚动位置和存储保留。用户确认同一 iPhone 普通预览首次及重复切换没有白色闪烁；相关 101 项测试、四包 typecheck、两端构建通过。
- configuration and simulator validation complete（codex，2026-10-13，用例 09，此前记录）：Screen 声明页面内容背景，九个页面开启 PageMeta，保留原有导航栏外观。开发者工具页面节点及编辑与详情页返回通过；两端构建与四包 typecheck 通过，Web JavaScript 和 CSS 与修改前一致；该轮未验证真机过渡帧。
- investigation complete（codex，2026-10-13）：确认人数限制缺少反馈由开关 disabled 导致，非激活球员首发同样被 disabled 阻止。用户已确认方案；范围限定小程序，人数限制在修改与草稿写入前校验，非激活球员首发同时激活。
- implementation and validation complete（codex，2026-10-13）：完成激活与首发开关体验优化，增加 8 项真实存储回归测试，全部 101 项测试与两端构建通过。独立游客项目的开发者工具页面验证通过；Web 构建产物一致。本轮手机端复验未执行，阶段 3 总体仍为 ACTIVE。
- user acceptance（2026-10-13）：用户确认本轮测试没有问题并授权提交、推送当前分支；未提供设备与平台，本条不替代阶段 3 尚未完成的其他验收项。
- implementation complete（此前产品任务）：阶段 3 游客端代码、审查问题修复及本地配置隔离已提交。
- task complete（协议任务）：`agent-handoff-protocol` 已完成并提交为 `4810976`，已推送；历史协议检查通过，业务状态完整保留。
- investigation complete（codex 交接，2026-10-05）：核验干净基线 `4810976`；原 handoff 仍引用提交前的 HEAD 和六个未提交文件，已按实际 Git 状态刷新。
- validation complete（codex 交接，2026-10-05）：四包 typecheck、21 处文档引用、Git 元数据与修改范围、格式及敏感信息检查通过；平台验收未重新执行。
- preparing handoff（codex，2026-10-05）：阶段 3 完整平台验收尚未完成，状态设为 HANDOFF_READY；Owner 释放为 unassigned，保留两份交接文档修改。
- takeover complete（zcode，2026-10-05）：按 `RECEIVE → VERIFY → ACCEPT` 核验 HEAD `4810976`、两份交接文档修改范围与阶段 3 实现（九个页面目录与 platform 层）；复跑四包 typecheck、`npm test`（21 个测试文件、91 项）、格式与差异检查全部通过，与交接声明一致，未发现 discrepancy。Owner 设为 zcode，状态 HANDOFF_READY → ACTIVE。
- implementation complete（zcode，2026-10-05，用户指令）：按用户要求移除 Web 球员详情面板的“加入当前阵容”按钮及整条死代码链（`PlayerLibraryProps.onAdd`、App 接线、`players.add` 双语文案）；加入阵容的唯一入口回到阵容编辑页的球员选择。四包 typecheck、`npm test`（91 项）、格式检查通过。改动未提交。
- implementation complete（zcode，2026-10-05，用户指令）：Web 导航在窄屏（≤900px 断点）切换为精简文案——中文“球员、阵容、对战、社区”，英文“Players、Roster、battle、Community”（battle 为用户指定的小写原文）；桌面端保持原文案。实现为按钮内同时渲染完整与精简两份文案，经 `nav-label-full`/`nav-label-compact` 类与既有断点切换可见性。新增双文案渲染测试；四包 typecheck、`npm test`（92 项）、格式检查通过。改动未提交。
- configuration complete（zcode，2026-10-06，历史窗口背景配置）：九个页面原先缺少页面级窗口配置（编译产物 `dist/pages/*/index.json` 只有 `usingComponents`），该轮全部新增 `index.config.ts`，设置 `backgroundColor`、`backgroundColorTop`、`backgroundColorBottom` 为 `#102b23` 与 `backgroundTextStyle: light`；导航栏标题继承全局配置。四包 typecheck、`npm test`（92 项）、`build:weapp`、格式检查通过；构建产物包含深色窗口背景。当时未取得过渡背景层的定位证据；页面容器层的定位见 2026-10-13 颜色实验。该轮改动随后随 `e1a883b` 提交。
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

本轮上下文差异：`AI_HANDOFF.md` 仍指向历史 mini-app 分支和密码控件任务，原 current plan 顶部仍为 main 合并任务。已按实际 Git（develop / b01c453）及用户当前授权更新当前栏目，历史记录保留；本次没有切换 Owner 或正式交接。

本轮独立审查已完成，未发现分歧或待确认缺陷。服务器部署尚未授权，实际环境如有 `FORUM_ENABLED=true`，须明确改为 false 并重新构建 Web、重新创建后端容器。报告及证据保留在本地忽略目录，跨机器可用性未验证。S01–S07 继续 BLOCKED；下方授权与未完成事项属于对应历史任务。

当前授权边界：提交推送当前 develop 文档、合并到本地 main、构建三端与完整测试；本轮不直接修改 main 代码。验证记录写入 `.cache/develop-main-local-20261020/`，以保留干净检出。历史阶段的禁止合并约束不适用于本次明确授权。

当前未完成事项：本轮文档未提交；main 推送前完整测试和全部待推送提交扫描未执行；S01–S07 等待普通小程序账号，保持 BLOCKED；微信登录网络恢复未验证。历史 `docs/reviews/wechat-password-form-20261017/round-02-kimi.md` 格式问题已获用户明确接受，不阻塞本轮复核及合并条件检查，原文保留、全仓检查仍记 FAIL。导入内容与历史 NULL 记录的行为边界见[实施记录](../reviews/wechat-login-stage4/fixes-20261020-codex.md)。

Round 11 报告计数说明：实际输出为 `total=347 match=334 mismatched=13 issues=0`，13 个差异是十个纯格式文件和三份状态文档；报告正文“其余 337 个输入文件……逐字节一致”存在计数笔误，本轮重算确认应为 334。原报告不修改，该笔误不影响格式化逐文件比较结果或 R05 关闭。报告与脚本仅在本地忽略目录保留，其跨机器可用性未验证。

以下为历史 discrepancy 和验证限制的追溯记录。已经由本轮当前摘要纠正的旧任务、HEAD、R01 状态及计数不再是当前事实；历史缺陷处理以问题清单的最新状态为准。`docs/AI_HANDOFF.md` 是 2026-10-17 的旧交接索引，本轮未交出工作，故不刷新该文件。

- 2026-10-18 完整后端测试首次运行的 LlmSimulationClientRequestBodyTest 收到 HTTP 404；单独复跑和完整复跑均通过，原因未确定。相关代码无差异，未扩展修复范围；日志保留在 `.cache/password-form-r01/`。

- S01–S07 等待用户注册普通小程序账号后验收；M01–M12、W01–W06 已按用户反馈通过，微信与 link 的绑定已按授权恢复。具体微信标识和原始绑定仅保存在本地忽略的受限备份文件中。

- 第八轮输入中的 current plan 顶部仍为第五轮，AI_HANDOFF 仍引用第四轮及旧 HEAD；第七轮新增 Progress 已读取。本轮以实际 Git 和固定快照建立复核状态，历史交接不作为当前事实；I017 不重新审查。
- 第八轮输入 issues.md 顶部为待复核状态，但状态计数仍为第五轮的 20 项；本轮收尾按全部 23 项核对当前入口和计数，历史逐项结论保留。

- 第五轮当前结论：I004 直接身份/详情请求 401 未清 runtime；I007 重试幂等结果不代表新编辑已导入，清理仍可能丢失内容；I016 前端替代本项目响应未获许可；I017 第四轮输入文档状态不一致。本轮更新当前审查状态，历史声明保留；未批准风险延期。
- 用户本轮对 D-006 的适用范围已明确：仅允许替代微信等外部平台，不包含本项目 API。D-006 的 Affected Areas 与第四轮 DISMISSED 不能扩大此授权；本轮不修改 DECISIONS.md 或历史报告。
- 下面第三轮 discrepancy 为当时输入的历史记录，当前审查版本以本文件顶部和第五轮报告为准。

- 本轮已确认 discrepancy：目标提交的计划仍有阶段 4 实施未勾选、验证“本轮 NOT RUN”、详情接口“未新增”等旧描述，与实现和历史验证冲突；目标提交的 AI_HANDOFF.md 仍声明阶段 4 未实现，审查入口仍引用未提交版本。目标版本中的文档缺陷按 I017 保留；本轮入口与清单改为绑定目标提交，历史报告及交接文件不修改。
- 工作区写入归属已解决：用户于 2026-10-14 确认 Kimi 停止写入，Codex 已接管并同步报告；未跟踪验收表格保留原样。
- 阶段 4 平台能力待真实环境核验：`wxacode.getUnlimited` 的 scene 参数长度与个人主体可用性、`jscode2session` 实际响应、手机浏览器同机进入小程序确认页的方式。票据标识已按 scene 32 字符限制设计；`GET /simulations/{id}` 未新增，列表字段已覆盖小程序详情展示。
- 登录票据有效期已实现为配置项 `WECHAT_TICKET_TTL`（默认 5 分钟），身份确认凭证为 `WECHAT_CREDENTIAL_TTL`（默认 10 分钟）。
- `.env.docker.example` 受工具敏感文件保护未修改；微信环境变量占位见 `application.yml` 与 `compose.yaml`。
- 验收表的预览构建版本与各用例基础库映射尚未填写；不由当前 Git HEAD 或此前白闪验证的 SDK 推定所有用例使用相同版本。编号 08/11/12 暂无验收条件，Android 未验收，不记录为 PASS。
- 用例 09 的本次 iPhone 白闪修复已完成验证。Android 白闪复验仍因设备缺失未执行；2026-10-06 的 iOS 记录仅为历史结果。
- 本次 iPhone 实际 SDK 为 3.17.4，最低基础库声明为 3.17.3；两者验证结果分别记录。Android 设备缺失，对应验收保留 NOT RUN，待设备就绪后执行并记录。
- Codex 已确认从可用 Skill 列表读取 canonical handoff；ZCode 于 2026-10-05 接手时未在自动发现的 Skill 列表中看到该 Skill，已显式读取 `.agents/skills/handoff/SKILL.md` 完成接手，显式引用路径可用；Kimi Code 的自动发现仍未验证。
- 阶段 4 四项产品选择及中文用户名规则已确认并实现。微信昵称快捷填写、小程序码确认流程和手机浏览器同机使用方式需核对实际平台能力；登录票据期限已实现为配置项（`WECHAT_TICKET_TTL` 默认 5 分钟，身份确认凭证 `WECHAT_CREDENTIAL_TTL` 默认 10 分钟）。阶段 5 分享选择和上线资格仍待确认。
- ZCode 记录的自动化重编译清空模拟器存储属于历史环境观察，Codex 尚未重新验证其原因及适用范围；不据此判定其余平台验收无法执行。

## Decision Candidates

none。阶段 4 账号及跨客户端数据规则已记录为 D-005，中文用户名规则经用户明确确认；此前球员详情页入口决定为 D-004。未确认分享选择仍保留在产品文档第 12 节。

## Validation

### 汇总文档交付与合并条件预检（2026-10-20）

- `git fetch origin develop main`：PASS；提交前 main、origin/main、origin/develop 均为 b01c45316643dfd2688736ea2187e89ab8cf4452，develop 为 d5b240802bbb3d8e5457ae58d97882b398f2947a。
- `git merge-base --is-ancestor origin/main develop`：PASS；`git rev-list --left-right --count origin/main...develop` 为 0 / 1。提交三份文档后需重新检查，实际结果见交付回执。
- GitHub `gh api repos/zhulin2609/my-basketball-gm/branches/main` 与 `gh api repos/zhulin2609/my-basketball-gm/rules/branches/main`：PASS，main protected=false，适用规则列表为空。
- 审查与测试依据：Kimi Round 01 PASS，报告 SHA-256 未变；同日独立验证前端 165 项、后端 84 项通过。当前业务代码与 Reviewed Commit 一致，待提交增量仅为三份状态文档，本次未重跑完整测试。
- main 合并的版本与审查条件已具备，最终工作区、远端同步和提交范围须在推送后复核；S01–S07 BLOCKED 与报告验证限制保留。向远端推送 main 之前，仍须执行仓库规定的全部测试及待推送提交扫描；本轮没有 main 推送授权。

### Round 01 审查汇总（2026-10-20）

- `git status --short --branch`、`git rev-parse HEAD` 及对 Kimi worktree 执行对应只读命令：PASS，均为 d5b240802bbb3d8e5457ae58d97882b398f2947a；原工作区开始时干净，Kimi 仅有未跟踪报告目录。
- `git diff b01c45316643dfd2688736ea2187e89ab8cf4452 d5b240802bbb3d8e5457ae58d97882b398f2947a --stat`：PASS，与报告的 22 个文件、508 行新增和 52 行删除一致。
- `shasum -a 256 .cache/review-worktrees/icp-community-round-01-kimi/docs/reviews/icp-community-disable-20261020/round-01-kimi.md`：PASS，摘要为 b0f6f499232366707acec348d2673513b556069bdf97805421a995629ad29bca；原文只读保留。
- 已读取报告全文和 `.cache/icp-round01-kimi/` 中 npm-test.log、mvn-test.log、typecheck.log、format-changed.log、build-web.log、runtime-probe.mjs、runtime-result.json、web-requests.log，并抽查后端日志：与报告一致。Kimi 独立测试为前端 31 个文件 165 项、后端 84 项通过；独立数据库为 stage4_frontend_1792489935040、icp_r1_kimi_backend_20261020、icp_r1_kimi_runtime_20261020。本轮未连接这些数据库。
- `node .cache/icp-round01-kimi/verify-compose.mjs`：PASS，在原工作区只读解析 Compose；unset/false/true 两端值均一致。`--env-file /dev/null` 引起未设置部署凭据的警告，未启动容器或读取真实凭据。
- `npm exec prettier -- --check docs/reviews/icp-community-disable-20261020/issues.md docs/REVIEW_FEEDBACK.md docs/plans/current.md`：首次 FAIL，仅新问题清单的表格格式；格式化该文档后重跑 PASS。`git diff --check`：PASS。新增报告与证据链接均指向现有文件或目录；收尾核验原始报告 SHA-256 未变，Kimi worktree 仍仅有原报告目录未跟踪，业务与测试文件相对 Reviewed Commit 无差异。
- 本轮完整测试、构建及浏览器操作：NOT RUN；本轮为文档汇总，采用上述 Kimi 同一提交的独立执行证据，未声明重新执行。
- 审查限制保留：键盘逐键测试、UI 注册/登录点击流程未执行；外链目标站内容未核对。相关代码、API 与链接行为的覆盖见原始报告。S01–S07 仍 BLOCKED，服务器部署和 DNS/HTTPS 不属于本轮范围。

### 本地验收与提交准备（2026-10-20）

- 用户反馈本地验收：PASS。依据为用户本次明确确认；与下方 Agent 执行的自动化测试和浏览器验证分别记录。
- 提交前核验：develop / b01c45316643dfd2688736ea2187e89ab8cf4452；18 个已跟踪修改及 4 个新增文件均属于本任务。忽略的 `.env`、数据库备份和 `.cache/` 不纳入提交。
- 本次提交阶段完整测试：NOT RUN；业务代码与下方前端 165 项、后端 84 项 PASS 的版本一致，本次仅补充验收和授权记录。独立审查：NOT RUN，待 Kimi Code 对提交版本执行 Round 01。
- 提交检查和实际提交结果记录于忽略目录 `.cache/icp-community-20261020/commit-receipt.md`，按实际执行结果填写；审查基线保持 b01c45316643dfd2688736ea2187e89ab8cf4452。

### 备案与社区关闭：本地服务重建（2026-10-20）

- `git status --short --branch`、`git rev-parse HEAD`：PASS，develop / b01c453，保留上一轮 18 个已跟踪修改与 4 个新增文件；没有源码增量。
- Docker context 为 `desktop-linux`，连接本机 Unix socket。忽略文件 `.env` 中 `FORUM_ENABLED` 已改为 false。
- `docker compose exec --no-TTY postgres sh -c 'pg_dump --username="$POSTGRES_USER" --format=custom "$POSTGRES_DB"' > .cache/icp-community-local-20261020/before-rebuild.backup`：PASS；通过 `docker compose exec --no-TTY postgres pg_restore --list < .cache/icp-community-local-20261020/before-rebuild.backup` 验证备份目录可读取。备份和目录清单均位于忽略目录，未输出用户数据。
- `docker compose build web api`：首次 FAIL，沙箱阻止 Buildx 写入本机状态目录；允许该构建进程写入后重跑 PASS。Web 构建包含四包 typecheck；后端按既有 Dockerfile 使用 `mvn package -DskipTests`。日志为 `build.log` 与 `build-retry.log`。
- `docker compose up --detach --no-deps --wait --wait-timeout 120 web api`：PASS，仅重新创建 Web/API，两个服务 healthy；PostgreSQL 容器 ID 与创建时间保持不变。Flyway 确认 schema version 17，无需迁移。后端实际 `FORUM_ENABLED=false`。
- `TMPDIR="$PWD/.cache/java-tmp" node .cache/icp-community-local-20261020/verify-local.mjs`：PASS，只读检查实际 8088 服务；首页、JS、CSS、健康接口均 200，社区列表接口 404。真实 Chrome 验证备案链接、导航隐藏、旧社区地址跳转和登录页页脚，页面脚本错误为空。证据为同目录 `verification.json`。
- 本轮完整测试：NOT RUN；业务代码与上轮完整前端 165 项、后端 84 项 PASS 的版本相同，本轮仅更新本地配置、构建产物、服务与本计划。未操作远端服务器，未提交或推送。独立审查仍待安排。

### 备案页脚与社区关闭（2026-10-20）

- `git status --short --branch`、`git rev-parse HEAD`：PASS；起始 develop / b01c453，工作区干净。
- 首次 `npm run typecheck`：FAIL；新增测试误用 core 的预设函数名称。改用现有 Web presets 后重跑：PASS，四包通过。
- `TMPDIR="$PWD/.cache/java-tmp" npm test -- apps/web/src/community-disabled.test.tsx apps/web/src/lib/features.test.ts apps/web/src/App.test.tsx`：首次 FAIL，发现独立登录页缺少页脚及测试选择了另一条阵容；修复后重跑 PASS，3 个文件 31 项。最终数据库 `stage4_frontend_1792487416074`，日志 `targeted-web.log`、`targeted-web-retry.log`。
- `TMPDIR="$PWD/.cache/java-tmp" npm test`：PASS，31 个文件 165 项，包含 Web、小程序、core、client。真实 Spring Boot 配合独立 PostgreSQL `stage4_frontend_1792487561717`，日志 `npm-test.log`。
- 后端命令在 `backend/` 执行：`env -u FORUM_ENABLED SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/icp_community_backend_20261020 SPRING_DATASOURCE_USERNAME=zhulin SPRING_DATASOURCE_PASSWORD= TMPDIR=/Users/zhulin/Workspace/my-basketball-gm/.cache/java-tmp mvn --batch-mode --no-transfer-progress -Djava.io.tmpdir=/Users/zhulin/Workspace/my-basketball-gm/.cache/java-tmp test`：PASS，84 项，0 failures/errors/skipped，日志 `backend-full.log`。此前同一环境增加 `-Dtest=ForumDisabledHttpTest,ForumDisabledTest,ForumApiTest,ForumModerationTest` 的定向测试 PASS，18 项，日志 `targeted-backend.log`。
- 独立后端数据库通过 `docker exec basketball-gm-test-pg createdb -U zhulin icp_community_backend_20261020` 创建。默认关闭的真实 HTTP 用例覆盖全部社区 GET/POST/DELETE、匿名和已登录状态、原有帖子及评论记录不变、注册登录、个人阵容修改与规则对战。
- `VITE_API_BASE_URL=/api/v1 VITE_FORUM_ENABLED=false npm run build`：PASS，包含四包 typecheck；Vite 保留超过 500 kB 的既有产物体积警告，日志 `build-web.log`。构建流程生成后端测试 JAR，未重建或重启用户开发容器。
- `node .cache/icp-community-20261020/verify-compose.mjs`：PASS，通过 `docker compose --env-file /dev/null config --format json` 核验未设置、false、true 时前端构建参数与后端运行值一致，并核对示例配置；结果 `compose-result.json`。没有启动 Compose 服务。
- 本次变更文件的 `npm exec -- prettier --check`：PASS；`npm run format:check`：FAIL，仅用户已接受的历史报告 `docs/reviews/wechat-password-form-20261017/round-02-kimi.md`，原文保留。日志 `format-changed.log`、`format-all.log`。
- `TMPDIR="$PWD/.cache/java-tmp" node .cache/icp-community-20261020/verify-browser.mjs`：最终 PASS；使用实际构建产物、真实 Spring Boot 与独立数据库 `icp_community_browser_1792488043350`。375/390/1280px、中英文球员库/阵容/对战/登录页的备案文字、链接、字号、键盘焦点和社区隐藏通过；旧社区列表及详情地址替换为球员库；已登录用户保存个人阵容、完成规则对战、进入 AI 设置页通过。`pageErrors=[]`、`communityRequests=[]`，证据 `browser-result.json`、`browser-verified.log`。首次 Chrome 启动受沙箱限制，扩大进程权限后执行；中间检查因脚本使用程序焦点、写入真实会话后未刷新及使用未列入现有 CORS 允许列表的端口失败，修正脚本并改用已允许的 5175 端口后通过。未修改应用 CORS 配置，未生成截图。
- `git diff --check`：PASS；HEAD 保持 b01c453，暂存区为空。
- 本轮日志和辅助脚本位于 `.cache/icp-community-20261020/`；数据库均位于测试容器 `basketball-gm-test-pg`（5432）。独立审查、服务器部署、DNS/HTTPS 配置、小程序平台验收：NOT RUN；S01–S07 保持 BLOCKED。本轮未修改小程序实现，未重新构建小程序产物。

### develop 合并与本地验证（2026-10-20）

本轮实际命令和结果保存在 `.cache/develop-main-local-20261020/receipt.md` 及同目录日志；以下 Round 11 及更早记录仅作历史证据，不代替本轮全量测试。提交时本轮构建和全量测试尚未执行，完成后按回执核验，不在 main 上直接修改代码。

### Round 11 汇总与合并条件检查（2026-10-20）

- `git status --short --branch`、`git rev-parse HEAD main origin/develop origin/main`：PASS；起始工作区干净，develop / HEAD 为 `96219f24fef340d5533e6481cefcf9adf5577005`，main 为 `787c2729a98abac1d555cebb230442cdf188f632`。
- `git ls-remote origin refs/heads/main refs/heads/develop`、`git rev-list --left-right --count main...develop`、`git merge-base main develop`：PASS；两条远端分支与本地一致，计数 0 / 32，merge-base 等于 main。
- `shasum -a 256 .cache/review-worktrees/wechat-stage4-round-11-kimi/docs/reviews/wechat-login-stage4/round-11-kimi.md .cache/stage4-fixes-20261020-final/snapshot.json`：PASS；报告 SHA-256 为 `70501c5b7cece6e8554c4a2b22bc685bbc7623087f1d8a16ba302c9e48fa7f7f`，快照为 `068362f0b860e7fce518225b6fb99ca158006f1ad2f742a2ab1773b6ea3d70c0`。
- `git -C .cache/review-worktrees/wechat-stage4-round-11-kimi rev-parse HEAD` 及 `status --short`：PASS；HEAD 等于 Reviewed Commit，仅报告本身未跟踪，其余被审文件无修改。
- `node .cache/stage4-round11-kimi/compare-hashes.mjs .cache/stage4-fixes-20261020-final/snapshot.json .cache/stage4-fixes-20261020-final/input .`：PASS；在文档更新前运行，实际输出 347 / 334 / 13 / 0，逐项确认差异集合符合范围；脚本不凭退出码判定差异是否符合要求。
- `node .cache/stage4-round11-kimi/format-compare.mjs . .cache/stage4-fixes-20261020-final/input apps/miniprogram/src/services/account-store.test.ts apps/miniprogram/src/services/guest-import.test.ts apps/miniprogram/src/services/guest-runtime.test.ts apps/miniprogram/src/services/session-recovery.test.ts apps/web/src/scan-login.test.tsx packages/client/src/api-wechat.test.ts packages/client/src/battle-service.test.ts packages/client/src/lineup-service.test.ts packages/client/src/testing/local-api-server.ts scripts/vitest-backend.ts`：PASS；Prettier 3.9.6，十个文件全部 MATCH，退出码 0。
- `npm run typecheck`：PASS；本轮重新执行四包类型检查，退出码 0。
- `npm exec -- prettier --check docs/plans/current.md docs/REVIEW_FEEDBACK.md docs/reviews/wechat-login-stage4/issues.md`、`git diff --check`：PASS；本轮三份文档格式及未提交差异无空白错误。
- `npm run format:check`：FAIL，退出码 1；本轮重新执行，唯一失败文件为用户已接受例外的 `docs/reviews/wechat-password-form-20261017/round-02-kimi.md`，不阻塞本次复核与合并条件检查。
- 读取 `.cache/stage4-round11-kimi/typecheck.log` 与 `format-check.log`：与原报告一致；Kimi 限定范围格式及 typecheck PASS、全仓 format:check FAIL，仅历史报告失败。日志为独立复核证据，非本轮命令执行结果。
- 完整前后端测试、构建、数据库验证、真机与平台验收、全部待推送提交扫描：NOT RUN；本轮为文档汇总，未连接数据库。Round 10 前端 158 项与后端 83 项 PASS 仅作为历史证据；正式推送 main 前仍执行完整门禁。

### develop 提交与推送（2026-10-20）

- `git fetch origin develop`、`git rev-list --left-right --count origin/develop...HEAD`：PASS；交付前本地与远端均为基线，计数 0 / 0。
- `npm run typecheck`：PASS；本轮重新执行四包类型检查。
- `node .cache/stage4-round10-summary/verify-format.mjs --documents-updated`：PASS；十个文件精确等于 Kimi 复核快照的 Prettier 输出，其余输入文件保持原样，三份获授权更新的状态文档除外。
- 完整前端、后端测试及构建：本次交付 NOT RUN；采用 2026-10-20 固定快照已有执行证据（前端 158 项、后端 83 项、两端构建 PASS），本轮摘要核验确认业务和测试只有已核验的格式差异。本次未以历史执行冒充重新执行。
- 暂存文件检查、敏感信息扫描、提交、推送及最终同步结果：执行回执位于上述忽略目录；当前文档在提交前记录，不预先宣称交付成功。

### 微信开发者工具登录诊断（2026-10-20）

- `node .cache/wechat-login-diagnosis-20261020/probe.cjs`：FAIL；通过官方自动化连接实际开发者工具，两轮各两次原生 `wx.login()` 均进入 success，返回 `errMsg=login:ok`、`code=undefined`。工具版本 2.02.2608080，基础库 3.17.3；未伪造微信或项目 API。
- `node .cache/wechat-login-diagnosis-20261020/recheck.cjs`：PASS（日志读取）；重启后的登录、配置等请求均出现 `response-parse-failed` / `body: undefined`，`devsync` 出现 `Failed to fetch`。只提取诊断字段，不保存凭据。
- `node .cache/wechat-login-diagnosis-20261020/chrome-network.cjs --log-net-log=/Users/zhulin/Workspace/my-basketball-gm/.cache/wechat-login-diagnosis-20261020/network-default.json`：FAIL（网络请求）；独立浏览器的真实无凭据请求返回 `net::ERR_CONNECTION_CLOSED`，网络事件记录微信 IPv6 地址的 TLS 握手失败。禁用 HTTP/2 和 QUIC 后仍失败；固定到已测 IPv4 后可建立连接，但独立页面因重复 CORS 响应头而拒绝读取，此项不等同于真实授权登录恢复。
- `lsof -nP -i6TCP:443`、`route -n get -inet6 240e:e1:a802:1::2d`、`route -n get 101.89.47.221`、`ps -axo pid,comm`：PASS（只读核验）；实际 `wechatweb` 进程通过 `fdfe:dcba:9876::1` 连接微信 IPv6 地址。IPv4 / IPv6 路由均经过 utun4；FreeGecko 的 FlClashCore 正在运行。系统 HTTP / HTTPS / SOCKS 代理关闭，TUN 路由仍然存在。
- `curl --noproxy '*' --ipv4 --connect-timeout 10 --max-time 12 -sS -o /dev/null -w 'IPv4 http=%{http_code} remote=%{remote_ip} total=%{time_total}\n' https://servicewechat.com/wxa-dev-logic/jslogin`：PASS（可达性）；HTTP 200，约 0.15 秒。请求不含登录凭据，不能据此认定微信登录通过。
- `curl --noproxy '*' --ipv6 --resolve 'servicewechat.com:443:[240e:e1:a800:120::86]' --connect-timeout 10 --max-time 12 -sS -o /dev/null -w 'IPv6 http=%{http_code} remote=%{remote_ip} total=%{time_total}\n' https://servicewechat.com/wxa-dev-logic/jslogin`：FAIL；退出码 35，`SSL_ERROR_SYSCALL`，HTTP 000，约 3.48 秒。
- 关闭 FreeGecko TUN 后的对照、真实微信登录恢复：NOT RUN。尚不能区分隧道内部转发和该路径上游 IPv6 故障；未修改系统网络、工具或业务配置。诊断回执为 `.cache/wechat-login-diagnosis-20261020/receipt.md`。

### Web 与后端本地验证服务更新（2026-10-20）

- 用户授权重新构建 Web 与后端供本地验证；保持 develop / `494c9ca5c7a45821dab2098964f5621c71b1cb53`、Owner codex / ACTIVE，既有审查状态保留。
- `VITE_API_BASE_URL=/api/v1 npm run build`：PASS；包含四包 typecheck，更新 `apps/web/dist/`。日志 `.cache/web-build-local-20261020.log`；保留现有资源体积提示。
- 在 backend 目录执行 `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home mvn --batch-mode --no-transfer-progress -Djava.io.tmpdir=/Users/zhulin/Workspace/my-basketball-gm/.cache/java-tmp package -DskipTests`：PASS；更新后端 JAR，日志 `.cache/backend-build-local-20261020.log`。测试跳过，不记为测试通过。
- `docker compose build web api`：首次 FAIL，沙箱禁止写入 Buildx activity；提升权限后 PASS。日志 `.cache/compose-build-local-20261020.log`、`.cache/compose-build-local-20261020-rerun.log`。
- `docker compose up -d --no-deps --force-recreate --wait --wait-timeout 120 api web`：PASS；Web/API 容器更新并 healthy，日志 `.cache/compose-up-local-20261020.log`。数据库容器与卷保持原样，启动时 Flyway 在本地开发库执行 V17 新增列；迁移前版本 16，迁移后 `flyway_schema_history` 为 `17|t`，服务日志确认迁移成功。
- `curl --noproxy '*' --fail --silent --show-error --max-time 10` 请求本地首页、首页实际引用的 JS/CSS 及 `http://172.17.0.210:8088/api/v1/health`：PASS；API 返回 `status: ok`，HTTP 获取的 JS/CSS 与本机构建产物分别通过 `cmp`。入口为 `http://127.0.0.1:8088/`，局域网入口为 `http://172.17.0.210:8088/`。
- 完整前后端测试、浏览器交互及真机流程：NOT RUN；本次执行构建、迁移与资源/健康检查。未修改业务源码，没有提交、推送或合并。

### WiFi 变更后小程序构建（2026-10-20）

- 用户授权按当前 WiFi 地址重新构建小程序，Owner 保持 codex / ACTIVE，阶段 4 审查状态保留。
- `ifconfig en0`、`ipconfig getifaddr en0`、`route -n get default`：PASS；提升权限后确认 en0 active，IPv4 为 `172.17.0.210`，默认路由经过 en0。普通沙箱的 networksetup/route 读取失败。
- `curl --noproxy '*' --fail --silent --show-error --max-time 10 http://172.17.0.210:8088/api/v1/health`：PASS；本机通过新局域网地址收到 `status: ok`。
- `MINI_API_BASE_URL=http://172.17.0.210:8088/api/v1 npm run build:weapp`：PASS；包含四包 typecheck、Taro 构建与产物地址校验。产物为 `apps/miniprogram/dist/`，原地址 `192.168.1.12` 已更新；日志 `.cache/mini-build-wifi-20261020.log`。保留 common.js 287 KiB 的构建体积提示。
- 真机连接：NOT RUN；本机健康检查不能证明手机到 Mac 的网络可达。未修改业务源码、开发库或服务，没有提交、推送或合并。

### Round 10 汇总与 R05 修复（2026-10-20）

- `git rev-parse HEAD`、`git status --short`、`git branch --show-current`、`git diff --cached --stat`：PASS；起始 develop / `494c9ca5c7a45821dab2098964f5621c71b1cb53`，19 M + 7 ??，暂存区为空。
- `node .cache/stage4-fixes-20261020/snapshot.mjs verify` 与 `node .cache/stage4-fixes-20261020/snapshot.mjs verify .cache/review-worktrees/wechat-stage4-round-10-kimi`：PASS；写入前原工作区及复核 worktree 各 347/347 匹配，0 删除项。快照清单 SHA-256 为 `068362f0b860e7fce518225b6fb99ca158006f1ad2f742a2ab1773b6ea3d70c0`。
- 四项证据核验：PASS；对照请求层和 runtime 会话归属、导入内容比较与本地清理条件、真实 API 转发与独立库设置、当前文档历史边界。读取原仓库 `.cache/stage4-round10-kimi/{npm-test-run2,mvn-test,format-check}.log`，确认 Kimi 前端第二轮 158 项及后端 83 项通过。报告的日志相对路径实际位于原仓库；完整测试结果属于 Kimi 独立复核，本轮未重跑。Kimi 数据库为 `stage4_frontend_1792456536948` 与 `stage4_r10_kimi_backend_20261020`；本轮未访问数据库。
- `npm exec -- prettier --write apps/miniprogram/src/services/account-store.test.ts apps/miniprogram/src/services/guest-import.test.ts apps/miniprogram/src/services/guest-runtime.test.ts apps/miniprogram/src/services/session-recovery.test.ts apps/web/src/scan-login.test.tsx packages/client/src/api-wechat.test.ts packages/client/src/battle-service.test.ts packages/client/src/lineup-service.test.ts packages/client/src/testing/local-api-server.ts scripts/vitest-backend.ts`：PASS；采用报告允许的等价 Prettier 写入，避免根 `npm run format` 固定扫描 `.` 修改历史报告。
- `node .cache/stage4-round10-summary/verify-format.mjs`：PASS；十个文件精确等于原快照的 Prettier 输出，文档更新前其余 337 个输入文件摘要一致。十个路径及前后 SHA-256 保存在 `.cache/stage4-round10-summary/format-hashes.json`。
- `npm exec -- prettier --check apps/miniprogram/src/services/account-store.test.ts apps/miniprogram/src/services/guest-import.test.ts apps/miniprogram/src/services/guest-runtime.test.ts apps/miniprogram/src/services/session-recovery.test.ts apps/web/src/scan-login.test.tsx packages/client/src/api-wechat.test.ts packages/client/src/battle-service.test.ts packages/client/src/lineup-service.test.ts packages/client/src/testing/local-api-server.ts scripts/vitest-backend.ts`：PASS；日志 `.cache/stage4-round10-summary/format-targeted.log`。
- `npm run format:check`：FAIL（exit 1）；仅历史归档文件 `docs/reviews/wechat-password-form-20261017/round-02-kimi.md` 报错，原文保留。日志 `.cache/stage4-round10-summary/format-check.log`。没有变更格式配置或忽略规则。
- `npm run typecheck`：PASS（exit 0）；core、client、web、miniprogram 四包，日志 `.cache/stage4-round10-summary/typecheck.log`。
- `npm exec -- prettier --check docs/plans/current.md docs/REVIEW_FEEDBACK.md docs/reviews/wechat-login-stage4/issues.md`、`git diff --check`：PASS。`node .cache/stage4-round10-summary/verify-format.mjs --documents-updated`：PASS，除了十个格式化文件与三份授权文档，其余输入保持原样；结束时 Kimi worktree 再次 347/347 匹配，报告 SHA-256 未变化。工作区仍为 19 M + 7 ??，暂存区为空。
- `npm test`、后端 `mvn test`、构建、真机与真实微信平台：NOT RUN；本轮只格式化，按授权沿用 Kimi 固定快照的完整测试证据；S01–S07 BLOCKED。R05 独立复核：NOT RUN，状态保持 FIXED_PENDING_REVIEW。

### I004、I007、I016 修复（2026-10-20）

- `npm test`：PASS，29 个文件、158 项；真实 Spring Boot 与独立库 `stage4_frontend_1792454135057`。日志 `.cache/stage4-full-final.log`。
- 后端完整 `mvn test`：PASS，83 项，含 WechatAuthApiTest 17 项；独立库 `stage4_backend_fix_20261020`。日志 `.cache/stage4-backend-full.log`。
- `npm run typecheck`、`npm run build`、带当前局域网地址的 `npm run build:weapp`：PASS；两端构建各自再次执行四包类型检查。
- 首轮定向测试 FAIL：15 PASS、2 FAIL；四包类型检查前两次 FAIL。实际原因、修正和日志见[实施记录](../reviews/wechat-login-stage4/fixes-20261020-codex.md)。
- 微信真实上游、iOS/Android 真机流程与 S01–S07：本轮 NOT RUN。自动化通过不等于平台验收或独立审查通过。

以下为历史验证，不能作为本轮执行结果。

### develop 文档交付与完整测试（2026-10-19）

以下为本轮实际运行结果，被测业务代码为 `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`；本轮后续仅修改文档。

- `docker exec basketball-gm-test-pg createdb -U zhulin develop_delivery_20261019`：PASS；本轮独立 PostgreSQL 数据库。
- `npm test`：PASS；27 个测试文件、140 项测试，日志 `.cache/develop-delivery-20261019/frontend-test.log`。
- 在 `backend` 执行 `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/develop_delivery_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp --batch-mode --no-transfer-progress test`：PASS；83 项，0 failures/errors/skipped，日志 `.cache/develop-delivery-20261019/backend-test.log`。真实 Spring Boot 与 PostgreSQL；微信上游按 D-006 使用现有契约服务。
- `npm run typecheck`：PASS；四包类型检查，日志 `.cache/develop-delivery-20261019/typecheck.log`。
- `.cache/security-audit/tools/gitleaks git --redact --no-banner --config .cache/security-audit/audit.toml --log-opts=787c2729a98abac1d555cebb230442cdf188f632..HEAD --report-format json --report-path .cache/develop-delivery-20261019/outgoing-initial.json`：自动扫描 FAIL（退出码 1，33 条匹配）；逐条核验，32 条为测试常量、类型定义、变量赋值、样式或文案，未发现真实凭据；1 条为历史公开 AppID，位于 `337fb3a` 的 `apps/miniprogram/project.config.json:7`。该文件已由 `33361f2` 移出追踪，历史提交已存在于 origin/mini-app-20261004。保留此已知历史记录，不修改扫描规则或允许名单。提交后按完整范围再次扫描。
- 真实微信、真机及 S01–S07：NOT RUN；本轮执行现有自动化套件，不替代平台验收，不改变 I004、I007、I016、I017 的状态。前端既有测试中的 I016 验证方式问题仍为 OPEN。

### 本地 develop 合并与构建（2026-10-19）

日志目录：`.cache/develop-build-20261019/`。源分支 HEAD 为 `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`；合并前 develop 为 `787c2729a98abac1d555cebb230442cdf188f632`。日志与构建产物均为 Git 忽略内容。

- `git ls-remote origin refs/heads/develop refs/heads/mini-app-20261004`：PASS；远端分支分别与上述提交一致。`git merge-base --is-ancestor develop mini-app-20261004`、`git rev-list --left-right --count develop...mini-app-20261004`：PASS，祖先关系成立，差异 0/30。
- `git fetch --no-write-fetch-head . refs/heads/mini-app-20261004:refs/heads/develop` 后执行 `git switch develop`：PASS；以 Git 非强制 refspec 完成本地快进，当前检出 develop。此方法保留工作区未提交文档，无 stash、回滚或额外提交。`shasum -a 256 -c .cache/develop-build-20261019/documents-before.sha256`：PASS，切换前后六份文档完全一致；随后仅更新 current plan。
- `ipconfig getifaddr en0`、`route -n get default`：普通沙箱读取失败，提升权限后 PASS，当前 en0 IPv4 为 `192.168.1.12`。
- `npm run build`：PASS；包含四包 typecheck，产物 `apps/web/dist/`；日志 `web-build.log`。保留既有主资源超过 500 kB 提示。
- `MINI_API_BASE_URL=http://192.168.1.12:8088/api/v1 npm run build:weapp`：PASS；包含四包 typecheck、Taro 构建与 verify-dist，产物 `apps/miniprogram/dist/`，实际包含指定地址；日志 `mini-build.log`。保留既有 common.js 286 KiB 提示。
- `docker exec basketball-gm-test-pg createdb -U zhulin develop_build_20261019`：PASS。后端测试使用该独立 PostgreSQL 数据库（测试容器 5432），不使用用户开发库。
- backend 目录执行 `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/develop_build_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp --batch-mode --no-transfer-progress package`：PASS；83 项，0 failures/errors/skipped，生成 `backend/target/basketball-gm-api-0.0.1-SNAPSHOT.jar`；日志 `backend-package.log`。
- `docker compose build web api`：首次 FAIL，沙箱禁止写入 Docker Buildx activity；提升权限重跑 PASS，日志 `compose-build.log`、`compose-build-rerun.log`。Dockerfile 后端打包跳过测试，测试证据使用上述本机完整 83 项。
- `docker compose up -d --no-deps --wait --wait-timeout 120 api web`：PASS；本地 API 容器更新，日志 `compose-up.log`。随后执行 `docker compose up -d --no-deps --force-recreate --wait --wait-timeout 60 web`：PASS，确保 Web 容器使用本轮镜像，日志 `compose-web-refresh.log`；二者均 healthy。未重建数据库容器、未执行用户账号或绑定数据操作。
- `docker inspect` 容器 Image 与 `docker image inspect` 本地镜像 Id：PASS，两项均匹配本轮构建镜像。
- `curl --fail --silent --show-error --max-time 10` 验证 `http://127.0.0.1:8088/`、首页实际引用的 JS/CSS：PASS，均 HTTP 200；`http://192.168.1.12:8088/api/v1/health`：PASS，status=ok。
- 前端完整测试及真机交互：NOT RUN，本轮无业务代码修改；本次构建与 HTTP 冒烟不替代 I004/I007 修复验证及平台验收。I016 涉及的预设项目 API 响应测试未重跑。
- `node node_modules/prettier/bin/prettier.cjs --check docs/plans/current.md`、`git diff --check`：PASS。收尾 `git branch --show-current` 为 develop；`git rev-list --left-right --count develop...mini-app-20261004` 为 0/0，`origin/develop...develop` 为 0/30。业务代码与保护文件差异为空；未提交文件仍为此前六份文档，本轮仅更新其中的 current plan。

### 第九轮归档与核验（2026-10-19）

- 版本：`86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`；独立数据库 `stage4_recheck_20261019`，测试容器 `basketball-gm-test-pg`，端口 5432。用户开发库未连接。辅助文件与日志位于 `.cache/stage4-recheck-20261019/`。
- `shasum -a 256` 校验归档报告及 Kimi 原文：PASS，摘要一致；`git diff ba80e115f72c48d81ded5d85fb607256f45361bb HEAD --stat`：PASS，只有验收表增量。
- `docker exec basketball-gm-test-pg createdb -U zhulin stage4_recheck_20261019`：PASS。Spring Boot 首次启动因未提供 JWT_SECRET 失败；补充独立进程临时密钥后启动 PASS。首次探针在服务就绪前连接失败，健康检查后重新运行 PASS；失败日志保留。
- `node .cache/stage4-recheck-20261019/run-probe.mjs`：PASS，断言确认 I004、I007 仍存在；业务判定 FAIL。使用真实项目 client/runtime/store 模块、磁盘存储、Spring Boot HTTP 与 PostgreSQL，未预设项目 API 返回值。完整 Taro 页面流程 NOT RUN。
- 在 backend 执行 `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/stage4_recheck_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=AuthApiTest,GuestImportApiTest test`：PASS，12 项，0 failures/errors/skipped。
- PostgreSQL `SELECT current_database(), name FROM lineups WHERE name LIKE 'r09_%'`：PASS，只有首次导入的 `r09_initial_import`，重试的新编辑未入库。
- 完整前后端测试、typecheck、构建、真机：NOT RUN，本轮没有业务代码或既有测试修改；I016 涉及的预设项目响应测试没有重跑。Kimi 全量验证属于独立报告中的历史执行，未计为本轮执行。
- 实际命令、环境失败、文档验证、资源收尾和覆盖边界统一记录于[第九轮报告](../reviews/wechat-login-stage4/round-09-codex.md)。下方为以前任务的验证记录。

### 提交前完整验证与用户验收记录（2026-10-19）

本次增量基线为 `6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`；日志位于 Git 忽略目录 `.cache/delivery-20261019/`。修改文件为小程序 `constants/text.ts`、`constants/text.test.ts`、`platform/battle-error.ts`、`pages/battle/index.tsx`，后端 `WechatAuthService.java`、`WechatAuthApiTest.java`，以及本计划、审查入口、本任务问题清单。

- `docker exec basketball-gm-test-pg createdb -U zhulin wechat_form_delivery_20261019`：PASS；新建本轮独立 PostgreSQL 数据库，端口 5432，未连接用户开发库。
- 在 `backend` 执行 `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/wechat_form_delivery_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=WechatAuthApiTest test`：PASS；17 项，包含真实 Spring Boot HTTP 与 PostgreSQL 两种并发顺序。日志 `backend-targeted.log`。
- 在 `backend` 执行 `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/wechat_form_delivery_20261019 mvn -Djava.io.tmpdir=../.cache/java-tmp test`：PASS；完整后端 83 项，0 failures/errors/skipped。日志 `backend-full.log`。
- `npm test`：PASS；27 个文件、140 项。日志 `frontend-test.log`。
- `npm run build`：PASS；包含四包 typecheck 与 Web 构建，保留现有资源体积警告。日志 `web-build.log`。
- `ifconfig en0`：PASS；当前 IPv4 为 `192.168.1.12`。`MINI_API_BASE_URL=http://192.168.1.12:8088/api/v1 npm run build:weapp`：PASS；包含四包 typecheck、Taro 构建与产物地址校验，保留现有 common.js 286 KiB 提示。日志 `mini-build.log`。
- `node node_modules/prettier/bin/prettier.cjs --check` 指定上述四个前端文件和三份 Markdown：PASS；`git diff --check`：PASS。
- `shasum -a 256 -c .cache/delivery-20261019/preserved.sha256`：PASS；AGENTS.md、用户验收表、M06/M12 身份备份及 Kimi Round 01 报告与本轮开始时一致。
- `.cache/security-audit/tools/gitleaks git --redact --no-banner --config .cache/security-audit/audit.toml --pre-commit --report-format json --report-path .cache/delivery-20261019/secrets-unstaged.json`：FAIL（退出码 1，两个规则匹配）；人工核验 PASS，两处均为 `WechatAuthApiTest` 三元表达式中的测试密码，账号由测试在隔离数据库中创建，不是真实账号凭据。扫描规则及允许名单未修改。
- 同一 Gitleaks 命令增加 `--staged`，报告保存为 `secrets-staged.json`：FAIL（相同两处匹配）；完整暂存差异人工核验 PASS，九个文件均属于当前授权范围，未包含真实凭据、验收表或备份。推送前继续按 `origin/mini-app-20261004..HEAD` 扫描全部待推送提交，结果以本地 `secrets-outgoing.json` 和 Git 推送核验为准。
- 用户平台验收反馈：M01–M12、W01–W06 PASS；S01–S07 BLOCKED，等待注册普通小程序账号。本轮 Agent 真机验收、S01–S07 及 R01 独立复核：NOT RUN。测试账号与实际微信平台的能力差异不能由本轮自动化测试消除。

### M12 验收后恢复 link 绑定（2026-10-19）

- M12 平台验收：PASS（用户明确反馈，未由 Agent 另行执行真机测试）。用户授权恢复原绑定，目标为本地 Compose 开发库 `basketball_gm`；原始备份 `.cache/m12-link-to-linktest-20261019/identity-backup.json` 保留原状。
- `node .cache/m12-link-to-linktest-20261019/restore.mjs`：PASS；事务内锁定身份表，核对原始备份摘要、当前 `linktest` 绑定的完整身份字段及账号归属，确认 `link` 无冲突绑定后精确更新 1 行并 COMMIT。恢复后完整行与备份一致，其他身份记录以及 users、lineups、simulations 内容摘要未变。日志：同目录 `restore.log`。
- `docker compose exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < .cache/m12-link-to-linktest-20261019/inspect.sql`：PASS；恢复前后独立连接核验，`link` 微信绑定由 0 条恢复至 1 条，`linktest` 由 1 条变为 0 条。`link` 保留 7 套阵容、12 场战报；`linktest` 保留 4 套阵容、15 场战报。
- `git diff --check`：PASS。恢复后的手机重新登录：NOT RUN；未更改用户验收表、业务代码或已有会话，未提交、推送。Owner 继续 codex / ACTIVE。

### M12 当前微信由 link 转绑 linktest（2026-10-19）

- 目标核验：`docker compose ps`、`docker compose exec -T api printenv DB_URL`：PASS；本地运行 API 使用 Compose `postgres` 的 `basketball_gm` 开发库，宿主端口 5433。
- `docker compose exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < .cache/m12-link-to-linktest-20261019/inspect.sql`：PASS；独立连接前后核验，`link` 的微信绑定从 1 条变为 0 条，`linktest` 从 0 条变为 1 条。`link` 保留 7 套阵容、12 场战报；`linktest` 保留 4 套阵容、15 场战报。
- `umask 077` 后执行 `docker compose exec -T postgres sh -c 'psql -X -qAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < .cache/m12-link-to-linktest-20261019/backup.sql > .cache/m12-link-to-linktest-20261019/identity-backup.json`：PASS；保存完整原绑定行、摘要及目标账号 ID。目录权限 700、备份权限 600，位于 Git 忽略目录，历史备份未覆盖。
- `node .cache/m12-link-to-linktest-20261019/rebind.mjs`：PASS；事务内锁定身份表，核验原行与备份一致、目标账号无微信绑定且无自定义触发器，仅更新 1 条身份行的账号归属后 COMMIT。其他身份字段、其他身份行及 users、lineups、simulations 全表内容摘要未变。日志：同目录 `rebind.log`。
- `git diff --check`：PASS。小程序退出 A 后登录 B 的真机行为：NOT RUN，等待用户执行 M12；本次没有修改业务代码、撤销已有会话、提交或推送。Owner 继续 codex / ACTIVE。

### 更换 WiFi 后重新构建（2026-10-19）

- 用户授权重新构建小程序并说明手动构建命令。`ifconfig en0`：PASS，当前 IPv4 为 `172.17.0.110`，接口 active；旧产物地址为 `172.17.11.117`。`ipconfig getifaddr en0`：FAIL，当前执行环境返回 `ipconfig_server_port failed`，IP 由上述 ifconfig 核验。
- `curl --noproxy '*' --fail --silent --show-error --connect-timeout 3 --max-time 10 http://172.17.0.110:8088/api/v1/health`：PASS，电脑侧返回 `status: ok`。
- `MINI_API_BASE_URL=http://172.17.0.110:8088/api/v1 npm run build:weapp`：PASS，包含四包 typecheck、Taro 构建和产物校验；`apps/miniprogram/dist/common.js` 中 API 地址已核验为新地址。日志：`.cache/mini-build-wifi-20261019.log`，保留现有体积提示。
- `git diff --check`：PASS。手机网络互通和真机验收：NOT RUN。业务代码、开发库和既有修改保留，Owner 继续 codex / ACTIVE，R01 独立复核状态保持不变。

### M11 对战失败提示（2026-10-18）

- 修改：`apps/miniprogram/src/pages/battle/index.tsx`、`apps/miniprogram/src/constants/text.ts`，新增 `apps/miniprogram/src/platform/battle-error.ts` 和 `apps/miniprogram/src/constants/text.test.ts`。网络状态查询仅发生在对战失败后，不以 `getRandomValues:fail` 推断断网，不更改主客队选择。相对增量基线 `6c1d1ba`，按钮文案由“开始规则对战”改为“开始对战”，随 `ba80e11` 提交。
- `npm test -- apps/miniprogram/src/constants/text.test.ts packages/core/src/simulator.test.ts packages/core/src/lineup-validation.test.ts`：PASS；3 个文件、17 项测试，其中 8 项验证断网、各联网类型、unknown 与无法获得网络状态时的提示。测试直接调用纯函数及真实比赛规则，未替换平台或项目 API。
- `MINI_API_BASE_URL=http://172.17.11.117:8088/api/v1 npm run build:weapp`：PASS；包含四包 typecheck、Taro 构建及产物地址校验。日志：`.cache/m11-battle-error-build-20261018.log`。保留现有 common.js 286 KiB 体积提示。
- `npx prettier --check apps/miniprogram/src/constants/text.ts apps/miniprogram/src/constants/text.test.ts apps/miniprogram/src/platform/battle-error.ts apps/miniprogram/src/pages/battle/index.tsx`：首次 FAIL（新表达式换行格式），手动修正后 PASS；`git diff --check`：PASS。
- `lsof -nP -iTCP:9420 -sTCP:LISTEN`：未发现自动化端口监听。开发者工具断网交互、真实平台网络查询失败分支及 iPhone M11：NOT RUN；纯函数测试和构建不代表这些平台场景已通过。后端测试：NOT RUN，本次未修改后端代码或操作数据库。

### M06 恢复账号 A 绑定（2026-10-18）

- 用户明确授权恢复微信与账号 A（`link`）的绑定。目标仍为本地 Docker Compose 开发库 `basketball_gm`；使用 `.cache/m06-link-unbind-20261018/identity-backup.json`，历史备份保留原状。
- `node .cache/m06-link-unbind-20261018/restore.mjs`：PASS；事务内锁定身份表，核对备份摘要与账号归属，确认不存在冲突记录后恢复完整原始记录并 COMMIT。恢复行与备份完全一致，users、lineups、simulations 全表内容及其他身份记录摘要未变。日志：同目录 `restore.log`。
- `docker compose exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < .cache/m06-link-unbind-20261018/inspect.sql`：PASS；恢复前后独立连接核验，账号 `link` 微信绑定由 0 条恢复至 1 条，3 套阵容、6 场战报保持不变。
- M06 真机冲突结果：NOT RUN；等待用户在当前绑定表单输入另一个账号 B 的正确凭据并提交，核验冲突提示。此次未修改业务代码，未提交、推送或合并。

### M06 账号 link 临时解绑（2026-10-18）

- 目标为 Docker Compose `postgres` 服务的开发库 `basketball_gm`，宿主端口 5433；本次操作属于上述明确授权的真机验收数据准备。
- `docker compose exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < .cache/m06-link-unbind-20261018/inspect.sql`：PASS；删除前后分别使用独立连接核验，`link` 微信绑定从 1 条变为 0 条，密码配置存在，3 套阵容、6 场战报保持不变。身份表没有被其他表引用的外键和自定义触发器。
- `umask 077` 后执行 `docker compose exec -T postgres sh -c 'psql -X -qAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < .cache/m06-link-unbind-20261018/backup.sql > .cache/m06-link-unbind-20261018/identity-backup.json`：PASS；保存完整绑定行及摘要，目录权限 700，备份权限 600，位于 Git 忽略目录。未在文档或输出中记录身份字段值。
- `node .cache/m06-link-unbind-20261018/unbind.mjs`：PASS；校验备份字段与权限，锁定身份表后核对数据库行摘要，精确删除 1 条并 COMMIT。事务内核验 users、lineups、simulations 全表内容摘要和其他身份记录未变。日志为同目录 `unbind.log`。
- 初始只读查询使用 `lineups.user_id`：FAIL，实际字段为 `owner_id`；修正查询后执行上述检查，该失败没有修改数据库。
- M06 真机冲突验收及恢复绑定：NOT RUN；下一步由用户退出已有登录状态，进入「已有账号，去绑定」表单并停留，随后再按用户指令恢复备份。历史账号绑定备份、验收表、报告及业务代码保留原状。

### 更换 WiFi 后重新构建（2026-10-18）

- 当前 WiFi 接口 en0 地址为 `172.17.11.117`；`curl --fail --silent --show-error --connect-timeout 5 --max-time 10 http://172.17.11.117:8088/api/v1/health`：PASS，电脑侧返回 `status: ok`。
- `MINI_API_BASE_URL=http://172.17.11.117:8088/api/v1 npm run build:weapp`：PASS，含四包 typecheck、Taro 构建及产物地址检查。`dist` 的 API 地址已替换为当前地址，保留 common.js 286 KiB 的体积提示。日志：`.cache/password-form-r01/mini-build-starbucks-20261018.log`。
- 手机扫码后访问、公共 WiFi 设备互通与 M06 真机验收：NOT RUN。M06 可通过“手机停留绑定表单 → 后台恢复已备份的账号 A 绑定 → 手机提交账号 B 正确密码”顺序触发；此处仅说明操作方式，未执行数据库准备。R01 后端修复未部署到本地运行服务，仍使用原服务镜像。

### R01 修复（2026-10-18）

完整命令、版本、两个锁顺序的断言及局限见[任务问题记录](../reviews/wechat-password-form-20261017/issues.md#实际验证2026-10-18)。数据库由本轮单独创建：`password_form_r01_20261018`（复现及定向）和 `password_form_r01_full_20261018`（完整测试）；运行于测试容器的 5432 端口，未连接用户开发库。

- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r01_20261018 mvn -Djava.io.tmpdir=../.cache/java-tmp '-Dtest=WechatAuthApiTest#realHttpFifthWrongAttemptLocksBeforeCorrectRequest+realHttpCorrectRequestLocksBeforeFifthWrongAttempt' test`（backend）：FAIL（修复前预期复现）；2 项中 1 项失败，期望 400、实际 409。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r01_20261018 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=WechatAuthApiTest test`（backend）：PASS；17 项。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_r01_full_20261018 mvn -Djava.io.tmpdir=../.cache/java-tmp test`（backend）：首次 FAIL（83 项中 1 error）；未改动的 LLM 请求体测试收到 HTTP 404，R01 相关 17 项通过。保持代码不变完整复跑 PASS，83 项，0 failures/errors/skipped。
- 同一完整测试库执行 `mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=LlmSimulationClientRequestBodyTest test`：PASS；1 项，使用同一 SPRING_DATASOURCE_URL。
- `npm run typecheck`：PASS；四包。前端测试和两端构建 NOT RUN，本轮未修改前端。
- 两个本轮数据库的微信测试用户、身份与凭证清理计数：PASS；均为 0。
- 三份本轮状态文档的 Prettier 检查、`git diff --check`、受保护文件与代码快照的 `shasum -a 256 -c`：PASS；文档格式、保留文件与验证版本一致。
- 真实微信平台、开发者工具、真机、M06 页面流程、独立复核：NOT RUN。后端测试不代替平台验收。

### 密码输入与绑定错误处理（2026-10-17）

- `npm test`：PASS；26 个文件、132 项测试，包含新增 4 项 PasswordInput 交互测试。既有 App 测试的密码标签查询改为完整匹配，以区分输入框和新增显示按钮。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_20261017 mvn -Djava.io.tmpdir=../.cache/java-tmp -Dtest=WechatAuthApiTest test`（backend）：PASS；14 项，包含新增 3 项真实 HTTP 测试，验证错误后正确重试、最后一次失败立即耗尽、换新凭证成功及并发次数上限。
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/password_form_regression_20261017 mvn -Djava.io.tmpdir=../.cache/java-tmp test`（backend）：PASS；80 项。两个数据库均为本轮单独创建，未使用用户开发库。
- `npm exec vitest run -- --config .cache/password-form/vitest.config.mts`：PASS；2 项。直接调用实际小程序认证服务与 client，通过运行中的 Spring Boot 和 PostgreSQL 验证密码错误、耗尽、无效凭证、成功与冲突；网络失败使用真实不可达地址。外部微信接口使用已授权的合同验证服务，项目 API 未被替代。
- `node .cache/password-form/verify-web.mjs`：PASS；独立 Chrome，实际点击显示按钮后保留值、焦点及选区；390px、1280px 视口有效点击范围至少 44px，无水平溢出；注册复用同一控件并默认隐藏。没有截图或视觉分析。
- `npm run build`：PASS；包含四包 typecheck 与 Web 构建。既有资源体积提示保留。
- `MINI_API_BASE_URL=http://192.168.1.12:8088/api/v1 npm run build:weapp`：PASS；包含四包 typecheck、Taro 构建与产物 API 地址检查。原项目最终产物指向本地真机验收服务；独立自动化项目保留单独的测试 API 产物。
- 新增/修改 TypeScript、TSX 与样式的 Prettier 检查、`git diff --check`：PASS。
- `node .cache/password-form/verify-mini.cjs`：FAIL（测试环境）；独立开发者工具项目出现 `timeout waiting for automator response`、`page node not found`，未完成表单交互断言。早期一次域名检查失败已在独立项目关闭域名校验后排除，原项目配置未修改。
- iOS/Android 真机键盘、选区、M06 复验、独立代码审查：NOT RUN。用户原微信绑定未恢复；原备份继续保留。
- 本轮辅助脚本及日志位于 Git 忽略的 `.cache/password-form/`，仅当前机器存在；持续回归测试保存在 Web PasswordInput 测试与后端 WechatAuthApiTest。
- `docker compose build api web`、`docker compose up -d --no-deps --wait --wait-timeout 60 api web`、`docker compose ps`：PASS；本地开发镜像已更新，三个服务 healthy。首次等待 90 秒超时；日志确认 API 正常完成启动、无需迁移，随后启动 Web 成功。
- `node .cache/password-form/verify-running.mjs`：PASS；运行镜像与本次构建一致，局域网 API 健康检查成功，Web 实际资源包含密码控件。
- 开发库更新前后只读计数查询：PASS；均为 users 5、lineups 27、simulations 47、user_identities 0。没有恢复原微信绑定。

### M06 准备核验（2026-10-17）

- `docker context show`、`docker compose ps`、`docker compose exec -T api printenv DB_URL`：PASS；本地 Docker Desktop，三个服务 healthy，API 连接 Compose 内的 PostgreSQL 数据库。
- 构建产物 API 地址检查及 `curl --fail --silent --show-error --max-time 10 http://192.168.1.12:8088/api/v1/health`：PASS；当前构建地址与本地验收服务一致，健康接口返回 `status: ok`。
- `docker compose exec -T postgres` 内通过 `psql -X -v ON_ERROR_STOP=1` 执行身份与账号关联、业务数量及 `pg_constraint` / `pg_trigger` 只读查询：PASS；结果见本次 Progress，无数据库写入。
- `COPY ... TO STDOUT WITH (FORMAT csv, HEADER true)` 导出目标绑定、Python `csv.DictReader` 核验及 `chmod 600`：PASS；一条完整目标记录已保存到受限备份文件。
- `docker compose exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < .cache/m06-unbind-20261017/unbind.sql`：PASS；事务精确删除一条匹配原摘要的绑定，账号与业务内容摘要保持一致，COMMIT 成功。
- 独立 `psql` 连接使用 `\copy` 将备份导入临时表并比对摘要：PASS；`backup_exact_match = true`，目标绑定剩余 0，未恢复持久绑定。
- `git check-ignore .cache/m06-unbind-20261017/identity-backup.csv .cache/m06-unbind-20261017/unbind.sql`、文档 Prettier 及 `git diff --check`：PASS；备份及辅助 SQL 被忽略，文档格式和差异检查通过。
- 持久恢复原绑定、真机 M06：NOT RUN；用户自行进行真机验证，恢复等待后续指令。本次未修改业务代码，不重复执行业务测试或构建。

### Codex 接手验证（2026-10-16，HEAD `03c1158`）

- `git status --short --branch --untracked-files=all`、`git branch --show-current`、`git rev-parse HEAD`、`git log -3 --oneline`、`git diff --stat`、`git diff`、`git diff --cached`：PASS；Git 与交接声明一致，确认用户答复后重新核验状态、HEAD、文档差异和暂存区。
- `git rev-list --left-right --count HEAD...origin/mini-app-20261004`：PASS；结果为 `0 0`，仅证明本地引用一致。
- `git ls-files --error-unmatch`（规则、handoff Skill、架构、决策、两份交接文档、issues 及第五/八轮报告）：PASS；接手所需文件均存在且已跟踪。
- `npm run typecheck`：PASS；本次接手核验期间执行，core、client、web、miniprogram 四包通过。
- `node node_modules/prettier/bin/prettier.cjs --check docs/AI_HANDOFF.md docs/plans/current.md`、`git diff --check`：PASS；接手文档格式与差异检查。
- `npm test`、`mvn test`、两端构建及真实微信/设备验收：NOT RUN；本次仅接手和更新任务状态，历史结果保留原归属。

Codex 第八轮最终定向复核（2026-10-16，快照 `wechat-stage4-round08-20261016`）：

- `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/codex_stage4_review08_20261016 mvn test -Dtest=AuthApiTest`（backend；第二次使用 `mvn -f backend/pom.xml`）：PASS；同一独占数据库连续两次各 7 项通过。
- 同一数据库 `mvn test`（backend，带上述环境变量）：PASS；77 项，0 failures/errors/skipped。
- 每次定向测试及完整后端测试后执行 `.cache/code-review-round08/check-cleanup.sql`：PASS；三次固定测试值残留均为 0，Flyway V16 success=true。
- `node node_modules/vitest/vitest.mjs run packages/core/src/username.test.ts --maxWorkers=1`：PASS；5 项。
- `npm run typecheck`：PASS；四包。
- 前端完整测试、两端构建及真实微信/扫码/设备验收：NOT RUN；本轮只涉及 Java 测试与文档，历史验证不计为本轮结果。
- 快照、格式、差异与引用检查及独立数据库清理见 [第八轮报告](../reviews/wechat-login-stage4/round-08-codex.md)。

Codex 第五轮最终定向复核（2026-10-14，快照 `wechat-stage4-round05-20261014`）：

- `npm run typecheck`、`npm run build`、`npm run build:weapp`：PASS；四包及两端构建，保留体积提示。
- 定向前端规则/磁盘测试 22 项、定向 Spring/PostgreSQL 测试 29 项：PASS。命令与范围见 [第五轮报告](../reviews/wechat-login-stage4/round-05-codex.md)。
- 实际 App/React + jsdom + 真实 API/PostgreSQL 领取验证 2 项：PASS；连接中断后重试，离开面板后迟到成功不登录。
- 实际 API OPTIONS：PASS，200 且允许绑定请求头。实际双 store/磁盘切换隔离：PASS。
- 实际 API 探针：复现 I004 直接请求 401 仍保留账号 runtime、I007 重复导入未上传新编辑；业务判定 FAIL，探针退出 0 不表示通过。
- 完整测试集、真实微信、真实浏览器完整扫码和 iOS/Android 平台验收：NOT RUN；不执行预设本项目响应的前端测试。下方均为历史轮次记录，不计入第五轮执行。
- 收尾：四份输出 Prettier、`git diff --check`、快照保留检查、20 项状态与 83 个文档链接检查 PASS；仅新增第五轮报告，三份授权状态文档更新，其余输入及验收表格保持不变。18095 独立 API 已停止，本轮隔离数据库已删除，暂存区为空。

Codex 第三轮修复复核（2026-10-14，目标 `024f7f4c472b0845928a144abd086d8cffd0bbd0`）：

- `npm run typecheck`：PASS；四包。
- 定向 Vitest：PASS；63 项；定向 Maven 真实应用/数据库测试：PASS；16 项。完整命令和范围见 [第三轮报告](../reviews/wechat-login-stage4/round-03-codex.md)。
- `npm run build`、`npm run build:weapp`：PASS；保留资源体积提示。
- 真实磁盘、API、PostgreSQL 探针：同时验证有效修复并复现数据源隔离、过期消费、凭证未消费、用户名边界和 CORS 缺陷；业务失败不计为 PASS。
- 完整含替代响应测试的测试集、真实微信平台、浏览器完整扫码及手机平台验收：NOT RUN；范围和原因见报告。
- 四份文档的 Prettier、`git diff --check`、`node .cache/code-review-round03/validate-docs.cjs`：PASS；20 项状态与计数、59 个本地链接、历史原文、原工作区和表格保留均通过。独立 API 已停止，本轮隔离数据库已删除。
- 接管后同步检查：四份文档 Prettier、`git diff --check`、第三轮报告与独立工作区原文的 `cmp` 均 PASS；第一、二轮报告及未跟踪验收表格 SHA-256 与同步前一致。当前变更仅含四份授权审查文档，业务验证沿用上述固定版本的本轮执行结果，没有重复运行。
- 下方既有结果均为各历史任务的记录，不作为第三轮运行结果。

各次执行按日期和 Agent 分开记录；历史结果不代表本次重新执行。历史产品结果另见 Retained Product Evidence。

### Kimi 第四轮审查修复（2026-10-14）

| Command / 检查                             | Result           | 范围与说明                                                                                            |
| ------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `mvn test`（真实 PostgreSQL 16.10 测试库） | PASS             | 76 项全部通过；新增幂等消费凭证、锁等待过期拒绝、并发配额与二维码合并等用例                           |
| `npm test -- --maxWorkers=1`               | PASS             | 25 个测试文件、128 项全部通过；含扫码面板真实运行验证与数据源隔离回归                                 |
| `npm run typecheck`                        | PASS             | 四包；Web tsconfig 增加 node 类型以覆盖测试服务器引用                                                 |
| `npm run build`、`npm run build:weapp`     | PASS             | 两端生产构建                                                                                          |
| `npm run format:check`、`git diff --check` | PASS             | 初次检查后的格式问题经项目 Prettier 修正并复验通过                                                    |
| PostgreSQL 锁等待直接探测                  | FAIL（方案否定） | 探测证实 `clock_timestamp()` 条件更新在锁释放后仍消费过期票据；据此改为行锁方案并以服务级测试验证 410 |
| 真实微信平台、真机、浏览器手动交互         | NOT RUN          | 由用户侧验收继续                                                                                      |

### Kimi 阶段 4 实施（2026-10-13）

| Command / 检查                                                                                      | Result  | 范围与说明                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mvn test`（Java 21，`basketball_gm_test` 真实 PostgreSQL 16.10 容器，5432）                        | PASS    | 63 项测试全部通过；先在既有库升级上运行，随后重建全新数据库再次完整运行，V14 迁移与新库初始化均通过                                                                                                                             |
| `npm test -- --maxWorkers=1`                                                                        | PASS    | 24 个测试文件、119 项测试全部通过（含新增 core 用户名规则、client 微信与票据 API、小程序账号数据源测试）                                                                                                                        |
| `npm run typecheck`                                                                                 | PASS    | core、client、web、miniprogram 四包                                                                                                                                                                                             |
| `npm run build`、`npm run build:weapp`                                                              | PASS    | 两次构建均含四包 typecheck；小程序产物含第十个页面 `pages/auth/index`，`lazyCodeLoading` 与深色背景保持；保留既有构建体积提示                                                                                                   |
| `npm run format:check`、`git diff --check`                                                          | PASS    | 初次检查发现若干新文件格式问题，经项目 Prettier 格式化后复验通过；差异无空白错误                                                                                                                                                |
| 本地真实进程冒烟（`mvn package` 后启动 JAR，`basketball_gm_smoke` 新库，8090 端口，未配置微信凭据） | PASS    | 中文用户名注册 201；韩文与含空格用户名 400；微信 exchange 返回 503 `WECHAT_NOT_CONFIGURED`；票据创建、错误绑定 404、待确认领取 409、确认 204、领取签发会话、重复领取 410；游客导入返回新 client key。冒烟后进程停止、数据库删除 |
| 微信真实接口、`wxacode.getUnlimited` 实际调用、小程序端真实登录与扫码、iOS/Android 真机             | NOT RUN | 缺少 AppID 与 AppSecret 等凭据及设备条件；微信接口在测试中由真实本地 HTTP 服务器替代，冒烟环境未配置凭据，不以替代结果充当平台验收                                                                                              |
| Gitleaks 脱敏扫描全部修改文件                                                                       | PASS    | 使用 `.cache/security-audit` 现有工具与配置逐文件扫描；19 处命中逐行核对后均为文案、类型声明、构造赋值、环境变量引用或测试占位，无真实凭据；未扩大允许名单                                                                      |

### Kimi 接手核对与阶段 4 实施设计（2026-10-13）

| Command / 检查                                                                                                                                                                             | Result  | 范围与说明                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------ |
| `git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git log -3 --oneline`、`git diff --stat`、`git diff --cached --stat`、`git ls-files --others --exclude-standard` | PASS    | 分支 `mini-app-20261004`、HEAD `b87d67f`；四份文档修改与交接声明一致，无暂存或未跟踪文件   |
| 四份文档 `stat` 修改时间与交接内容核对                                                                                                                                                     | PASS    | 最后修改 2026-10-13 19:10:31，交接后无变化；Codex 声明停止写入，Owner 已释放               |
| `AuthRequest`、`AuthService`、`AuthController`、`UserMapper`、`UserRow`、`ReservedUsernames`、`AdminRegistry`、`CurrentUser`、`SecurityConfig` 与 V7 迁移只读核对                          | PASS    | ASCII 校验、空密码拒绝、JWT 签发路径与放行边界确认；差异见 Current State                   |
| `GuestImportService`、`GuestImportMapper`、`GuestImportController`、`GuestImportRequest`、`GuestLineupImport`、`LineupMapper` 与 V5、V6、V10 迁移只读核对                                  | PASS    | 导入沿用原 client key 的覆盖风险与幂等结构确认                                             |
| `SimulationController`、`SimulationService`、`SimulationMapper`、`SimulationResponse` 与 AI engineVersion 只读核对                                                                         | PASS    | 列表响应含类型区分字段与快照；当前无按 ID 的私有详情接口                                   |
| `docker exec dream-court-postgres-1 psql -tAc` 正则探测                                                                                                                                    | PASS    | 只读 SELECT；现有约束实测接受中文、拒绝 emoji 与空格、按字符计数，并接受产品规则之外的字符 |
| 小程序 account 页、`packages/client` 契约与 API、小程序 `config/env.ts`、Web 登录与导入流程只读核对                                                                                        | PASS    | 阶段 4 前端缺口确认                                                                        |
| `npx prettier --check docs/plans/current.md`、`git diff --check`、`gitleaks dir docs/plans/current.md`（`.cache/security-audit` 现有工具与配置）                                           | PASS    | 初检表格格式经 Prettier 修正后复验通过；差异无空白错误；扫描无敏感信息发现                 |
| 前后端业务测试、typecheck、两端构建、`mvn test`                                                                                                                                            | NOT RUN | 本轮仅文档与只读核对，业务代码与配置未修改；历史结果按原日期保留                           |

### Codex 交接给 Kimi Code（2026-10-13）

| Command / 检查                                                                                                                                                                                  | Result  | 范围与说明                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `git status --short`、`git branch --show-current`、`git rev-parse HEAD`、`git log -3 --oneline`、`git diff --stat`、`git diff`、`git diff --cached`、`git ls-files --others --exclude-standard` | PASS    | HEAD `b87d67f`；交接前仅三份 Codex 文档修改，无暂存或未跟踪文件；交接新增 `AI_HANDOFF.md` 修改                           |
| 认证源码、V7 约束、游客导入与小程序 account 页面只读核对                                                                                                                                        | PASS    | API 仍限制 ASCII 用户名，JWT 颁发在 `AuthService`；导入使用原 client key；小程序 account 页仍为游客入口，阶段 4 尚未实现 |
| 上一轮三份文档的 Prettier、`git diff --check`、Gitleaks 脱敏扫描                                                                                                                                | PASS    | 本轮交接前实际复跑，无格式、差异或敏感信息问题                                                                           |
| `npx prettier --check docs/plans/wechat-miniprogram.md docs/plans/current.md docs/DECISIONS.md docs/AI_HANDOFF.md`、`git diff --check`、引用存在性与状态核对、Gitleaks 脱敏扫描                 | PASS    | 四份文档格式与引用通过，无敏感信息；Task、Status、基线与未提交清单一致，Owner 在最后一次写入释放                         |
| 前后端业务测试、typecheck、构建、真实微信与真机验收                                                                                                                                             | NOT RUN | 本轮仅交接文档，无代码改动；此前结果按日期保留，不作为本次执行                                                           |

### Codex 阶段 4 产品文档确认（2026-10-13）

| Command / 检查                                                                                                         | Result  | 范围与说明                                                                           |
| ---------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `git status --short`、`git branch --show-current`、`git rev-parse HEAD`、相关 diff 与最近提交                          | PASS    | 开始时 working tree 干净；分支 `mini-app-20261004`、HEAD `b87d67f`；只读核对相关实现 |
| `npx prettier --check docs/plans/wechat-miniprogram.md docs/plans/current.md docs/DECISIONS.md`                        | PASS    | 初次检查发现 Markdown 表格格式问题，使用项目 Prettier 格式化后复验通过               |
| `git diff --check`、`git diff --name-only`、引用文件存在性检查                                                         | PASS    | 仅三份文档修改；产品章节、D-005 及引用路径有效；无业务代码或配置变化                 |
| `.cache/security-audit/tools/gitleaks dir <各修改文件> --config .cache/security-audit/audit.toml --redact --no-banner` | PASS    | 三份文档逐个扫描通过，无敏感信息发现；使用现有配置，未扩大允许名单                   |
| 前后端测试、typecheck、两端构建及微信真实登录验收                                                                      | NOT RUN | 本轮文档修改，业务代码未改变；阶段 4 尚未实现，历史 PASS 不作为本轮证据              |

### 用户开发者工具代码质量面板复验（2026-10-13）

证据来源：用户明确反馈“代码质量面板重新扫描后，这三项都显示‘已通过’”。以下仅记录三项检查结果，Codex 本轮未独立执行扫描。

- 组件代码按需注入（`lazyCodeLoading: 'requiredComponents'`）：PASS（用户确认）。
- JavaScript 压缩（`setting.minified: true`）：PASS（用户确认）。
- WXSS 压缩（`setting.minifyWXSS: true`）：PASS（用户确认）。
- 编号 08/11/12、Android 真机验收及其他代码质量检查项：未新增验收结果，保留原有范围和状态。
- `npx prettier --check docs/plans/current.md`、`git diff --check`：PASS；文档格式及差异检查通过。
- `.cache/security-audit/tools/gitleaks dir docs/plans/current.md --config .cache/security-audit/audit.toml --redact --no-banner`：PASS；使用既有规则扫描完整待提交文档，未发现敏感信息。
- `npm test`、typecheck、两端构建与 `mvn test`：NOT RUN；本轮仅修改验收文档并提交非 main 分支，未修改业务代码。

### 用户 iPhone 真机验收记录同步（2026-10-13）

证据来源：用户本次明确反馈及 [Google Docs 真机验收表](https://docs.google.com/document/d/1ecoI076IgT3Vx0BSstOP3WOGumwX1MzlvaQ9wuTyvG0/edit?tab=t.0)。以下为用户报告的验收结果，Codex 本轮没有重新执行真机操作。

| 编号 | 用例                 | iPhone 状态                          | Android 状态 |
| ---- | -------------------- | ------------------------------------ | ------------ |
| 01   | 保存后关闭重进       | PASS（用户确认）                     | NOT RUN      |
| 02   | 草稿恢复与正式保存   | PASS（用户确认）                     | NOT RUN      |
| 03   | 后台切换与锁屏恢复   | PASS（用户确认）                     | NOT RUN      |
| 04   | 对战与战报持久化     | PASS（用户确认）                     | NOT RUN      |
| 05   | 中文输入与键盘       | PASS（用户确认）                     | NOT RUN      |
| 06   | 返回与球员选择       | PASS（用户确认）                     | NOT RUN      |
| 07   | 阵容规则限制         | 已修复（用户确认三项体验问题已修复） | NOT RUN      |
| 08   | 游客离线流程         | NOT RUN（暂无验收条件）              | NOT RUN      |
| 09   | 渲染、搜索与安全区域 | PASS（用户确认，白色闪烁已修复）     | NOT RUN      |
| 10   | 历史上限与阵容快照   | PASS（用户确认）                     | NOT RUN      |
| 11   | 真实存储失败与恢复   | NOT RUN（暂无验收条件）              | NOT RUN      |
| 12   | 战报到期与旧详情     | NOT RUN（暂无验收条件）              | NOT RUN      |

- Android：NOT RUN；用户确认尚未验收。编号 08/11/12 待具备真实条件后再执行，本轮不准备或执行这些场景。
- 开发者工具代码质量面板三项复验：PASS（2026-10-13，用户确认）；具体项目见上方最新复验记录，配置实施与历史构建证据见 2026-10-06 记录。
- Google Docs 更新后重新读取：PASS；原表保留 13 行、5 列，用例名称、操作步骤、通过标准和设备信息保持一致，全部结果单元格与用户反馈一致。
- `npx prettier --check docs/plans/current.md`、`git diff --check`：PASS；本轮文档格式与差异检查通过。
- `npm test`、typecheck、两端构建、`mvn test` 及真机操作：NOT RUN；本轮仅更新 Google Docs 与当前计划，历史命令结果保持原有日期与范围。

### Codex 阵容与历史战报卡片导航（2026-10-13）

- `npm test -- --maxWorkers=1`：PASS；21 个测试文件、105 项测试全部通过。
- `npm run build:weapp`、`npm run build`：PASS；均包含 core、client、Web、小程序四包 typecheck。小程序 `common.js` 为 270 KiB，Web 主文件为 595.56 kB，保留既有构建体积提示。
- `node .cache/card-navigation-acceptance/verify.cjs`：PASS（最终执行）；独立游客项目，自动化端口 9438，基础库 3.17.3，模拟器 iPhone 12/13 (Pro)。使用真实规则对战生成两场战报，实际点击两种卡片的背景、标题和按钮，另外验证战报比分点击；每次进入对应 ID 的页面，只增加一个页面，返回后恢复列表，存储完全一致。历史战报空列表提示正常。八项检查通过，无 exception。没有使用 mock 或截图，未操作用户原项目存储或手机调试连接；脚本与结果保存在 Git 忽略的 `.cache/card-navigation-acceptance/`，其他机器需要重新执行。
- `git diff --name-only -- apps/web packages backend`、`shasum -a 256 apps/web/dist/assets/index-1BdW4FVN.js apps/web/dist/assets/index-DHkKajIP.css`：PASS；相关目录无源码修改，Web 主 JavaScript SHA-256 为 `57328b19dae1c089c4e6e92718650ef9eb8f47b2bfa568440182b9e82945cfff`，CSS 为 `a083c2220c1d07d0740e5ff10913b62b235b0980aa4292bb0c5060ab3cc3e822`，与修改前一致。
- `npm run format:check`、`git diff --check`：PASS；源码与任务状态文档检查。
- 真机点击与返回：PASS（用户报告）；用户确认“真机测试没有问题”。设备、系统及基础库未提供；Codex 未独立连接手机复验，不据此判定 iOS、Android 分别通过。
- 提交前 `npm test -- --maxWorkers=1`、`npm run typecheck`：PASS；重新运行 21 个文件、105 项测试与四包类型检查。
- `mvn test`：NOT RUN；后端没有修改，本项仅调整小程序页面导航。

### Codex 编辑阵容首发置顶（2026-10-13）

- `npm test -- --maxWorkers=1`：PASS；21 个文件、105 项测试。新增四项测试使用真实球员目录与磁盘存储，覆盖正式阵容、草稿恢复、组内稳定顺序、操作期间位置保留、取消及移除、没有首发和空阵容；展示前后存储不变。
- `npm run build:weapp`、`npm run build`：PASS；均包含 core、client、Web、小程序四包 typecheck。小程序 `common.js` 为 270 KiB，Web 主文件为 595.56 kB，保留构建体积提示。
- `node .cache/starter-order-acceptance/verify.cjs`：PASS（最终执行）；独立游客项目，端口 9437，开发者工具基础库 3.17.3，模拟器 iPhone 12/13 (Pro)。实际页面添加十名球员、选择五名分散首发，操作期间不移动卡片；真实 reLaunch 退出到阵容列表后，通过列表按钮进入编辑页，草稿与正式阵容均首发置顶，原存储顺序与内容保持不变。替换首发后重新进入使用最新首发；进入选择页再返回触发 useDidShow，重新排序正确且不写入存储。无 exception。脚本及结果位于 Git 忽略目录，未使用 mock、截图或用户原项目存储；其他机器需要重新执行。
- 系统返回路径自动化：FAIL；直接通过 SDK navigateBack 响应超时，受控表达式调用真实 wx.navigateBack 后未返回到列表。返回确认弹窗操作也未成功；未改变页面离开保护逻辑。最终页面重建验证使用 reLaunch，重新显示验证使用选择页真实返回，不据此声明系统返回手势通过。
- `git diff --name-only -- apps/web packages backend`、`shasum -a 256 apps/web/dist/assets/index-1BdW4FVN.js apps/web/dist/assets/index-DHkKajIP.css`：PASS；相关目录无源码修改，Web 主 JavaScript SHA-256 为 `57328b19dae1c089c4e6e92718650ef9eb8f47b2bfa568440182b9e82945cfff`，CSS 为 `a083c2220c1d07d0740e5ff10913b62b235b0980aa4292bb0c5060ab3cc3e822`，与修改前完全一致。
- `npm run format:check`、`git diff --check`：PASS；源码和任务状态文档检查。
- 手机端首发置顶验收：PASS（用户报告）；用户确认“真机测试没有问题”。设备、系统及基础库未提供；Codex 未独立连接手机复验，不据此判定 iOS、Android 分别通过，也不推断单独的系统返回手势验收结果。
- 提交前 `npm test -- --maxWorkers=1`、`npm run typecheck`：PASS；重新运行 21 个文件、105 项测试和四包类型检查。
- `mvn test`：NOT RUN；后端没有修改，本项使用游客本地阵容。

### Codex 球员分页优化（2026-10-13）

- `node .cache/player-pagination-acceptance/verify.cjs`（修改前产物）：FAIL；复现预期缺陷，点击下一页后原生 scrollTop 为 1692px，搜索框 top 为 -1600.5px，未收到运行异常。原始记录保存在 `baseline.json`。
- `npm test -- --maxWorkers=1`：PASS；21 个文件、101 项测试，覆盖 Web、core、client 和小程序现有业务。
- `npm run build:weapp`、`npm run build`：PASS；均包含四包 typecheck，保留既有小程序 `common.js` 269 KiB 和 Web 主文件 595.56 kB 体积提示。
- `node .cache/player-pagination-acceptance/verify.cjs`（修改后最终执行）：PASS；独立游客项目，端口 9436，开发者工具基础库 3.17.3，模拟器 iPhone 12/13 (Pro)。球员库与选择页翻页后搜索框 top 分别为 0px、-0.102px，上方显示第 2 页；详情返回均保留第 2 页和 600px 滚动位置，加入阵容前后位置均为 600px，已加入按钮禁用。上一页回到第一页、首页按钮禁用、搜索重置、末页按钮禁用及空结果提示通过；无 exception。脚本等待真实导航和渲染完成后断言，原生 disabled 属性按工具返回的布尔字符串核验；未使用 mock，没有截图，未操作用户原项目存储。脚本及 `result.json` 被 Git 忽略，其他机器需要重新执行。
- `git diff --name-only -- apps/web packages backend`、`shasum -a 256 apps/web/dist/assets/index-*.js apps/web/dist/assets/index-*.css`：PASS；这些目录无源码修改，Web 主 JavaScript SHA-256 为 `57328b19dae1c089c4e6e92718650ef9eb8f47b2bfa568440182b9e82945cfff`，CSS 为 `a083c2220c1d07d0740e5ff10913b62b235b0980aa4292bb0c5060ab3cc3e822`，与修改前完全一致。
- `npm run format:check`、`git diff --check`：PASS；最终源码与任务状态文档检查。
- 真机分页验收：PASS（用户报告）；用户确认“真机测试没有问题”。设备、系统与基础库未提供；Codex 未独立执行手机端验证，不据此判定 iOS、Android 分别通过。
- `mvn test`：NOT RUN；后端没有修改，游客分页不调用后端。

### Codex 球员详情页入口调整（2026-10-13）

- `npm run build:weapp`：PASS；包含 core、client、Web、小程序四包 typecheck，小程序编译成功，保留已有 `common.js` 269 KiB 体积提示。
- `node .cache/player-detail-acceptance/verify.cjs`：PASS（最终执行）；独立游客项目、自动化端口 9432、开发者工具基础库 3.17.3、模拟器 iPhone 12/13 (Pro)。真实页面节点验证球员姓名、身高体重和能力值展示，详情按钮数量为 0；详情返回、缺少球员参数提示、阵容编辑“添加球员”进入候选列表及返回全部通过。浏览前后工作区与草稿存储一致，未收到运行异常，验证结束关闭独立项目。首次脚本在点击后立即断言路径，读取到尚未完成切换的旧页面；改为有超时限制地等待目标路径后完整通过。脚本及结果位于 Git 忽略目录，未使用 mock。
- `npx prettier --check apps/miniprogram/src/pages/player-detail/index.tsx docs/DECISIONS.md docs/plans/current.md`、`git diff --check`：PASS；源码与决策文档格式正确，差异无空白错误。
- `npm test`、Web 构建、`mvn test`、iOS 与 Android 真机复验：NOT RUN；本轮为小程序页面入口删除，采用四包类型检查、小程序构建及真实开发者工具页面验证，业务规则与其他客户端实现没有修改。

### Codex 排查记录整理（2026-10-13）

- `npx prettier --check README.md docs/plans/current.md docs/troubleshooting/miniprogram-tab-white-flash.md`：PASS；三份文档格式符合项目配置。
- `git diff --check`：PASS；文档差异无空白错误。
- `node -e` 调用 `fs.accessSync` 检查文档涉及的六份仓库文件：PASS；逐项核验相对引用，README、current plan、排查记录及三个源码目标均存在。
- `git log -1 --format='%H%n%s'`：PASS；修复提交为 `33bf7330c7e2b0caa94224d2e6de5da74e12cc42`，与记录一致。
- 本地 JSON 数据、采样脚本、原生实验配置及官方文档交叉复核：PASS；样本数量、零起始索引、采样耗时与配置职责一致；已记录截图证据范围、PageMeta 与页面容器配置关系的未确定部分。
- 自动化测试、typecheck、构建与真机复验：NOT RUN；本轮仅修改文档，沿用下方标明日期与范围的实际执行结果。

### Codex 真机白闪继续定位（2026-10-13）

- `swift -suppress-warnings -module-cache-path .cache/tab-flash-analysis/module-cache .cache/tab-flash-followup/analyze.swift <用户录屏路径> .cache/tab-flash-followup/video`：FAIL（白屏判定）；真实解码 553 帧，19 个白色帧，13 段连续闪烁。沙箱内视频解码无法启动，经过授权的 macOS 视频服务执行成功；命令退出码 1 表示检测到了白屏。
- `/Applications/wechatwebdevtools.app/Contents/MacOS/cli agent start --project <仓库>/apps/miniprogram`：PASS；官方持久自动化接口端口 9420，`openedProjectWindow: false`，工具 2.02.2608080；未重启项目或清除用户存储。
- `node .cache/tab-flash-followup/probe.cjs`：PASS（运行状态核验）；iOS 真机两轮四 tab 页面标识、根节点数量、PageMeta 数据稳定且无 exception。完整截图耗时 1263ms，本项不判定白闪消失。
- `node .cache/tab-flash-followup/background.cjs inspect`：PASS（只读属性核验）；四页 `.screen` 背景透明，PageMeta p6 深绿色；原生 `page` 选择器返回 null，未据此推断根背景实际计算值。
- `node .cache/tab-flash-followup/root-style.cjs`：PASS（页面宿主样式读取）；CDP 合成组件树中的四页宿主背景均为 `rgb(16, 43, 35)`，`opacity: 1`、`display: block`、`visibility: visible`；不代表 HTML/body 的计算样式。
- `node .cache/tab-flash-followup/capture.cjs screen`：FAIL（白屏判定）；32 次切换捕获 9 张白色截图，否定 `.screen` 不透明背景和最小高度足以消除白闪的假设；临时样式已恢复。
- 官方 CLI 普通预览：PASS（生成）；用户明确授权上传，用户设备复验结果为 FAIL（仍闪白）。普通预览生成不代表修复通过。
- `node .cache/tab-flash-followup/capture.cjs native 9433`：FAIL（白屏判定）；原生静态项目 32 次切换捕获 2 张白色截图，视觉核对与业务项目相同的内容区域白屏。原生项目和脚本均位于 Git 忽略目录，不读取或写入用户存储。
- `node .cache/tab-flash-followup/root-style.cjs native 9433`：NOT RUN（连接中断）；接口返回 `Remote debug connection lost`，未取得原生项目根样式值。
- `node .cache/tab-flash-followup/capture.cjs native-magenta 9433`：PASS（定位颜色实验）；32 次切换捕获 2 张洋红色截图、0 张白色截图，视觉确认内容区域完全变为指定定位颜色。与原生基线相比只增加四页 JSON 的 `backgroundColorContent`。
- `npm test -- --maxWorkers=1`、`npm run build:weapp`：PASS；21 个文件、101 项测试，小程序构建包含四包 typecheck；保留 `common.js` 269 KiB 的已有体积提示。
- `npm run build`：PASS；再次执行四包 typecheck 与 Web 构建，保留已有 500 kB 体积提示。Web 输出仍为 `index-1BdW4FVN.js`、`index-DHkKajIP.css`。
- `npm run format:check`、`git diff --check`：PASS；九页源码及九页构建产物的 `backgroundColorContent` 均为 `#102b23`，原生 tab 配置与页面路径未改变。
- `node .cache/tab-flash-followup/capture.cjs fixed 9434 64 '#102b23'`：PASS（真实 iPhone 切换采样）；64 次切换、64 张截图，0 张白色、0 张洋红色，异常事件为空。实际四个 tab 的容器背景为 `#102b23`，九个路径注册正确，每次切换后实际路径均符合预期。切换与截图并发发起，采样延迟轮换 0/8/16/33ms；官方截图接口返回较慢，未捕获白色帧不能单独证明所有过渡时刻均无白闪。测试结束恢复 `setKeepScreenOn: false`。
- `node .cache/tab-flash-followup/verify-fixed-pages.cjs`：PASS（真实 iPhone 页面流程）；16 次过渡采样无白色画面，球员列表滚动位置切换前后均为 600px，球员详情、现有无草稿阵容编辑、球员选择、历史战报及现有有效战报详情进入与返回均成功。页面标题、路径与容器背景核验通过，异常事件为空，测试前后业务工作区和草稿存储摘要相同。最终执行退出码 0，`completed: true`，恢复 `setKeepScreenOn: false`。调试时官方 `page.scrollTop()` 返回 0，原生 `selectViewport().scrollOffset()` 与截图确认真实滚动为 600px，因此使用原生接口完成验证。
- `/Applications/wechatwebdevtools.app/Contents/MacOS/cli preview --project <仓库>/apps/miniprogram --qr-format image --qr-output <仓库>/.cache/tab-flash-followup/preview-fixed.png`：PASS（生成修复版本普通预览）；上传包 612257 字节。用户在同一 iPhone、没有“已连接”浮层的普通预览中首次及重复切换四个 tab，反馈“没有白色闪烁”，用例 09 普通预览验收 PASS。
- Android 真机验证：NOT RUN；当前没有可用 Android 设备，本次 iPhone 结果不代替 Android 验收。

### Codex tab 切换根背景修复（2026-10-13）

- `npm test`：FAIL；两次默认并行运行出现 5000ms 超时，第一次为球员数据校验，第二次还有 Web 游客入口测试超时及后续重复元素错误。未修改测试、断言或超时限制。
- `npm test -- --maxWorkers=1`：PASS；21 个文件、101 项测试，覆盖 Web、core、client、小程序。限制 worker 并发后完整执行全部测试。
- `npm run build:weapp`、`npm run build`：PASS；均包含四包 typecheck。最终小程序构建包含 NavigationBar 配置，common.js 269 KiB；Web 主 JavaScript 595.56 kB，保留已有体积提示。
- `npm run format:check`、`git diff --check`：PASS。
- `git diff --name-only -- apps/web packages backend`、`shasum -a 256 apps/web/dist/assets/index-*.js apps/web/dist/assets/index-*.css`：PASS；对应源码没有修改。Web JavaScript SHA-256 为 `57328b19dae1c089c4e6e92718650ef9eb8f47b2bfa568440182b9e82945cfff`，CSS 为 `a083c2220c1d07d0740e5ff10913b62b235b0980aa4292bb0c5060ab3cc3e822`，与本轮修改前一致。
- `node .cache/tab-background-acceptance/verify.cjs`：PASS；微信官方 miniprogram-automator 启动独立游客项目，端口 9432、基础库 3.17.3、模拟器 iPhone 12/13 (Pro)。核验九个 WXML 的原生根背景绑定及页面 JSON；实际进入九个页面，四个 tab 连续切换四轮，创建阵容后进入编辑与选择页再返回，进入球员详情再返回，检查历史战报与战报缺失页面。页面数据中的根背景、导航颜色与品牌标题，以及实际渲染的页面标题均正确，未收到运行异常。原项目配置和用户存储保持原状。脚本与 result.json 被 Git 忽略，其他机器需重新执行。本条只证明页面数据、节点绑定与交互，不证明真机过渡帧无白闪。首次启动受沙箱限制，随后有一次自动化响应超时；最终完整执行成功。
- iOS、Android 真机切换瞬间白闪复验：NOT RUN；本轮没有手机端运行接口，用户将通过最新预览验证。
- `mvn test`：NOT RUN；后端没有修改，本轮涉及小程序原生页面配置。

### Codex 阵容开关体验优化（2026-10-13）

- `npx vitest run apps/miniprogram/src/services/guest-store.test.ts apps/miniprogram/src/services/guest-runtime.test.ts`：PASS；2 个文件、16 项测试。新增 8 项覆盖激活与首发上限、首发限制优先、自动激活首发、已有激活人数保持、取消激活清除首发、释放名额后重试、重复设置不产生修改与缺失球员报错。草稿恢复与保存使用真实磁盘存储，未使用 mock。
- `npm test`：PASS；21 个文件、101 项测试，含 Web、core、client、小程序。
- `npm run build:weapp`、`npm run build`：PASS；均包含四包 typecheck，小程序 `common.js` 269 KiB、Web 主文件 595.56 kB，保留已有体积提示。
- `npm run format:check`、`git diff --check`：PASS。
- `git diff --name-only -- apps/web packages backend`、`shasum -a 256 apps/web/dist/assets/index-*.js apps/web/dist/assets/index-*.css`：PASS；Web、共享包与后端无源码差异。JavaScript SHA-256 为 `57328b19dae1c089c4e6e92718650ef9eb8f47b2bfa568440182b9e82945cfff`，CSS 为 `a083c2220c1d07d0740e5ff10913b62b235b0980aa4292bb0c5060ab3cc3e822`，与修改前完全一致。
- `node .cache/lineup-toggle-acceptance/verify.cjs`：PASS；使用微信官方 `miniprogram-automator` 连接独立游客测试项目（端口 9432，基础库 3.17.3，模拟器 iPhone 12/13 (Pro)）。通过实际页面创建 15 人阵容，点击原生 Switch 验证第 14 名激活拒绝、重复拒绝后的开关恢复、第 6 名首发拒绝、首发限制优先、激活限制、自动激活首发、取消激活清除首发、重试与正式保存。断言卡片提示实际颜色 `rgb(255, 107, 107)`、字重 700；超限前后真实草稿值相同，未收到运行异常。原项目配置与存储保持原状，未使用 mock、未触发清理存储。脚本与 `result.json` 被 Git 忽略，仅作本地证据，其他机器须重新执行。
- 本轮 iOS、Android 真机交互与 toast 显示：NOT RUN；本轮通过开发者工具验证页面与开关状态，没有手机端运行接口。用户报告的用例 07 PASS 属于优化前版本，不覆盖本轮新行为。
- `mvn test`：NOT RUN；本轮后端无改动，游客流程不调用后端。

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

2026-10-20 Round 01 汇总完成：接受 kimi-code-round-01-20261020 对 d5b240802bbb3d8e5457ae58d97882b398f2947a 的 PASS 结论，无新增问题、无分歧，六类状态计数均为 0。仅更新问题清单、审查入口和本计划，任务 DONE、Owner codex；S01–S07 保持 BLOCKED。原始报告及 Kimi worktree 保留原状，本轮不提交、不推送、不合并或部署。以下为历史记录。

2026-10-20 用户确认本地验收通过，授权提交当前 22 个变更文件并安排 Kimi Code Round 01 独立审查。Owner 保持 codex，Status 保持 VALIDATING；本次审查结论待独立报告，不根据本地验收提前标记审查通过。下面为此前实施与本地重建记录。

2026-10-20 本地重建补充任务完成：Web/API 已在 `http://127.0.0.1:8088/` 提供当前 develop 未提交版本，健康检查及浏览器只读验证通过。开发数据库已备份，数据库容器保持原样，无新增迁移；本地社区开关为 false。Owner 继续 codex，业务变更仍待独立审查。下方为本轮本地重建之前的完成记录。

2026-10-20 `icp-community-disable-20261020` 实施与验证完成：公共备案页脚、社区导航及阵容操作关闭、旧地址限制、后端默认关闭、统一 Compose 开关、测试和文档均已完成。前端完整 165 项、后端完整 84 项、四包 typecheck、Web 构建、真实 HTTP/PostgreSQL、浏览器交互及变更文件格式检查 PASS。全仓格式检查仅历史报告例外 FAIL。本地保持 develop / b01c453，Owner codex，状态 VALIDATING，等待独立审查。共 18 个已跟踪文件修改及 4 个新增文件，暂存区为空；未提交、推送、合并或部署，用户开发库和现有开发容器未变更。以下为历史完成记录。

Round 11 汇总及合并条件检查完成：R05 / I024 VERIFIED，阶段 4 计数为 24 VERIFIED、0 OPEN、0 FIXED_PENDING_REVIEW，代码审查维度 PASS；用户接受历史报告格式例外，S01–S07 保持 BLOCKED。三份文档更新保留未提交状态，当前仍为 develop / `96219f2`，Owner codex / ACTIVE。本轮未提交、推送或合并；Git 可快进，正式操作前需处理文档提交，main 推送前完整测试及扫描另行执行。以下均为历史完成记录。

Round 10 汇总及 R05 格式修复完成：I004、I007、I016、I017 VERIFIED，I024 / R05 FIXED_PENDING_REVIEW，汇总 CHANGES_REQUIRED。十个文件格式检查、纯格式比较与四包 typecheck 通过；全仓格式检查仅历史归档报告失败，原文保留。Owner codex / ACTIVE；HEAD 未变化、暂存区为空，没有提交、推送或合并。R05 待独立复核，S01–S07 保持 BLOCKED。

以下均为历史完成记录，仅描述当时状态。

2026-10-19 完整自动化验证及六份文档提交、推送完成，提交为 `494c9ca`，证据见 Git 与交付回执；没有合并到 main。

2026-10-19 本地 develop 合并与三端构建完成时，保持 develop / `86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`；Web/API 验证服务 healthy。四包 typecheck、后端完整 83 项、两端构建与 HTTP 冒烟通过。当时六份文档未提交、未推送，随后已由上述文档交付任务完成。

第九轮归档与核验完成：R01 VERIFIED；阶段 4 为 19 VERIFIED、3 OPEN、1 FIXED_PENDING_REVIEW，整体 CHANGES_REQUIRED。当前六份文档变更未提交；无业务代码、既有测试或验收表改动，无推送或合并。Owner codex / ACTIVE，不进行工作交接。下一步需要业务与测试修复、I017 文档独立复核及 S01–S07 平台验收，见第九轮建议。以下均为历史完成记录，不能授予本轮提交、推送或修改业务的权限。

2026-10-19：当前变更完整自动化验证通过，用户平台验收结果已记录。用户授权提交并推送 `mini-app-20261004`，实际提交 SHA 与远端结果由交付提示词及 Git 核验记录；不合并。R01 为 FIXED_PENDING_REVIEW，S01–S07 受阻，历史四项 OPEN 保留。Owner 继续 codex / ACTIVE，不进行工作交接。

2026-10-18：R01 修复与本轮自动化验证完成，问题记录为 FIXED_PENDING_REVIEW，等待用户安排独立复核。Owner 保持 codex，任务 ACTIVE。仅两个后端文件与本轮任务状态记录发生修改；用户验收表、身份备份、AGENTS.md、历史报告和 Kimi worktree 保留。没有提交、推送、合并或更新开发服务。

2026-10-17 密码表单实现与上述自动化验证已完成，本地开发服务已更新。状态为 ACTIVE，Owner 为 codex，继续负责当前任务。真机交互与独立审查尚未完成；此前 M06 解绑备份、阶段 4 四项 OPEN 和其他平台验收继续保留。用户已授权提交与推送本轮变更，具体提交及远端状态以 Git 核验为准；用户验收表和本地备份不纳入提交。

第八轮定向复核完成，I021–I023 全部 VERIFIED，限定范围结论 PASS；整个任务仍为 CHANGES_REQUIRED，历史 I004、I007、I016、I017 保持 OPEN，平台验收未完成。仅新增第八轮报告并更新问题清单、入口及本计划；Kimi 的修复、架构修改、历史报告及验收表保留。按用户要求停止，不自动修复、继续审查、提交或推送。

第五轮审查任务完成，产品仍未验收通过。最后一次定向复核结论 CHANGES_REQUIRED，剩余 I004、I007、I016、I017；本轮不自动安排后续循环。业务实现、测试、配置、前四轮报告与原有未提交内容保留，只新增第五轮报告并更新三份授权状态文档；未提交、未推送。修复输入保存在本地忽略快照，结论不绑定仅含旧代码的 HEAD。

第四轮修复复核处理已完成：第三轮 12 项 OPEN 与 I011 经核验后修复，逐项验证记录见 `docs/reviews/wechat-login-stage4/round-04-kimi.md`；修复后工作区保持未提交。真实微信平台与真机验收仍未完成。

第三轮固定版本审查已完成，结论 CHANGES_REQUIRED；阶段 4 产品尚未验收通过。用户确认写入归属后，四份审查相关文档已同步至当前工作区，保留未提交状态；没有业务修复或推送。第三轮原始报告逐字节保留，其工作区状态说明对应形成报告时刻。以下保留历史完成声明；其中“规则统一”“未提交”等与目标版本的差异已记录为 I013、I017。

阶段 4 实施由 Kimi Code 完成并进入验收：微信免密码注册登录、已有账号密码验证绑定、Web 小程序扫码确认登录、两端与数据库统一中文用户名规则、新键幂等游客导入、小程序登录数据源切换与战报类型标示均已实现。后端 63 项测试（既有库升级与新库初始化）、前端 119 项测试、四包 typecheck、两端构建、格式与差异检查、本地真实进程冒烟全部通过；未提交、未推送。真实微信联调与真机验收待凭据与设备条件，保持 NOT RUN。阶段 3 保留验收项目不变。

此前交接已准备完成，目标为 Kimi Code；阶段 4 准备与阶段 3 保留验收均为 HANDOFF_READY，产品定义已完成。Owner 已释放为 unassigned，Codex 停止写入。四份文档修改保留未提交，没有推送或业务代码修改；接手者先核验，再取得写入归属，业务实施仍待用户后续授权。

此前阶段 4 产品文档任务已完成：已确认选择记录于产品文档、当前计划及 D-005，流程和验收条件一致，文档检查通过，阶段 3 未完成项与历史证据完整保留。后续阶段 4 实施须通过独立验证。

此前验收记录已按用户 2026-10-13 的反馈同步到 Google Docs 与本文件，代码质量面板三项重新扫描均为 PASS（用户确认）；该轮文档已提交为 `b87d67f`。编号 08/11/12 和 Android 的未验收状态保留，阶段 3 尚未全部验收。

本轮小程序阵容与历史战报卡片导航已实现：点击整张卡片分别进入对应编辑页与战报详情，按钮继续可用，每次只导航一次。105 项测试、四包 typecheck、两端构建、格式检查及独立开发者工具八项页面验证通过，Web 主资源保持一致。用户确认真机测试没有问题，并授权提交和推送当前分支；提交与推送状态以 Git 核验为准。

此前小程序编辑页首发置顶已提交并推送为 `2e69eed4aebc052a4513cc2065661ef7078208be`：进入或重新显示页面时将当前首发稳定分组到前面，支持草稿与正式阵容，页面内切换首发保持卡片位置，存储顺序保持不变。105 项测试、四包 typecheck、两端构建、格式检查及独立开发者工具页面验证通过，Web 主资源保持一致。用户确认真机测试没有问题。

此前两个小程序页面分页优化已提交并推送为 `3969134c401013c49a4b76ee9c1958f35b4ae786`：列表顶部页码、翻页后返回浏览区域起点、加入球员与详情返回保留位置通过独立开发者工具验收，101 项测试、四包 typecheck、两端构建及格式检查通过，Web 主资源保持一致。用户确认真机测试没有问题。

此前球员详情页入口调整已提交为 `b62fb252c0c37bcb75dfbfa2123291837c0b215a`：按钮及未使用导入已移除，长期决策记录为 D-004，四包 typecheck、小程序构建与独立开发者工具页面验证通过。

此前用例 09 的 iPhone 白闪修复提交为 `33bf7330c7e2b0caa94224d2e6de5da74e12cc42`，[独立排查记录](../troubleshooting/miniprogram-tab-white-flash.md)及文档入口提交为 `4ad96577ee82b60f6f2dcca11b788bd80d1140c3`，均已推送至 `origin/mini-app-20261004`。阶段 3 剩余范围见 Remaining Product Work；全部必需平台验收完成后才可设为 DONE。当前状态与 Owner 以本文件顶部及最新交接 checkpoint 为准。
