# Web 认证入口关闭：第一轮独立审查

## Metadata

- Task：web-auth-entry-disabled-20261031。
- Round：01。
- Mode：independent。
- Reviewer：Codex；会话 `/root/web_auth_review`；任务标识 `codex-web-auth-review-20261031`。
- Implementer：Codex；任务标识 `codex-web-auth-entry-20261031`。
- Date：2026-11-01（Asia/Shanghai，UTC+08:00）；测试执行始于 2026-10-31 23:58。
- Branch：develop。
- Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit / HEAD：`b0969bd910abfbf7bce16566930606dd781e10aa`。
- Reviewed Commit：N/A；本轮包含未提交修改。
- Requirements：本轮审查任务中的用户需求、当前计划的 Goal / Acceptance Criteria / Write Scope，以及 D-009；以 `web-auth-disabled-01` 中的文件版本为准。
- Write Scope：仅新增本报告，写入 `.cache/web-auth-review/` 下本人的运行日志；既有测试命令可以生成正常忽略的测试产物。实施者暂停写入期间，审查者串行运行验证；未修改实现、测试、既有文档或任务状态。

审查者没有参与实施。独立检查前读取了用户需求、仓库规则、canonical code-review Skill、reporting.md、当前计划和实现差异。检索 current plan 时使用带上下文的命令，意外接触其 Progress / Validation 摘要以及部分历史验证记录，因此本轮不声明完全隔离于实施者评价。未读取实施者测试日志；先独立检查代码并形成“无确认缺陷”的原始结果，再读取 `validation.md` 核对覆盖边界；未读取其他审查报告。历史记忆仅用于定位审查协议，当前规则与代码均重新读取。

## Snapshot and Scope

- Snapshot ID：`web-auth-disabled-01`。
- 改动清单：`.cache/web-auth-review/files.txt`，包含 12 个 tracked 修改和 2 个 untracked 文件。
- 完整校验清单：`.cache/web-auth-review/snapshot.sha256`，共 20 个输入，另含仓库规则、依赖清单及锁文件、Vitest / Vite 配置和真实后端启动脚本。
- 内容归档：`.cache/web-auth-review/changed-files.tar.gz`；差异：`.cache/web-auth-review/changes.patch`。未修改的源码由上述 HEAD 提供，改动文件由归档提供；删除项为零。
- 暂存区为空。比较命令为 `git diff -- <本轮实现、测试和文档路径>`，另以 `git ls-files --others --exclude-standard` 确认并完整读取新增 `apps/web/src/auth-disabled.test.tsx`。当前计划只核对本任务范围，历史任务不作为本轮实现评价对象。
- 开始及结束执行 `shasum -a 256 -c .cache/web-auth-review/snapshot.sha256`：均 PASS，20 个输入全部一致。日志为 `.cache/web-auth-review/reviewer-snapshot-start.log` 和 `reviewer-snapshot-end.log`。
- 排除项：本地环境与凭据、构建输出、缓存、测试日志和数据库不属于源码快照；审查报告产生于冻结之后。快照和日志位于忽略目录，仅在本机保存，不能假定其他检出目录可访问。

归档摘要：

- `files.txt`：`49c1bca85eb2257660566664296b1f05b76c5f8e5f61a6532850de77458b0f11`。
- `snapshot.sha256`：`c3e30a6972bd5320d299a5f176d5fe9debb19c457a962db325ffd455626c3d0d`。
- `changed-files.tar.gz`：`a4235ead93d12555691d97032dad2d6b07550eb098a21f3377844f614b60bb50`。
- `changes.patch`：`b31a69fb39e69fb0251c7e343a1572964f4e7d13a9fa95ed85b6bb545b8e6b0d`。

纳入 Web 功能开关、hash 路由、入口条件、中英文游客提示、全部修改的 Web 测试、环境模板和对应架构与决策文档。核对范围内没有小程序、后端、共享包或数据库结构变更。既有模块仅为理解调用关系及测试真实性而读取。

## Findings

未发现本轮变更引入的已确认缺陷。blocker：0；major：0；minor：0。

## Coverage and Validation

已核对：

1. `readWebAuthEnabled` 对缺省与 `false` 返回关闭，仅 `true` 返回开启；其他值立即抛出配置错误。App 还要求 API 配置，URL 和 localStorage 不能覆盖构建配置。
2. `useHashRoute` 在初始 state、hash 事件及内部 navigate 三条路径中限制认证路由；初始化得到的 view 已为 players，认证组件不会先挂载。不可用认证地址通过 `replaceState` 改为 `#/players`。测试覆盖四类认证 hash、重新挂载、hash 变化、真实 history 前进后退与内部调用，并检查历史长度和渲染记录。
3. 顶部按钮、已有游客进度按钮、社区游客复制按钮与认证提示均受开关限制；社区独立开启时仍保持认证关闭。中英文游客提示保留浏览器存储及清除网站数据影响的说明。
4. 有效会话仍由原有读取路径恢复，账号名称、AI 设置与退出入口保持原有条件。真实接口验证账号阵容读取和保存、退出后的游客数据恢复及云端记录保留；服务端拒绝会话后不再提供认证入口。
5. 游客球员修改、阵容保存、规则模拟及重新加载后的本地恢复均有实际执行断言；新测试检查游客工作区原文未被账号操作改变。
6. 开启模式保留原测试，通过真实用户名密码登录、注册和扫码票据回归。新增测试未删除旧断言；测试代理转发真实 Spring Boot 响应，未替换项目 API。测试数据库名称隔离校验与 SQL 操作范围均已检查。微信外部上游按 D-006 使用契约服务。
7. `.env.example`、D-009 与架构说明匹配当前实现；D-005 被替代部分保留明确引用。未发现本轮文档与实现差异。

本轮实际运行，版本均为 `web-auth-disabled-01`：

- Command：`npm test -- apps/web/src/auth-disabled.test.tsx apps/web/src/lib/features.test.ts apps/web/src/scan-login.test.tsx`。
  Result：PASS，3 个文件、18 项测试，退出码 0。真实 Spring Boot 与独立 PostgreSQL `stage4_frontend_1793462320513`；日志 `.cache/web-auth-review/reviewer-tests.log`，服务证据 `.cache/integration-tests/stage4_frontend_1793462320513/`。
- Command：`npm test -- apps/web/src/App.test.tsx apps/web/src/community-disabled.test.tsx`。
  Result：PASS，2 个文件、30 项测试，退出码 0。真实 Spring Boot 与独立 PostgreSQL `stage4_frontend_1793462362145`；日志 `.cache/web-auth-review/reviewer-existing-regressions.log`，服务证据 `.cache/integration-tests/stage4_frontend_1793462362145/`。
- Command：`npm run typecheck`。
  Result：PASS，core、client、Web、小程序四个 workspace，退出码 0；日志 `.cache/web-auth-review/reviewer-typecheck.log`。
- Command：`npx prettier --check apps/web/src/App.tsx apps/web/src/App.test.tsx apps/web/src/auth-disabled.test.tsx apps/web/src/community-disabled.test.tsx apps/web/src/scan-login.test.tsx apps/web/src/i18n/resources.ts apps/web/src/lib/features.ts apps/web/src/lib/features.test.ts apps/web/src/lib/hash-route.ts docs/ARCHITECTURE.md docs/DECISIONS.md docs/plans/current.md`。
  Result：PASS，退出码 0；日志 `.cache/web-auth-review/reviewer-format.log`。
- Command：`git diff --check`。
  Result：PASS，退出码 0；核对 tracked 差异的空白错误。

两次测试均正常结束，脚本负责停止其启动的 Spring Boot 与微信契约服务。本轮没有启动浏览器或预览服务。

未验证及证据边界：

- 完整前端测试、生产构建、浏览器 DOM / 键盘 / 网络和屏幕尺寸：本审查者 NOT RUN。实施者在同任务 `validation.md` 记录 32 文件 / 180 项通过、构建通过和浏览器检查通过；本轮只核对该记录与代码及测试覆盖的关系，没有把这些记录计为本人执行结果。
- 真实微信平台、设备扫码、生产部署及后端完整测试：NOT RUN；本轮未修改这些实现，也未获得生产操作授权。扫码集成测试只证明真实项目 API 与数据库对契约上游的处理行为。
- 会话失效运行验证覆盖真实服务端 401；没有单独等待 JWT 自然到期。AI 设置本轮检查入口保留及原有授权条件，没有另行写入真实外部 AI 凭据。
- 实施者记录的 390 像素球员列表横向溢出属于既有未修改区域，本轮未重复浏览器验证，未将其作为本次变更缺陷。

## Conclusion

PASS。适用于 `web-auth-disabled-01` 的 Web 认证入口关闭变更和上述覆盖范围。受影响的 5 个测试文件共 48 项实际通过，四包 typecheck、格式检查和前后快照校验通过。没有需要用户批准延期的确认缺陷；平台和浏览器验证边界如上。本结论不授予提交、推送、合并或发布权限。
