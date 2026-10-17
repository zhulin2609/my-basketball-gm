# AI Handoff

## Metadata

- From: codex
- To: codex（当前 Owner）
- Task: wechat-password-form-20261017
- Status: ACTIVE
- Branch: mini-app-20261004
- Base Commit: 03c11587a11c28336693d64ee6f8e5d77e1a9a10
- HEAD at pre-commit checkpoint: 03c11587a11c28336693d64ee6f8e5d77e1a9a10（后续提交及推送状态以 Git 核验为准）
- Worktree at pre-commit checkpoint: DIRTY（本轮实现与测试、状态文档及用户验收表）

## Objective

小程序密码输入错误后保留原表单和输入，在原位置重新验证失效的微信身份；Web 登录/注册和小程序绑定分别使用统一 PasswordInput。实现与自动化测试已完成，保留小程序实际页面交互、真机键盘及独立审查缺口。

## Where We Are

完整状态见 `docs/plans/current.md` 的本轮 Task、Current State 及 Validation“密码输入与绑定错误处理（2026-10-17）”。历史阶段 4 的 19 VERIFIED、4 OPEN 与其他平台验收保留。用户此前授权解绑账号「09」，备份已保存，本轮没有恢复绑定。

本地 Docker Web/API 与小程序构建已更新，三个 Compose 服务 healthy。当前任务由 codex 继续负责，实例为 `codex-stage4-takeover-20261016-01a1421b`，持有当前工作区写入归属。

## Changes Since Last Handoff

- `apps/miniprogram/src/pages/auth/index.tsx` 与 `services/account-auth.ts`：密码错误、冲突和网络失败保留表单；编辑清除普通错误；凭证失效/耗尽提供“重新验证微信”，保留输入并等待主动提交。认证与后续加载失败分开处理，提交期间禁用并使用同步请求锁。
- 两端 `components/PasswordInput.tsx` 及样式：隐藏/显示密码、禁用和错误提示；Web 登录和注册复用控件，模式切换恢复隐藏。
- 后端 `WechatAuthService`、`WechatCredentialMapper`：失败次数与耗尽消费原子更新，第五次错误立即返回明确错误码；保留已有成功重试行为。
- 新增 Web 控件测试及后端真实 HTTP 测试；历史 I004、I007、I016、I017 未处理。

## Validation

- `npm test`：PASS；26 个文件、132 项。
- `mvn test`（backend，`SPRING_DATASOURCE_URL` 指向独立库 `password_form_regression_20261017`）：PASS；80 项。单独的 WechatAuthApiTest 14 项也通过，包含 3 项新增真实 HTTP 测试。
- `npm run build`、`MINI_API_BASE_URL=http://192.168.1.12:8088/api/v1 npm run build:weapp`：PASS；均包含四包 typecheck，后者通过产物地址检查。
- `npm exec vitest run -- --config .cache/password-form/vitest.config.mts`：PASS；2 项，真实小程序认证服务、client、项目 API 和 PostgreSQL，外部微信合同接口单独替代。
- `node .cache/password-form/verify-web.mjs`：PASS；真实 Chrome 的明文切换、焦点和选区、390px/1280px 布局、注册复用。没有截图。
- 本轮修改文件的 Prettier、`git diff --check`：PASS。
- `docker compose build api web`、`docker compose up -d --no-deps --wait --wait-timeout 60 api web`、`node .cache/password-form/verify-running.mjs`：PASS；本地运行镜像匹配本轮构建，健康接口与 Web 实际资源已检查。开发库更新前后数量一致，仍为 0 条微信绑定。
- `node .cache/password-form/verify-mini.cjs`：FAIL（环境）；自动化连接超时及 `page node not found`，未完成页面断言。真机键盘/选区、M06 复验与独立审查：NOT RUN。

## Work Included in This Checkpoint

- `apps/miniprogram/src/pages/auth/index.tsx`、新增 `components/PasswordInput.tsx`、`components/password-input.css`、`services/account-auth.ts`：Codex 本轮表单与控件实现。
- `apps/web/src/App.tsx`、`App.test.tsx`、`i18n/resources.ts`、新增 `components/PasswordInput.tsx`、`PasswordInput.test.tsx`、`password-input.css`：Codex 本轮控件、文案和测试。
- `backend/src/main/java/com/basketballgm/auth/WechatAuthService.java`、`WechatCredentialMapper.java`、`backend/src/test/java/com/basketballgm/auth/WechatAuthApiTest.java`：Codex 本轮错误协议、次数处理和测试。
- `docs/AI_HANDOFF.md`、`docs/plans/current.md`：沿用接手时的未提交状态，本轮刷新实现与验证记录。
- `阶段4验收用例.xlsx`：用户的验收记录文件，保留本地未跟踪。

用户已授权提交与推送本轮实现、测试和状态文档，Owner 继续为 codex。验收表保持本地未跟踪。`.cache/password-form/` 的辅助脚本、日志和独立项目被 Git 忽略；原绑定备份位于 `.cache/m06-unbind-20261017/identity-backup.csv`，目录 700、文件 600，禁止复制原始身份数据到交接文档。

## Next Action

Codex 继续负责 M06“已有账号，去绑定 → 输入错误密码 → 原位置修改并输入正确密码”的验证，同时检查显示按钮、键盘和选区；需要继续排查开发者工具时使用独立项目。合并前按 canonical code-review Skill 安排独立审查。恢复原微信绑定仍须用户单独指令。

## Read Next

- `AGENTS.md` 与 `.agents/skills/handoff/SKILL.md`、`.agents/skills/code-review/SKILL.md`。
- `docs/plans/current.md`（状态、验收、验证与保留项）。
- 两端 `components/PasswordInput.tsx`、小程序 `pages/auth/index.tsx` 与 `services/account-auth.ts`。
- 后端 `WechatAuthService.java`、`WechatCredentialMapper.java` 与 `WechatAuthApiTest.java`。
- `docs/REVIEW_FEEDBACK.md` 与 `docs/reviews/wechat-login-stage4/issues.md`（历史待办）。
- `docs/DECISIONS.md` 的 D-005、D-006、D-007。

## Risks / Unknowns

- 小程序页面自动化未通过，不用 Web、服务测试或构建结果代替真机键盘与选区证据。
- 真实微信全量平台验收、独立审查与历史四项 OPEN 仍待处理。
- 本地验收依赖局域网地址打包；网络切换后须重新构建小程序产物。
- 本地开发数据库含用户验收数据；修改库结构前先备份。

## Handoff Confidence

MEDIUM：当前 Git、前后端测试、两端构建及 Web 实际交互已验证；小程序页面自动化、真机与独立审查存在上述缺口。
