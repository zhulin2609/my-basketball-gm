# 微信登录 Stage 4：最后一轮定向复核

## Metadata

- Task：wechat-login-stage4；Round：05；Mode：verification。
- Reviewer / 汇总负责人：Codex，codex-stage4-round05-20261014；Implementer：Kimi Code，kimi-stage4-round04-20261014。
- Date：2026-10-14（Asia/Shanghai）。
- 上下文：读取第三、四轮报告、问题清单、AGENTS.md、共享 Skill 及报告规范、交接、当前计划、产品第 4.3/5/11 节、D-005/D-006 和相关架构；属于修复后定向复核，不声称盲审。
- Branch：mini-app-20261004；Worktree：`/Users/zhulin/Workspace/my-basketball-gm`。用户已确认 Kimi 停止写入并授权 Codex 接管。
- Base Commit / HEAD：`024f7f4c472b0845928a144abd086d8cffd0bbd0`；Reviewed Commit：N/A，审查包含未提交修复。
- Snapshot ID：`wechat-stage4-round05-20261014`；322 个文件的内容保存在 `.cache/code-review-round05/input/`，相对路径及 SHA-256 清单为 `.cache/code-review-round05/snapshot.json`，清单 SHA-256：`b628c4480f231ed004936f2312ac385369e452ed4f01b2262adcebef7f38b570`。包含已跟踪文件及未跟踪代码/审查报告，无删除项；未跟踪验收表格仅记录摘要，不复制或读取正文。忽略的凭据、私有配置、依赖及产物不纳入快照。
- Scope：`git diff HEAD`、`git diff --cached`、未跟踪 `apps/web/src/scan-login.test.tsx` 及第四轮报告；仅复核原 12 项 OPEN、I011 和直接相关回归。首次实现与第二轮修复仍无法从历史提交精确分离；本轮相对第三轮固定提交的修复差异可还原。
- Write Scope：本报告、issues.md、REVIEW_FEEDBACK.md、当前计划；辅助验证与证据写入 Git 忽略目录。业务代码、测试、配置、DECISIONS.md、交接和前四轮报告保持原样。
- 用户边界：这是当前变更的最后一轮复核；本轮结束后不自动开展下一轮，不自动修复，不提交、不推送、不合并、不发布。结束审查不等于批准剩余风险或通过产品验收。

## 逐项结论

| 问题 | 本轮状态 | 证据与范围                                                                                                                                                                                                                                               |
| ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I002 | VERIFIED | `guest-runtime.ts:44–68,112–122` 在加载开始解除旧订阅，异步刷新错误按 entry 隔离。真实双 store/磁盘验证加载中、完成后、加载失败后的旧通知隔离及失败恢复。当前会话的 401 覆盖缺口归 I004。                                                                |
| I004 | OPEN     | 保存/对战经过 guarded，真实保存 401 已触发回调；直接身份与详情请求仍绕过该处理，真实身份 API 401 后账号 runtime 仍 ready。见 R01。                                                                                                                       |
| I007 | OPEN     | 增加会话和工作区版本检查，但已导入工作区保留后再编辑、重试，会得到幂等成功并清除未上传的新内容。真实 API 已确认；草稿不改变版本也是遗漏。见 R02。                                                                                                        |
| I009 | VERIFIED | 并发注册重查身份，冲突消解路径消费凭证；真实 Spring/PostgreSQL 并发绑定、注册、相同绑定及凭证消费断言通过。                                                                                                                                              |
| I010 | VERIFIED | 票据操作在事务内先取得行锁，再检查实际时间；凭证消费亦先锁定。实际 HTTP 层领取请求等待数据库锁跨越到期后返回 410。                                                                                                                                       |
| I011 | VERIFIED | `App.tsx:858–919` 暂时领取失败保留轮询，终态结束，离开面板使 continuation 失效。新增本轮验证使用真实 App/React、jsdom、真实 API/PostgreSQL：中断首次领取连接后第二次成功；领取等待期间离开后真实成功响应不登录。真实微信扫码与真实浏览器平台验收未覆盖。 |
| I013 | VERIFIED | core 与 HTML pattern 改为 U+4E00–U+9FFF；边界用例、typecheck 通过，Java 与 V15 范围一致。                                                                                                                                                                |
| I015 | VERIFIED | 创建在事务咨询锁内计数并插入；二维码 computeIfAbsent 合并、失败短期缓存及生成限频。35 并发创建得到 30 成功/5 限频，同票据并发仅调用一次微信契约上游的测试通过；失败缓存路径经代码核验，未消耗真实微信配额。                                              |
| I016 | OPEN     | 用户本轮明确“仅允许替代微信等外部平台，不包含本项目 API”。前端仍预设本项目响应，不符合该授权；撤销第四轮对整个问题的 DISMISSED。见 R03。                                                                                                                 |
| I017 | OPEN     | 第四轮输入的 current plan 仍是第三轮任务，交接声称 Owner kimi/VALIDATING，计划为 codex/DONE；清单顶部、状态总数及逐项状态不一致。见 R04。本轮仅更新当前审查记录，不将该输入缺陷声称为已复核修复。                                                        |
| I018 | VERIFIED | `auth/index.tsx:114–142` 的 finally 在成功、失败、catch 内提前返回时均复位 submitting，原后续按钮持续禁用路径消除；四包 typecheck 和小程序构建通过。真实微信设备交互 NOT RUN。                                                                           |
| I019 | VERIFIED | `lineup-editor/index.tsx:47,78–91` 的 useRef 已位于全部条件返回之前，原 failed/ready Hook 数量变化消除；真实磁盘编辑恢复相关测试和构建通过，完整设备页面恢复 NOT RUN。                                                                                   |
| I020 | VERIFIED | WebConfig 允许绑定请求头。对本轮真实 API 的 OPTIONS 返回 200，并包含 `Access-Control-Allow-Headers: x-login-ticket-binding`；来源限制保持。                                                                                                              |

本轮 13 项中 9 项 VERIFIED、4 项 OPEN。此前 I001、I003、I005、I006、I008、I012、I014 的 7 项 VERIFIED 保留第三轮证据，没有重复声称执行全部历史验证；检查直接受影响路径，I005 的失败恢复和 I012 的未配置测试本轮再次覆盖。总计 20 项：VERIFIED 16、OPEN 4，其余状态 0；没有新增问题编号。

## 剩余发现

### R01 · major · I004：直接认证请求的 401 仍未同步清理 runtime

- Location：`apps/miniprogram/src/pages/account/index.tsx:42–54`、`apps/miniprogram/src/pages/report-detail/index.tsx:44–58`、`packages/client/src/api.ts:45–62`、`apps/miniprogram/src/services/runtime.ts:73–91`。
- Trigger：账号页面读取 identities 或战报详情的直接请求收到 401；这类调用未经过 account-store 的 guarded，也未经过 refreshRuntimeAsync。并行刷新若已成功，随后直接请求失效，仍会保留旧账号快照。
- Impact：存储会话已清除，但页面身份与内存数据仍是账号模式，直至另一次受保护刷新或退出操作。
- Basis：产品第 4.3 节要求会话失效/退出后清理账号内存，异步结果验证所属会话；第四轮声称“全部读写”已覆盖。
- Evidence：真实 API 拒绝签名被篡改的 JWT，返回 401；实际 client 清除会话，但实际 account store/runtime 仍为 ready/account，onUnauthorized 未触发。相同真实 401 经 account.saveLineup 时回调已触发。探针没有替代服务器认证判定；页面调用关系来自源码，未运行小程序真机。
- Repair Direction：当前会话的全部认证请求统一驱动状态清理，并保持旧会话结果隔离。当前授权只复核，不修改实现。

### R02 · major · I007：已导入工作区保留后的新编辑仍可能在重试时丢失

- Location：`apps/miniprogram/src/services/runtime.ts:160–172`、`backend/src/main/java/com/basketballgm/guest/GuestImportService.java:43–50`；草稿相关位置 `apps/miniprogram/src/services/guest-store.ts:239–242`。
- Trigger：首次导入已在服务器成功，但等待期间会话变化，使客户端按新增守卫保留工作区；用户恢复游客状态并继续编辑，再登录原账号导入同一工作区。服务端按工作区 ID 返回之前的幂等结果，不重新导入新内容。客户端忽略导入结果，只比较第二次请求前后的本地 id/updatedAt，随后清理。
- Impact：第一次成功后新增的内容尚未上传，却随第二次成功响应被删除。单纯保留同一工作区不能解决后续重试的数据归属问题。
- Basis：产品第 4.3 节“成功后才清空对应工作区”、失败保留与幂等重试要求；第三轮 R03 的未导入新内容不得清除。
- Evidence：真实 guest store/磁盘及真实 API/PostgreSQL 完成第一次导入，更新名称后再次导入；服务器仍仅包含第一次名称，第二次返回成功，本地 id/updatedAt 满足当前清理条件。该探针未执行 Taro 全页面退出流程，清理判断由源码确认。另以真实磁盘确认 saveDraft 不改变工作区 id/updatedAt，当前版本检查也不覆盖草稿变化。
- Repair Direction：明确已成功导入快照与之后本地内容的关系；仅清理已确认导入的版本，对后续编辑保留可导入的数据身份，并包含草稿版本。不得依靠重复成功响应推断新内容已上传。

### R03 · major · I016：前端测试仍预设本项目业务 API 响应

- Location：`apps/web/src/scan-login.test.tsx:52–119`、`apps/miniprogram/src/services/account-store.test.ts`、`apps/miniprogram/src/services/guest-runtime.test.ts:167–219`、`packages/client/src/api-wechat.test.ts`；D-006 的 Affected Areas。
- Trigger / Impact：上述契约服务器直接生成本项目的票据、会话、阵容和战报响应；真实 HTTP 传输不能证明本项目服务端业务已执行，且超出用户明确允许的微信外部上游替代范围。
- Basis：用户本轮明确答复“仅允许替代微信等外部平台，不包含本项目 API”。该解释优先于第四轮对整个问题的 DISMISSED。
- Evidence：源码中的 server.respond 与固定返回值确认。第四轮原文保留，本轮未执行这些前端测试；后端微信契约上游测试在本次明确许可范围内运行。I011 补充验证使用透明转发真实 API，并仅中断连接，没有生成替代业务响应。
- Repair Direction：这些前端集成验证接入真实本项目服务，保留已有验证目标；用户只批准外部上游替代，不能扩展为本项目结果替代。D-006 本轮不改写，准确边界记录于本报告、清单及当前计划。

### R04 · minor · I017：第四轮当前状态记录仍不一致

- Location：输入快照的 `docs/plans/current.md:9–26,328–330`、`docs/AI_HANDOFF.md:20`、`docs/reviews/wechat-login-stage4/issues.md:6–10,35–46`。
- Evidence：交接称当前计划 Owner kimi/VALIDATING，但实际计划仍是 round03-review、Owner codex、DONE；计划仍称详情接口未新增。issues 顶部声明第四轮修复及 I016 DISMISSED，计数仍是 OPEN 12 / VERIFIED 7 / FIXED_PENDING_REVIEW 1；Reviewed Commit 也无法表示未提交修复。
- Impact / Basis：新 agent 无法仅凭当前记录确定任务、版本和验证状态，违反共享 Skill 的状态与版本要求。
- Repair Direction：当前说明区分历史声明和现状；版本绑定实际未提交快照，计数与逐项状态一致。本轮已修正审查入口和清单，并更新本轮计划；输入快照中的第四轮完成声明保留为历史证据，不将其算作修复通过。

## 本次验证

环境：当前工作区；复核输入为上述快照。测试数据库 `codex_stage4_review05_20261014`，API 端口 18095；与产品容器及既有测试库隔离。API 使用临时签名/加密配置和本轮非生产微信配置，未调用真实微信。Node/Maven/现有依赖沿用本机环境，没有安装升级。Web 与小程序使用当前已有本地构建配置，未修改私有配置；产物不代表发布或设备验收。

| 命令 / 验证                                                                                                                                                                                                                                 | 结果             | 范围与限制                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                                                                                                                                                                                                                         | PASS             | core/client/web/miniprogram 四包                                                                                                                                         |
| `node node_modules/vitest/vitest.mjs run packages/core/src/username.test.ts apps/miniprogram/src/services/guest-store.test.ts --maxWorkers=1`                                                                                               | PASS             | 2 文件 22 项，用户名与真实磁盘游客/编辑行为                                                                                                                              |
| `mvn --batch-mode --no-transfer-progress -Dspring.datasource.url=jdbc:postgresql://127.0.0.1:5432/codex_stage4_review05_20261014 -Dtest=WechatAuthApiTest,WebLoginTicketApiTest,WechatNotConfiguredTest,GuestImportApiTest test`（backend） | PASS             | 29 项：微信 11、票据 10、未配置 3、导入 5；真实 Spring/PostgreSQL，微信外部上游由本地契约服务器提供，符合用户本轮许可                                                    |
| `node node_modules/vitest/vitest.mjs run --config .cache/code-review-round05/vitest.config.ts`                                                                                                                                              | PASS             | 2 项真实 App/React、jsdom、实际 API/数据库及真实定时器验证；连接中断重试、离开后忽略迟到成功。辅助脚本首次按钮选择器不匹配实际文案，修正选择器后两项通过，未修改产品代码 |
| `runtime-probe.ts`（Vite SSR）                                                                                                                                                                                                              | PASS / 缺陷确认  | 旧通知隔离、真实存储损坏恢复通过；确认草稿变化不增加工作区版本，不声称完整设备导入流程通过                                                                               |
| `live-api-probe.ts`（Vite SSR）                                                                                                                                                                                                             | FAIL（业务判定） | 进程退出 0；实际复现 I004 的直接 401 状态缺口、I007 重复导入未上传新内容；保存 401 回调通过                                                                              |
| OPTIONS，Origin `http://localhost:5173`，请求头 `x-login-ticket-binding`                                                                                                                                                                    | PASS             | 真实 API 返回 200 及对应 Allow-Headers；未将简单请求成功替代预检验证                                                                                                     |
| `npm run build`、`npm run build:weapp`                                                                                                                                                                                                      | PASS             | Web 600.92 kB、小程序 common.js 286 KiB，保留体积提示                                                                                                                    |
| 完整前后端测试集                                                                                                                                                                                                                            | NOT RUN          | 本轮只执行相关范围；未运行预设本项目响应的前端测试，未将 Kimi 的 128/76 项历史结果当作本次结果                                                                           |
| 真实微信登录/二维码、浏览器与 iOS/Android 平台验收、I018/I019 完整设备交互                                                                                                                                                                  | NOT RUN          | 本轮未调用真实微信或操作设备；jsdom 行为验证不等于浏览器/微信/手机平台验收                                                                                               |

辅助脚本与日志位于 `.cache/code-review-round05/`，不保证其他机器可访问。Vite SSR 使用 `createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{"@catalog":process.cwd()+"/backend/src/main/resources"}}})`，加载对应探针后关闭服务。快照和日志均为本地忽略材料；后续查看历史结论须同时保留输入快照。

## 结论

收尾验证：四份输出的 Prettier 与 `git diff --check` 通过；`snapshot.cjs verify` 确认 322 个输入记录中，除三份授权状态文档外内容摘要均不变，未跟踪验收表格摘要亦不变。`validate-docs.cjs` 使用现有 Markdown 解析器核对 20 项状态、83 个本地链接、仅新增第五轮报告及暂存区为空。前四轮原文、Kimi 的业务代码/测试/配置及其余未提交内容保留。独立 API 已停止，18095 无监听；隔离数据库已删除，pg_database 查询匹配数为 0。快照与验证材料保留在本地忽略目录。

CHANGES_REQUIRED：当前快照剩余 I004、I007、I016 三项 major 与 I017 一项 minor，16 项 VERIFIED。无新增问题，无用户批准的风险延期；平台验收仍未完成。按用户要求，本轮到此结束，不安排新的循环审查；剩余项目保持明确状态，由用户决定后续处理。本轮未修复业务实现，未提交、推送、合并或发布。
