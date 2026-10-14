# AI Handoff

## Metadata

- From: codex
- To: Kimi Code
- Task: wechat-miniprogram-stage4-preparation
- Status: HANDOFF_READY
- Branch: mini-app-20261004
- Base Commit: b87d67f2eaba02f1db31abec822bda3c9f15e3bd
- HEAD: b87d67f2eaba02f1db31abec822bda3c9f15e3bd
- Worktree: DIRTY

## Objective

基于已确认产品要求，准备阶段 4 微信免密码账号、Web 小程序扫码确认登录及跨客户端数据功能的实现计划。阶段 3 未完成验收保留，当前授权仅为文档准备与交接，业务实现须取得用户后续明确授权。

## Where We Are

完整状态见 `docs/plans/current.md` 的 Acceptance Criteria、Current State、Remaining Product Work、Deferred Product Next Actions 与最新 Validation。阶段 4 产品定义已完成，规则见产品文档第 4.3、5、11 节及 D-005；业务实现未开始。阶段 3 iPhone 编号 01–06、09、10 已通过，07 已修复，代码质量三项复验通过；08/11/12、Android 和剩余基础库兼容性验收保留。Owner 已释放为 unassigned，Codex 停止写入；接手者仍须核验。

## Changes Since Last Handoff

- 旧 ZCode 交接索引指向 `0688735`，已过期。本轮依据实际 HEAD `b87d67f` 刷新；此前页面修复与验收证据保留在 current plan。
- `docs/plans/wechat-miniprogram.md`：微信免密码创建账号；Web 小程序扫码主动确认登录并保留密码登录；昵称仅快捷填写用户名，不新增昵称或头像功能；允许中文用户名，保持 3–32 字符、唯一性及保留名规则。
- 同一产品文档：每用户每 AppID 一个微信身份；首次游客导入每套阵容使用新键并事务重映射引用；允许查看本人有效历史 AI 战报，小程序只发起规则对战。
- `docs/DECISIONS.md`：D-005 记录已接受的长期选择。`docs/plans/current.md` 记录实现差异、待办及本次交接。架构和业务代码没有变化。

## Validation

- Git verification：PASS；分支与完整 HEAD 如 Metadata，交接前只有三份 Codex 文档修改；最终核对下方四份文档修改，无暂存或未跟踪文件。
- 相关源码核对：PASS；`AuthRequest` 仍只接受 ASCII 用户名，V7 有用户名约束；`AuthService` 私有 `issue` 颁发 JWT，密码未设置时不能密码登录；`GuestImportService` 使用原阵容键；小程序 account 页仍为游客工作区。
- 交接前复跑三份产品文档的 Prettier、`git diff --check` 与现有 Gitleaks 脱敏扫描：PASS。
- 四份文档的 `npx prettier --check`、`git diff --check`、引用存在性、现有 Gitleaks 脱敏扫描与状态一致性核对：PASS；命令和结果见 current plan 最新 Validation。
- 业务测试、typecheck、构建及真实微信登录：NOT RUN；本轮只修改文档，历史验证按原日期保留。

## Uncommitted Work

均由当前 Codex 会话修改，需要保留：

- `docs/plans/wechat-miniprogram.md`：用户已确认的阶段 4 产品要求和验收条件。
- `docs/DECISIONS.md`：已接受的 D-005，历史决策未删除。
- `docs/plans/current.md`：产品定义、保留验收与本次交接状态。
- `docs/AI_HANDOFF.md`：本次交接索引。

无暂存或未跟踪文件。交接不提交、不推送，不修改本地真实账号配置。

## Next Action

Kimi Code 按 `AGENTS.md → 本文件 → current plan → Git verification` 核验后，确认 Codex 已停止写入，设置 Owner 为 kimi、Status 为 ACTIVE。第一个调查步骤：读取 `backend/src/main/java/com/basketballgm/auth/AuthRequest.java`、同目录 `AuthService.java` 和 `backend/src/main/resources/db/migration/V7__add_password_authentication.sql`，对照产品文档第 5 节与 D-005，记录中文用户名、无密码账号、身份绑定及 JWT 签发的实现差异。

随后核对游客导入和战报读取，形成新增迁移、接口、扫码票据、会话切换及真实验证的完整计划；准备阶段不修改业务代码。取得开发授权后按计划实施并回归 Web。

## Read Next

- `AGENTS.md` 与 `.agents/skills/handoff/SKILL.md`：接手规则及再次交出工作时的同一流程。
- `docs/plans/current.md`：本轮和历史验证、剩余任务、写入授权。
- `docs/plans/wechat-miniprogram.md` 第 4.3、5、10、11、12 节；`docs/DECISIONS.md` 的 D-005。
- `docs/ARCHITECTURE.md` 的游客数据、登录数据、微信小程序、后端与数据库章节。
- `backend/src/main/java/com/basketballgm/guest/GuestImportService.java`：导入事务、原 client key 和自定义球员映射。

## Risks / Unknowns

- 微信昵称快捷填写、扫码确认页、手机浏览器同机使用方式及真实联调条件仍须核验官方 API 与实际环境；产品确认不证明平台能力已验收。不要读取或展开真实凭据。
- 允许中文用户名、微信身份与扫码登录尚未实现；只能新增 Flyway 迁移，不能修改已发布迁移。昵称不得影响管理员身份，不按昵称合并账号。
- 游客导入修改涉及 Web 共用后端，需验证新键映射、历史快照、并发与成功重试；扫码登录需验证浏览器绑定、主动确认、到期、拒绝与一次领取。
- 阶段 3 08/11/12 暂无条件、Android 未验收、最低基础库兼容性及用例构建映射缺口继续保留；历史依赖安全问题未在本轮处理。
- Kimi Code 自动发现 canonical Skill 尚未验证，可显式读取该路径；本地忽略的 `.cache` 工具与证据不保证其他机器存在，缺失时按规则重新检查。

## Handoff Confidence

MEDIUM：Git、未提交内容归属、产品选择与相关代码已核验；文档交接具备可追溯依据。阶段 4 尚未实现或真实联调，阶段 3 仍有明确验收缺口。
