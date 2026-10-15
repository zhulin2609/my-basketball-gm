# 微信登录 Stage 4：D-007 用户名长度调整审查

## Metadata

- Task：`wechat-login-stage4`；Round：06；Mode：`independent`。
- Reviewer：Codex，`codex-stage4-round06-20261015`；本上下文未参与目标提交的实现。Implementer：Git author 为 `linkzhu`，提交未记录实施 Agent 的会话标识。
- Date：2026-10-15（Asia/Shanghai）。
- 上下文：按用户要求读取 AGENTS.md、仓库共享 code-review Skill 及 references/reporting.md、D-005/D-006/D-007、产品第 5.1 节及 A11、current plan、issues.md 与 round-05-codex.md；历史记忆仅作为检索线索，事实重新核对仓库。不声称未接触历史报告的盲审。
- Branch：`mini-app-20261004`；Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit：`2bc08e86f85525ef1f3b0cdd3edda93136477719`。
- Reviewed Commit / HEAD：`5450385c5c3b9bdff1950613acd889dcd979e3a7`。
- 比较命令：`git diff 2bc08e86f85525ef1f3b0cdd3edda93136477719 5450385c5c3b9bdff1950613acd889dcd979e3a7`。共 11 个文件，新增 63 行、删除 16 行。
- Scope：用户名下限调整、V16、core/Java/数据库/表单一致性、相关测试与文档、wx.login 错误信息。关联读取未修改的调用方、迁移和架构说明，用于检查受影响行为及遗漏。
- Requirements：用户本轮指令；目标提交中的 D-007、第 5.1 节、A11；D-005 中其余有效规则；D-006 的外部上游替代边界。历史第四、五轮结果均不计为本轮验证。
- 排除范围：I004、I007、I016、I017 的重新审查和状态修改；真实微信、扫码及 iOS/Android 平台验收。此范围排除不表示这些问题已解决或风险已获接受。
- 写入归属：当前计划仍记录上一轮 Codex 已完成审查，本次按用户新授权执行单一审查者写入。Write Scope：本报告；辅助脚本、日志与构建产物仅写入 Git 忽略目录。按 Skill 第 1.4 节，将本轮任务状态记录在报告中，current plan、issues.md、入口和历史报告保持原样。
- 输入状态：开始时暂存与未暂存的已跟踪差异均为空；仅存在未跟踪 `阶段4验收用例.xlsx`，未读取正文、未纳入审查。其 SHA-256 为 `aeb9163e2213c729d0f0f5273306d4b65d4c9d1095de3770fd7621a37c2a2001`。审查对象为已提交版本，无未提交代码快照要求。
- Task Status：DONE（审查与报告交付）；产品验收状态沿用既有记录。

## Findings

### R01 · minor · 新增后端边界测试没有提交两字符用户名

- Location：`backend/src/test/java/com/basketballgm/auth/AuthApiTest.java:66–69`，`acceptsTwoCharacterUsernames`。
- Severity 理由：本地核验的实现规则正确，但本次核心行为缺少对应后端回归保护，影响范围限于验证充分性。
- Trigger / Impact：测试给 `ab`、`张三` 追加 `USER_PREFIX.substring(0, 6)`，实际长度均为 8。即使后端或数据库仍要求至少 3 个字符，这两个成功断言也无法发现该错误；方法名称会误导后续维护者判断覆盖范围。
- Basis：D-007 的 Consequences 明确要求覆盖两字符合法与单字符非法；用户本轮要求核验相关边界测试。
- Evidence：第 29 行定义 `USER_PREFIX = "auth-" + UUID 前八位 + "-"`。本轮实际 `mvn test` 通过后，独立测试库中留下 `abauth-e`、`张三auth-e`，`char_length` 均为 8。core 测试确实覆盖长度 1、2、32、33；后端现有测试覆盖长度 1、33、U+9FFF 及非法字符，数据库测试没有长度 2 的插入断言。本轮额外的 Java/数据库探针验证了长度 2 的实现行为，但这些本地忽略脚本不构成仓库长期回归测试。
- Repair Direction：后端注册使用实际长度为 2 的中文及 ASCII 用户名，在隔离测试资源中验证成功和账号持久化；数据库增加长度 2 成功、长度 1 失败的直接断言，并保留长度及字符范围上边界检查。测试数据安排同时满足 R02 的清理要求。

### R02 · major · 新增注册测试遗留低数量候选名称，重复执行可能返回 409

- Location：`backend/src/test/java/com/basketballgm/auth/AuthApiTest.java:68–69`；关联清理条件位于第 36–38 行，前缀生成位于第 29 行。
- Severity 理由：新增测试会污染持久测试库并使重复测试出现与产品正确性无关的失败，影响持续验证的可靠性。
- Trigger / Impact：`substring(0, 6)` 只保留 `auth-` 和 UUID 的第一个十六进制字符，每类用户名仅有 16 个候选。`cleanUsers()` 仅删除以完整 `auth-xxxxxxxx-` 开头的用户名，两条新记录均无法匹配。后续测试选择相同候选时，真实注册接口返回 409，测试仍期待 201。
- Basis：共享 Skill 的真实、可复现验证要求及仓库测试资源隔离原则；现有 `registersNormalUsernameAndRejectsDuplicate` 明确验证重复名返回 409。
- Evidence：本轮完整后端测试结束后，通过真实 PostgreSQL 查询确认两条新增记录仍存在，名称与长度见 R01。有限候选集合及清理不匹配由源码确认；若每次成功运行后均保留原数据库，最多 16 组名称可注册，第 17 次必然无法继续成功。该上限为代码推断，本轮未声称执行了 17 次测试或实际观察到这项 409。
- Repair Direction：为实际两字符测试确定明确的数据隔离及精确清理方式，避免截断随机前缀造成候选耗尽；在同一测试数据库连续执行相关测试，确认每次成功且不留下新增账号。不要改成更长用户名规避长度边界。

### R03 · minor · 当前架构说明仍声明用户名为 3–32 字符

- Location：`docs/ARCHITECTURE.md:68`。
- Severity 理由：影响当前实现说明的准确性，不影响本轮已验证的运行行为。
- Trigger / Impact：架构文档当前 `auth` 模块说明声称 Java、core 与数据库统一使用 3–32；目标提交已经统一为 2–32。该段没有历史日期或旧版本标记，后续实现与验收可能据此采用旧下限。
- Basis：AGENTS.md 将 ARCHITECTURE.md 定义为当前系统说明；D-007 已接受的新长度要求。
- Evidence：目标提交第 68 行仍为 3–32；`UsernameRules.java:9`、`packages/core/src/username.ts:7,10`、V16 第 5 行以及本轮规则探针均为 2–32。此项来自本次规则修改遗漏的关联文档，不重新审查 I017 的历史计划状态问题。
- Repair Direction：将当前架构的用户名长度说明更新为 2–32，并引用 D-007。历史迁移、历史报告及带有明确历史上下文的验证记录继续保留原始内容。

## Coverage and Validation

### 已核对且未发现本次实现缺陷的范围

| 检查项                          | 结论与证据边界                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core / Java / PostgreSQL 字符集 | 均接受 U+4E00–U+9FFF、ASCII 大小写字母、数字、下划线和连字符。core 与 Java 分别遍历全部 65,536 个 BMP code unit；PostgreSQL 根据实际约束表达式检查 63,487 个可表示的 BMP 字符，排除 PostgreSQL text 不支持的 NUL 及 surrogate 区间。实际结果与按数字范围独立计算的允许集合一致。                                                                                                  |
| 长度 2–32                       | core、Java 探针覆盖单字符拒绝、两字符接受、32 接受、33 拒绝；真实 PostgreSQL 插入覆盖两字符及 U+9FFF、单字符和超长拒绝。允许字符均属于 BMP，各处有效用户名的计数一致。                                                                                                                                                                                                            |
| HTML pattern                    | Web `App.tsx:1137–1139` 使用 minLength 2、maxLength 32 和 core 导出的 `USERNAME_PATTERN_SOURCE`。core 正则与 HTML 字符串同处一个模块，维护为两个字面量；本轮用真实 JS v 模式验证全部 BMP 字符及长度边界，行为一致。没有运行真实浏览器表单验收。                                                                                                                                   |
| 小程序表单                      | `pages/auth/index.tsx:114–120,189–196` 调用共享 `isValidUsername`，提示及 placeholder 为 2–32，maxlength 32。Taro Input 未新增 minLength 属性，下限由共享规则验证。                                                                                                                                                                                                               |
| 后端入口                        | AuthRequest、WechatBindRequest、WechatRegisterRequest 继续共同使用 `UsernameRules.PATTERN`；唯一索引、保留名和不自动改写用户名的逻辑未被本次差异改变。                                                                                                                                                                                                                            |
| V16 与旧数据                    | 差异中迁移文件只有新增 V16，V1–V15 未改写。V16 只重建 CHECK，没有 UPDATE/DELETE。V15 的允许集合完整包含于 V16；满足已验证 V15 约束的既有记录，包括 null，继续有效。本轮真实 PostgreSQL 使用当前 users 结构及原始 V15/V16 SQL，在事务内保留并逐列比较三条既有记录，验证迁移不改变记录；随后实际插入四个两字符值并拒绝八个非法值。事务结束清理临时表。                              |
| 新库迁移                        | 完整 Maven 测试使用新建独立数据库；Flyway 实际执行 V1–V16，16 个迁移验证通过。数据库查询确认 V15/V16 success=true、最终 CHECK 为 2–32 且 convalidated=true；测试库非法用户名数量为 0。未读取生产数据；既有生产数据兼容结论以其已经满足 V15 约束为前提。                                                                                                                           |
| wx.login 错误                   | `wechat-auth.ts:4–13` 的成功结果缺少 code 分支将非空 errMsg 写入 Error.message；没有 errMsg 时明确报告未返回授权码。实际 Taro 依赖的 `processApis` 在 fail 回调 reject(res)，经 auth 页面 catch → authErrorMessage → errorMessage 读取 errMsg，再由 failed 状态展示。有效 code 仍原样返回；本次变化不修改登录交换和凭据处理。真实微信失败响应及页面交互 NOT RUN，未伪造平台结果。 |
| 旧规则检索                      | 当前 Web 中英文提示、小程序提示及 placeholder、core 规则和 Java 生效正则没有残留 3–32。当前架构说明残留见 R03。`UsernameRules.java:5` 的 V14 注释引用为基线已有的过时说明，本次未作为新增缺陷计数；当前生效约束为 V16。V7/V14/V15 的旧规则是历史迁移，保持原文符合追加迁移要求。                                                                                                  |

### 文档与历史证据

- D-007 明确只替代 D-005 的长度下限，其余身份、唯一性、保留名及字符集要求继续有效；产品第 5.1 节和 A11 已更新。D-005 的原始 3–32 描述与 D-007 的历史 Context 不作为当前表单残留计数。
- current plan 顶部仍为第五轮 DONE / 产品 VALIDATING，记录 I004、I007、I016、I017 OPEN；其中按日期保存的旧长度和旧测试数字不代表目标提交验证。本轮证据统一绑定上述完整 SHA，单独记录在本报告。
- 本次按用户明确指定执行完整 npm 测试。其进程通过仅证明现有断言通过；I016 涉及的预设本项目响应测试仍不作为真实项目 API 或平台验收证据，本轮不修改 I016 状态。D-006 对微信外部上游的许可边界保持不变。

### 本次执行记录

环境：Apple Silicon macOS，Node v24.18.0、npm 11.16.0、OpenJDK 21.0.12.1、Maven 3.9.16、PostgreSQL 16.10。`basketball-gm-test-pg` 检查时已经运行，无需执行 docker start。后端通过 `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/codex_review06_20261015` 使用本轮新建隔离数据库，避免修改已有测试库。

| Command                                                                                                                                                                                        | Result  | 实际范围、结果与限制                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test -- --maxWorkers=1`（首次）                                                                                                                                                           | FAIL    | 25 文件，123 项通过、5 项失败；均为 App.test.tsx 的 5000ms 超时。该次与后端验证、构建存在执行时间重叠；资源竞争仅为推断，未据此判定产品回归。日志 npm-test.log。                        |
| `npm test -- --maxWorkers=1`（复验）                                                                                                                                                           | PASS    | 同一源码与相同命令，25 文件、128 项全部通过，95.10 秒。未更改测试、超时配置或断言。首次失败记录保留。日志 npm-test-rerun.log。                                                          |
| `npm run typecheck`                                                                                                                                                                            | PASS    | core/client/web/miniprogram 四个项目；日志 typecheck.log。                                                                                                                              |
| `npm run build`                                                                                                                                                                                | PASS    | Web 构建完成；主资源 600.92 kB，保留体积提示；日志 build.log。                                                                                                                          |
| `npm run build:weapp`（首次）                                                                                                                                                                  | FAIL    | 编译完成后 verify-dist.mjs 因缺少 MINI_API_BASE_URL 退出 1，属于已有构建前提未满足；日志 build-weapp.log。                                                                              |
| `MINI_API_BASE_URL=http://127.0.0.1:8080/api/v1 npm run build:weapp`                                                                                                                           | PASS    | 四包类型检查、小程序编译及地址注入校验通过；common.js 286 KiB，保留体积提示。提供仅用于本机编译验证的地址，未修改源码或私有配置；产物不作为真机或发布制品。日志 build-weapp-rerun.log。 |
| `cd backend && SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/codex_review06_20261015 mvn test`                                                                                        | PASS    | 77 项，0 failures/errors/skipped；新库 Flyway V1–V16、真实 Spring/业务逻辑/PostgreSQL。外部微信使用仓库现有契约上游，不代表平台验收；日志 mvn-test.log。                                |
| `node .cache/code-review-round06/rules-probe.mjs`                                                                                                                                              | PASS    | core 与 HTML v 模式 65,536 字符及 9 个边界值；另检查 LF/CR/CRLF/U+2028/U+2029 后缀均拒绝；日志 rules-probe.log。                                                                        |
| `java --class-path backend/target/classes .cache/code-review-round06/RulesProbe.java`                                                                                                          | PASS    | 使用实际编译的 UsernameRules，65,536 字符及 10 个边界值；日志 java-probe.log。                                                                                                          |
| `docker exec -i basketball-gm-test-pg psql -X -U zhulin -d codex_review06_20261015 -v v15=/home/V15-round06.sql -v v16=/home/V16-round06.sql < .cache/code-review-round06/migration-probe.sql` | PASS    | 原始迁移文件通过 docker cp 传入容器；真实 CHECK、既有行保留、两字符及非法值、63,487 个字符全部通过。首次尝试宿主 psql 报 bad CPU type，改用已有容器内 psql；日志 migration-probe.log。  |
| PostgreSQL 元数据及残留数据查询                                                                                                                                                                | PASS    | 最终迁移版本、CHECK 验证状态、非法数据计数；同时确认 R01/R02 的两条长度 8 的遗留记录。业务结论不由查询进程退出码替代；证据见 db-state.log、residual-query.log。                         |
| `git diff --check 2bc08e8..5450385`                                                                                                                                                            | PASS    | 目标提交差异无空白错误。                                                                                                                                                                |
| 真实微信、浏览器交互、扫码及 iOS/Android 平台验收                                                                                                                                              | NOT RUN | 本轮明确排除；本地规则、构建及集成测试不代表平台验收。                                                                                                                                  |

辅助脚本及原始运行日志位于本地 Git 忽略目录 `.cache/code-review-round06/`，未进入提交，不保证其他机器可访问。本报告中的代码位置、命令与结果保留可复核依据。

## Conclusion

`CHANGES_REQUIRED`：目标提交 `5450385c5c3b9bdff1950613acd889dcd979e3a7` 的本次差异存在 1 项 major（R02）和 2 项 minor（R01、R03）。用户名规则、V16 兼容性及错误展示调用路径的本地覆盖范围见上文；没有已批准的本轮风险例外。

本轮只交付审查意见，未执行修复。原始发现保留本报告 R01–R03 编号，尚未由汇总负责人分配新的 I 编号；历史问题清单及其 4 项 OPEN 保持原状态，本报告不能替代整个阶段 4 的汇总结论。真实微信平台验收仍未执行。

收尾：HEAD 与审查提交一致，已跟踪文件无暂存或未暂存修改，仅新增本报告；验收表格 SHA-256 与开始时一致。独立测试数据库已删除，pg_database 查询匹配数为 0；容器内本轮临时 SQL 文件已删除，原 PostgreSQL 容器保持运行。报告格式与差异检查在最终交付前执行；业务实现、仓库测试、私有配置及历史报告保持原样，未提交、推送、合并或发布。
