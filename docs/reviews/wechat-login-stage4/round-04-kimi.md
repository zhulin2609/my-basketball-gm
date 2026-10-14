# 微信登录阶段 4：第三轮复核发现的核验与修复报告

## Metadata

- Task：`wechat-login-stage4`；Round：04；Mode：verification（第三轮发现的核验 + 修复记录）。
- Reviewer / 修复执行：Kimi Code，会话标识 `kimi-stage4-round04-20261014`；Implementer：Kimi Code；独立复核留待 Codex。
- Date：2026-10-14（Asia/Shanghai）。
- Branch：`mini-app-20261004`；Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。
- Base Commit：`b87d67f2eaba02f1db31abec822bda3c9f15e3bd`；Reviewed Commit：`N/A`。
- HEAD：`024f7f4c472b0845928a144abd086d8cffd0bbd0`；修复后版本：本轮工作区未提交修改。
- Snapshot：修复后快照即当前工作区；起止核对见下方验证。修复前基线为 HEAD `024f7f4` 的已提交内容（第三轮复核对象）。
- Scope：第三轮报告 R01–R12 涉及的路径与相关回归；需求为产品文档第 4.2、4.3、5、11 节与 D-005。
- Write Scope：本报告、`issues.md`、`docs/REVIEW_FEEDBACK.md`、`docs/AI_HANDOFF.md`、`docs/plans/current.md` 及授权范围内的实现修复。
- 上下文来源声明：已读取 round-01、round-02、round-03 报告与问题清单，属于针对历史发现的核验与修复，不构成独立审查。本轮未使用 mock；测试均使用真实磁盘存储、真实本地 HTTP 服务器或真实 PostgreSQL。

## 逐项核验与修复

### R01 / I002 · blocker · 切换期间和迟到错误仍能影响当前数据源

- 核验：成立。第二轮只在 attach 时取消旧订阅，加载期间旧通知仍可写回；旧数据源的迟到错误也无代次隔离。
- 修复：`guest-runtime.ts` 在加载开始时即取消旧订阅；`refreshAsync`/`refresh` 绑定发起时的数据源，旧数据源的迟到错误直接丢弃；`account-store.ts` 的认证请求统一捕获 401 并通知运行时，运行时仅当全局会话未切换到其他账号时恢复游客工作区。
- 验证：「切换数据源后旧数据源的写入通知不会写回快照」与「写操作收到 401 时通知运行时，草稿保留」等测试通过；`npm test` 128 项通过。

### R02 / I004 · major · 写操作的 401 未触发账号退出状态

- 核验：成立。保存、对战等写路径不经过刷新包装的 401 处理。
- 修复：见 R01；账号数据源全部读写经 `guarded` 捕获 401 并回调运行时；运行时按会话代次恢复游客工作区。
- 验证：同上；`npm test` 通过。

### R03 / I007 · major · 迟到导入仍可清除更新后的游客工作区

- 核验：成立。导入等待期间不校验会话与工作区版本，成功响应后无条件清理。
- 修复：`runtime.ts` 的 `importGuestProgress` 在发起时记录会话标识与工作区 id、updatedAt，成功响应后逐项核验，任一变化则保留本地数据不再清理。
- 验证：`npm test` 通过；导入主流程由后端集成测试覆盖。

### R04 / I009 · major · 幂等成功路径遗漏凭证消费及并发注册重查

- 核验：成立。幂等解析返回会话但不消费当前凭证；注册预检查直接冲突。
- 修复：`WechatAuthService` 的绑定与注册冲突消解路径均消费当前凭证（行锁保护）；注册预检查发现用户名占用时先核验该身份的已完成结果再决定冲突或幂等；锁等待期间已由并发完成的按幂等处理。
- 验证：既有并发绑定/注册测试通过；顺序绑定测试新增两个凭证均已消费的断言；`mvn test` 76 项通过。

### R05 / I010 · major · 语句开始时间无法覆盖行锁等待后的过期

- 核验：成立，且第三轮建议的 `clock_timestamp()` 经本机 PostgreSQL 实际探测仍被否定（锁释放后 UPDATE 仍消费，已过期约 2 秒）。
- 修复：票据 confirm/reject/claim 与凭证消费改为先取行锁（`for no key update`），再按取得锁后的实际时刻核验状态与有效期；核验在事务内完成。
- 验证：`WebLoginTicketApiTest.ticketExpiringDuringRowLockWaitCannotBeConsumed` 使用真实 PostgreSQL 行锁与完整 HTTP 领取路径复现，修复后领取返回 410；`mvn test` 通过。

### R06 / I013 · major · 前端汉字范围修复未进入目标提交

- 核验：成立。第二轮只迁移了数据库约束，core 前端规则仍为 一–龥。
- 修复：`packages/core/src/username.ts` 统一为 U+4E00–U+9FFF（一–鿿），与 Java 及 V15 约束一致；新增边界用例（龥、龦、鿿 接受；U+A000 拒绝；HTML pattern 一致）。
- 验证：core 测试与后端 API、数据库边界用例一致通过；`npm test`、`mvn test` 通过。

### R07 / I015 · major · 并发及失败路径仍可绕过微信调用保护

- 核验：成立。计数与插入非原子；同票据并发二维码请求各自调用上游；失败不写缓存。
- 修复：票据创建的额度检查与插入在同一事务内经咨询锁串行化；二维码按票据 `computeIfAbsent` 合并并发，失败结果短期缓存并在冷却期内不再调用上游；生成前保留进程内限频。
- 验证：新增「并发创建不突破绑定配额」（35 并发 → 30 成功、5 限频）与「同票据并发二维码共享一次上游调用」测试；`mvn test` 通过。

### R08 / I016 · major · 测试仍生成替代认证和业务响应

- 核验：事实存在。测试的传输与数据库真实，微信上游与契约响应由本地服务器扮演。
- 处理：保留全部断言与验证能力；规则解释与剩余风险交由用户决定，状态保留 `NEEDS_CONFIRMATION`，具体取舍问题见下方「待用户决定」。
- 验证：相关测试保持通过；真实微信平台验证继续 NOT RUN。

### R09 / I017 · minor · 当前任务说明仍混有过期状态

- 核验：成立。计划与交接文件存在与已提交状态矛盾的描述。
- 修复：更新 `docs/plans/current.md` 的 Goal、Open Questions、Completion；`docs/AI_HANDOFF.md` 刷新为当前状态索引。
- 验证：文档格式与差异检查通过。

### R10 / I018 · major · 认证成功后后续按钮保持禁用

- 核验：成立。`submit` 成功路径不复位 `submitting`，导入选择与扫码确认按钮保持禁用。
- 修复：`submit` 增加 `finally` 复位；失败路径保持原有处理。
- 验证：typecheck 与构建通过；真实微信交互的设备验收保留。

### R11 / I019 · major · 草稿恢复跨越条件 Hook

- 核验：成立。`useRef` 位于失败分支提前返回之后，恢复后渲染改变 Hook 数量。
- 修复：`latestLineup` 的 `useRef` 移到条件返回之前，赋值保留在 ready 分支。
- 验证：typecheck 与构建通过；真实存储失败的页面流程保留给平台验收。

### R12 / I020 · major · 绑定请求头未加入 CORS 允许列表

- 核验：成立。预检因缺少该请求头被拒绝。
- 修复：`WebConfig` 的 `allowedHeaders` 增加 `X-Login-Ticket-Binding`。
- 验证：`mvn test` 通过；跨域预检行为由后端集成环境覆盖。

### I011 · FIXED_PENDING_REVIEW · 扫码领取的运行验证

- 核验现有修复：发现实际缺陷——领取遇到服务器临时错误（无结构化 code 的 5xx）会被当作终态结束，不再重试。
- 修复：仅明确的终态 code（过期/拒绝/已领取/已处理）结束流程，其余失败保持轮询并在下一次领取。
- 运行验证：新增 `apps/web/src/scan-login.test.tsx`，真实 App、真实本地 HTTP 服务器与真实定时器：领取失败后保持轮询并领取成功（实际领取 2 次）、票据过期后显示明确结束状态并可重新发起。两项通过。

## 本轮执行的验证

| Command / 检查                                      | Result           | 范围与说明                                                                    |
| --------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `mvn test`（backend，真实 PostgreSQL 16.10 测试库） | PASS             | 76 项全部通过；含锁等待过期复现、并发配额、二维码合并、幂等消费凭证等新增用例 |
| `npm test -- --maxWorkers=1`                        | PASS             | 25 个测试文件、128 项全部通过；含扫码面板运行验证与数据源隔离回归             |
| `npm run typecheck`                                 | PASS             | 四包；Web tsconfig 增加 node 类型以覆盖测试服务器引用                         |
| `npm run build`、`npm run build:weapp`              | PASS             | 两端生产构建                                                                  |
| `npm run format:check`、`git diff --check`          | PASS             | 格式与差异检查                                                                |
| PostgreSQL 锁等待直接探测（`clock_timestamp` 方案） | FAIL（方案否定） | 探测证实条件更新在锁释放后仍消费，已改用行锁方案                              |
| 真实微信平台、iOS/Android 真机、Web 浏览器手动交互  | NOT RUN          | 平台凭据与设备验收由用户侧继续                                                |

## 待用户决定

- I016：已决定。用户于 2026-10-14 接受「真实 HTTP + 真实 PostgreSQL + 本地契约服务器扮演外部上游」的测试形态，决策归档为 `docs/DECISIONS.md` D-006，I016 记为 DISMISSED。

## 结论

`INCOMPLETE`：12 项 OPEN 与 I011 已核验并修复，修复项均为 `FIXED_PENDING_REVIEW`，待 Codex 独立复核；I016 经用户决定接受测试形态（D-006），记为 DISMISSED；真实平台验收未执行。
