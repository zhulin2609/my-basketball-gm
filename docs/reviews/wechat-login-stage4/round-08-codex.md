# 微信登录阶段 4：I021–I023 最后一轮定向复核

## Metadata

- Task：`wechat-login-stage4`；Round：08；Mode：`verification`。
- Reviewer / 汇总负责人：Codex，`codex-stage4-round08-20261016`。Implementer：Kimi Code，`kimi-stage4-round07-20261015`。
- Date：2026-10-16（Asia/Shanghai）。
- 独立性：本上下文未参与第七轮修复；已读取第六轮原始发现、第七轮修复记录、问题清单、仓库规则、共享 Skill 及 reporting.md、D-007、产品第 5.1 节与 A11、当前计划及历史交接。属于修复后复核，不声称盲审。
- Branch：`mini-app-20261004`；Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit / HEAD：`5450385c5c3b9bdff1950613acd889dcd979e3a7`；Reviewed Commit：`N/A`，修复尚未提交。
- Snapshot ID：`wechat-stage4-round08-20261016`。内容保存于 `.cache/code-review-round08/input/`，清单 `.cache/code-review-round08/snapshot.json`，清单 SHA-256：`389b8b560d6ddf26dd59b6623e0b7d3cee2da7e1807d9895dc903b289c349d74`。178 条相对路径与摘要记录，其中 177 个文本输入保留内容；验收表只记录摘要，没有读取正文或复制内容。无删除项。
- Snapshot 包含：backend 源码、测试、迁移、配置与 pom，根 package.json/package-lock.json，core 用户名规则与测试，共享审查协议，需求、架构、当前状态和历史审查记录。其余未修改代码由上述 HEAD 标识；排除忽略的私有配置、真实凭据、依赖及构建产物。本地忽略目录不保证其他机器可访问，复现未提交输入需保留该快照。
- 比较方式：`git diff HEAD`、`git diff --cached`，另读取未跟踪第六、七轮报告；完整已跟踪输入差异保存为 `.cache/code-review-round08/input.diff`。开始时暂存区为空，已跟踪修改 5 个文件；未跟踪第六轮报告、第七轮报告与验收表。
- Scope：I021–I023 的修复及直接相关回归；实际代码修改仅为 `AuthApiTest.java`，关联架构说明更新为 2–32。Requirements：第六轮 R01–R03、用户本轮最后一轮复核要求、D-007 与 A11。
- 排除范围：第五轮 I004、I007、I016、I017 的重新复核与修复，以及真实微信、扫码、浏览器和 iOS/Android 平台验收。
- Write Scope：本报告、issues.md、docs/REVIEW_FEEDBACK.md、docs/plans/current.md；辅助脚本和日志仅写 Git 忽略目录。第七轮已交付修复并等待独立复核，用户将本轮交给 Codex；本轮由 Codex 单一写入，未启动其他写入 Agent。

## Findings / 逐项复核

本轮未发现范围内需要新增编号的缺陷。

| 来源及严重度              | 修复位置                                                                     | 实际证据及复核结果                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I021 / 第六轮 R01 · minor | `backend/src/test/java/com/basketballgm/auth/AuthApiTest.java:70–78,114–131` | **VERIFIED**。实际注册值为「张三」和「ab」，均恰好两个字符；调用真实 Spring MVC 注册逻辑，检查 201、令牌、数据库持久化计数 2，并验证重复中文用户名返回 409。数据库直接插入两字符值及 32 字符值，拒绝 1 和 33 字符。原有 U+9FFF 接受、U+A000、韩文、空格等拒绝用例保留。独立 PostgreSQL 环境连续两次执行该类，每次 7 项全部通过；完整后端 77 项通过。 |
| I022 / 第六轮 R02 · major | `AuthApiTest.java:37–41,70–78,119–131`                                       | **VERIFIED**。已移除截断随机前缀的两字符用例，新增固定用例的明确清理；两个用例使用后清理「张三」「ab」，32 字符值插入后删除。在本轮独占隔离数据库中连续执行两次，每次结束后均通过 SQL 查询及失败即终止的断言确认三种固定值残留数量为 0；完整后端运行后再次确认 0。候选耗尽与清理条件不匹配的原触发路径已消除。                                       |
| I023 / 第六轮 R03 · minor | `docs/ARCHITECTURE.md:68`                                                    | **VERIFIED**。当前 auth 说明为 2–32，并引用 D-007，与 core、Java、V16 和产品第 5.1 节一致。本轮没有改写该修复或历史迁移。                                                                                                                                                                                                                            |

修复版本均为上述 Snapshot；三项由第七轮 `FIXED_PENDING_REVIEW` 转为本轮 `VERIFIED`，前六、七轮原始报告保持原文。

## Coverage and Validation

### 已核对范围与限制

- 两字符注册确实执行本项目认证逻辑与真实 PostgreSQL；测试输入没有追加长度后缀，没有预设本项目响应。MockMvc 在本进程内调度真实 Spring MVC，不代表独立 HTTP 进程或微信平台验收。
- 长度 1/2/32/33、汉字上边界 U+9FFF 和非法字符的断言有效。长度 33 的数据库拒绝由当前 `varchar(32)` 列或 CHECK 共同保证，本轮没有把该断言描述成只验证 CHECK。
- 清理验证覆盖当前隔离数据库、串行执行及正常成功路径。固定用例名称依赖独占测试资源；本轮未在共享数据库中并发执行测试，未授权测试访问生产数据。已有其他历史用例的清理行为不扩展为本轮新增修复项。
- `AuthApiTest` 的注册、保留名、大小写不敏感重复名、非法字符等 7 项全部运行；完整后端回归覆盖其余服务测试。core 用户名的 5 项测试包括长度、字符范围和 HTML pattern v 模式一致性。
- 第七轮未改变业务实现、前端、依赖或 Flyway 迁移。第六轮对 V16 既有数据和全部 BMP 字符的探针结果保留其 2026-10-15 历史证据，本轮不声称重复执行该遍历。本轮新建数据库实际迁移至 V16，核验 success=true。
- 输入中的 current plan 顶部、AI_HANDOFF 和问题计数仍有旧轮次信息；其历史不一致属于已排除的 I017 范围。本轮依据固定快照更新当前复核状态、全部 23 项计数及入口，不将此状态维护声明为 I017 修复通过。第七轮修复报告仅称“当前工作区”为快照，本轮补充可复现输入和摘要。

### 本轮执行记录

环境：macOS aarch64，Node v24.18.0、OpenJDK 21.0.12.1、Maven 3.9.16、PostgreSQL 16.10。容器 `basketball-gm-test-pg` 开始时已运行。数据库 `codex_stage4_review08_20261016` 为本轮新建并独占，所有 Maven 命令均通过 `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/codex_stage4_review08_20261016` 指向该库。

| Command                                                                                                                                   | Result  | 范围与证据                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node .cache/code-review-round08/snapshot.mjs`                                                                                            | PASS    | 固定 178 条输入，记录 5 文件未提交差异；未跟踪报告已纳入，验收表只保留摘要。                                                                            |
| `cd backend && SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/codex_stage4_review08_20261016 mvn test -Dtest=AuthApiTest`         | PASS    | 第一次 7 项，0 failures/errors/skipped；新库实际迁移至 V16。日志 auth-run1.log。                                                                        |
| `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/codex_stage4_review08_20261016 mvn -f backend/pom.xml test -Dtest=AuthApiTest`    | PASS    | 同一数据库第二次 7 项，0 failures/errors/skipped；日志 auth-run2.log。                                                                                  |
| `docker exec -i basketball-gm-test-pg psql -X -U zhulin -d codex_stage4_review08_20261016 < .cache/code-review-round08/check-cleanup.sql` | PASS    | 每次定向测试及完整后端测试后均执行，三次 fixed_username_residue=0；DO 块对残留记录直接报错。日志 cleanup-run1.log、cleanup-run2.log、cleanup-full.log。 |
| `cd backend && SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/codex_stage4_review08_20261016 mvn test`                            | PASS    | 77 项，0 failures/errors/skipped；实际 Spring/PostgreSQL，微信外部上游沿用 D-006 允许的契约服务器。日志 mvn-full.log。                                  |
| `node node_modules/vitest/vitest.mjs run packages/core/src/username.test.ts --maxWorkers=1`                                               | PASS    | 1 文件、5 项用户名规则测试；日志 username-test.log。                                                                                                    |
| `npm run typecheck`                                                                                                                       | PASS    | core/client/web/miniprogram 四个项目；日志 typecheck.log。                                                                                              |
| 前端完整测试、Web 与小程序构建                                                                                                            | NOT RUN | 本轮修复只涉及 Java 测试和文档；实际执行相关 core 测试与四包 typecheck。第六、七轮的完整前端及构建结果按原日期和范围保留，不计入本轮。                  |
| 真实微信、扫码、浏览器交互及 iOS/Android 平台验收                                                                                         | NOT RUN | 用户限定的本轮范围外；本地测试不证明平台验收通过。                                                                                                      |

本轮日志及辅助脚本均在 `.cache/code-review-round08/`。没有修改源代码、测试断言或超时来获得通过结果。

## Conclusion

**PASS（仅限 I021–I023 及其直接相关修复）**。适用于 `wechat-stage4-round08-20261016`，三项全部 VERIFIED，无新增发现，无本轮风险例外。

整个 `wechat-login-stage4` 的汇总结论仍为 **CHANGES_REQUIRED**：总计 23 项，19 项 VERIFIED、4 项 OPEN，FIXED_PENDING_REVIEW 为 0。四项 OPEN 为 I004、I007、I016、I017，沿用历史报告，本轮未重新复核；真实微信及设备验收仍 NOT RUN。

本轮为当前变更的最后一轮复核，完成后停止，不自动修复、启动后续轮次、提交、推送、合并或发布。

收尾验证（本轮实际执行）：

- 四份输出的 `prettier --check`、`git diff --check`：PASS。
- `node .cache/code-review-round08/validate-docs.mjs`：PASS；使用现有 Prettier Markdown parser 核对 101 个本地链接、23 项状态及 I021–I023 均为 VERIFIED，汇总 19 VERIFIED / 4 OPEN / 0 FIXED_PENDING_REVIEW。
- `node .cache/code-review-round08/snapshot.mjs verify`：PASS；178 条输入中仅三个授权状态文件发生变化；AuthApiTest、ARCHITECTURE.md、历史报告、验收表与其余输入摘要保持一致。HEAD 未改变，暂存区为空；只新增第八轮报告并更新三个状态文件。
- 独立数据库 `codex_stage4_review08_20261016` 已删除，pg_database 查询匹配数为 0；原 PostgreSQL 容器保持运行。本轮脚本、快照与日志保留在 Git 忽略目录。
