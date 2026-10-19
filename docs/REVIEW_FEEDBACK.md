# 当前代码审查

- Task：`wechat-login-stage4-round09-recheck-20261019`；更新日期 2026-10-19（Asia/Shanghai）。
- 当前结论：`CHANGES_REQUIRED`。I004、I007、I016 在当前代码中仍存在；I017 的当前状态文档已整理，等待独立复核。
- Reviewed Commit：`86b6ddafb5fdfab0873eaa83bb49f1b2a0b03dd9`；文档整理随其后的 develop 文档交付提交保存，业务代码与既有测试未修改。
- 汇总负责人：Codex，`codex-stage4-takeover-20261016-01a1421b`；Owner codex / ACTIVE。
- [第九轮核验报告](reviews/wechat-login-stage4/round-09-codex.md)；[阶段 4 问题清单](reviews/wechat-login-stage4/issues.md)：VERIFIED 19、OPEN 3、FIXED_PENDING_REVIEW 1，其他状态为 0。
- 本轮实际验证：独立 PostgreSQL 数据库 `stage4_recheck_20261019`；真实 Spring Boot HTTP 复现 I004、I007；AuthApiTest 7 项、GuestImportApiTest 5 项通过。代码与文档检查支持 I016、I017 的结论。完整前后端测试、typecheck、构建及真机流程本轮 NOT RUN，具体边界见报告。
- 平台验收：用户于 2026-10-19 确认 M01–M12、W01–W06 PASS；S01–S07 BLOCKED，等待注册普通小程序账号。本轮没有由 Agent 执行真机验收。
- 下一步：按报告建议处理三项 OPEN，并对修复与 I017 文档整理安排独立复核。当前未获风险接受或延期批准。第九轮核验未修改业务代码；之后用户授权本地合并到 develop，并提交、推送文档。交付阶段完整测试结果见 [current plan](plans/current.md)，不改变本轮审查结论。

## 密码表单任务：wechat-password-form-20261017

- Kimi Round 02 独立审查结论为 PASS；I001（Kimi R01）已更新为 VERIFIED，没有新增可确认缺陷。
- Base Commit：`6c1d1ba1e2f3841964f9458c5c4be9ed773552b7`；Reviewed Commit：`ba80e115f72c48d81ded5d85fb607256f45361bb`。
- 交付起点 `86b6dda` 相对 Reviewed Commit 只增加验收表，业务代码一致；后续文档提交不改变被审代码，此 PASS 仅覆盖 Kimi 报告中的 R01、M11 和相关变更。
- [原样归档报告](reviews/wechat-password-form-20261017/round-02-kimi.md)；[问题与独立复核证据](reviews/wechat-password-form-20261017/issues.md)。归档文件与 Kimi worktree 原文的 SHA-256 一致：`4882ebb164ab70fd5e85c61ec402638859635f9f78a1268b7ff14c51c2219707`。

## 阶段 4 第八轮历史记录（以下状态仅适用于当轮）

- Task：`wechat-login-stage4`。
- 更新日期：2026-10-16（Asia/Shanghai）。
- 当前任务汇总结论：`CHANGES_REQUIRED`；第八轮 I021–I023 定向复核 `PASS`，三项全部 VERIFIED；round-05 遗留 I004、I007、I016、I017 保持 OPEN，本轮未重新复核。
- Reviewed Commit：`N/A`；HEAD 为 `5450385c5c3b9bdff1950613acd889dcd979e3a7`；未提交修复绑定 Snapshot `wechat-stage4-round08-20261016`，清单及保存位置见第八轮报告。
- 汇总负责人：Codex，`codex-stage4-round08-20261016`；当前变更的最后一轮复核已结束。
- 问题清单：[issues.md](reviews/wechat-login-stage4/issues.md)。
- 报告：[第八轮 Codex 最终定向复核](reviews/wechat-login-stage4/round-08-codex.md)、[第六轮 Codex 审查](reviews/wechat-login-stage4/round-06-codex.md)、[第七轮 Kimi 修复记录](reviews/wechat-login-stage4/round-07-kimi.md)、[第五轮最终定向复核](reviews/wechat-login-stage4/round-05-codex.md)、[第四轮 Kimi 修复记录](reviews/wechat-login-stage4/round-04-kimi.md)、[第三轮 Codex 复核](reviews/wechat-login-stage4/round-03-codex.md)、[第二轮 Kimi 修复记录](reviews/wechat-login-stage4/round-02-kimi.md)、[第一轮 Codex 原文](reviews/wechat-login-stage4/round-01-codex.md)。

### 第八轮问题状态

- `VERIFIED`：19（历史 16 项证据保留，第八轮新增验证 I021–I023）。
- `OPEN`：4（I004、I007、I016 为 major；I017 为 minor；round-05 遗留，本轮授权边界外）。
- `FIXED_PENDING_REVIEW`：0。
- `NEEDS_CONFIRMATION`、`DISMISSED`、`DEFERRED`：均为 0（I016 已按用户边界恢复 OPEN，见历史结论）。

### 第八轮历史结论与证据缺口

第八轮实际执行：同一独立 PostgreSQL 库两次 AuthApiTest（各 7 项）、完整后端 77 项、core 用户名 5 项、四包 typecheck，全部通过；三次清理查询确认本轮固定用例残留为 0。输入快照、文档检查与资源清理见第八轮报告。前端完整测试及两端构建本轮未重复执行。

第五轮实际执行 29 项后端定向测试、22 项前端规则/真实磁盘测试、2 项真实 App + API 的领取行为验证，以及四包 typecheck、两端构建和 CORS 预检。真实微信、真实浏览器完整扫码及 iOS/Android 平台验收保持 NOT RUN；历史测试结果未当作本轮结果。

第五轮用户明确：只允许本地服务器替代微信等外部平台，不允许预设本项目 API 响应。因此 I016 恢复 OPEN，第四轮的整体 DISMISSED 不再适用；历史报告与 D-006 原文保留，本轮不重新复核该项。

### 第八轮交付时的下一步

当前变更的最后一轮复核完成，停止继续审查与修改。round-05 遗留四项及平台验收由用户另行安排。本轮未提交、未推送、未发布；真实微信平台与设备验收保持 NOT RUN。
