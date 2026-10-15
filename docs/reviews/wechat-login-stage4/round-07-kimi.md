# 微信登录阶段 4：D-007 用户名长度审查发现的修复记录

## Metadata

- Task：`wechat-login-stage4`；Round：07；Mode：verification（第六轮发现的核验与修复记录）。
- Reviewer / 修复执行：Kimi Code，会话标识 `kimi-stage4-round07-20261015`；Implementer：Kimi Code；独立复核留待 Codex。
- Date：2026-10-15（Asia/Shanghai）。
- Branch：`mini-app-20261004`；Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit：`2bc08e86f85525ef1f3b0cdd3edda93136477719`；Reviewed Commit：`5450385c5c3b9bdff1950613acd889dcd979e3a7`（第六轮审查对象）。
- HEAD：`5450385c5c3b9bdff1950613acd889dcd979e3a7`；修复后版本：本轮工作区未提交修改。
- Snapshot：修复后快照即当前工作区；开始前 `git status --short` 仅有第六轮报告与验收表两个未跟踪文件。
- Scope：`round-06-codex.md` 的 R01–R03；需求为 D-007、产品文档第 5.1 节与 A11。
- Write Scope：本报告、`issues.md`、`docs/REVIEW_FEEDBACK.md`、`docs/plans/current.md`、R01–R03 涉及的测试与架构文档。
- 上下文来源声明：已读取第六轮报告与相关问题记录，属于针对其发现的核验与修复，不构成独立审查。round-05 的 I004、I007、I016、I017 按授权边界未处理。

## 逐项核验与修复

### R01 · minor · 新增后端边界测试没有提交两字符用户名

- 核验：成立。原测试给两字用户名追加随机前缀，实际长度 8，无法发现下限错误。
- 修复：`AuthApiTest.acceptsTwoCharacterUsernames` 改为注册恰好两个字符的「张三」（中文）与「ab」（ASCII），断言注册成功、返回令牌、数据库实际持久化两条记录、重复注册返回 409。
- 验证：见下方命令记录。

### R02 · major · 新增注册测试遗留低数量候选名称，重复执行可能返回 409

- 核验：成立。截断前缀只剩 16 个候选且清理条件不匹配，会污染测试库并使重复执行失败。
- 修复：测试开始前按名精确删除本条用例使用的记录，`@AfterEach` 增加同样的精确清理；不追加前后缀，输入保持真实两字符。`databaseConstraintMatchesTheApiRule` 增加数据库层断言：长度 2 插入成功、长度 1 与 33 拒绝、长度 32 成功，使用后均精确清理。
- 验证：同一测试数据库连续两次执行 `mvn test -Dtest=AuthApiTest` 均通过；结束后查询 `username in ('张三','ab')` 残留为 0。

### R03 · minor · 当前架构说明仍声明用户名为 3–32 字符

- 核验：成立。`docs/ARCHITECTURE.md` 第 68 行保留 3–32 的旧说明。
- 修复：更新为 2–32 并引用 D-007；历史迁移与历史报告保持原文。
- 验证：文档格式与差异检查通过。

## 本轮执行的验证

| Command / 检查                                                          | Result  | 范围与说明                                                                       |
| ----------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `mvn test -Dtest=AuthApiTest`（同一测试库连续两次）                     | PASS    | 每次 7 项全部通过；第二次运行证明可重复执行；结束后 `张三`/`ab` 残留计数为 0     |
| `mvn test`（backend，真实 PostgreSQL 16.10 测试库 5432）                | PASS    | 77 项全部通过，含新增长度边界断言                                                |
| `npm test -- --maxWorkers=1`                                            | PASS    | 25 个测试文件、128 项全部通过                                                    |
| `npm run typecheck`                                                     | PASS    | core、client、web、miniprogram 四包                                              |
| `npm run build`                                                         | PASS    | Web 生产构建                                                                     |
| `MINI_API_BASE_URL=http://192.168.1.12:8088/api/v1 npm run build:weapp` | PASS    | 小程序编译与地址注入校验通过；该地址为本机当前局域网验收地址，产物不作为发布制品 |
| `npm run format:check`、`git diff --check`                              | PASS    | 格式与差异检查                                                                   |
| 真实微信平台、iOS/Android 真机                                          | NOT RUN | 本轮仅测试与文档修复，平台验收保持既有状态                                       |

## 结论

`INCOMPLETE`：R01–R03 已核验并修复，对应 I021–I023 标记 `FIXED_PENDING_REVIEW`，待 Codex 独立复核；round-05 的 I004、I007、I016、I017 按授权边界未处理，保持原状态。
