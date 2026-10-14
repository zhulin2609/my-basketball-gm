# Current Plan

更新时间：2026-10-13

本文件保存 session-independent Task State；字段与状态语义遵循 `AGENTS.md`。路径以仓库根目录为基准。

## Task

`wechat-miniprogram-stage4-implementation`：用户于 2026-10-13 明确授权开始阶段 4 业务实现，按产品文档第 4.3、5 节、D-005 与本文件 Plan 第 4 节实施：微信免密码账号与身份绑定、Web 小程序扫码确认登录与密码登录兼容、两端中文用户名、新键幂等游客导入、小程序登录数据切换与本人历史战报类型标示。阶段 3 剩余验收继续保留，已完成实现与验证见 Current State、Progress 和 Validation。此前 `wechat-miniprogram-stage4-preparation` 已完成，保持 DONE 里程碑。

## Status

VALIDATING

阶段 4 实施完成，自动化测试、构建与本地真实进程冒烟全部通过。待用户提供微信凭据与设备条件后执行真实联调（A01–A13、P06–P08、P10、P11 中需要微信平台的部分）；阶段 3 保留验收项目不变。

## Owner

- Owner: kimi
- Instance: kimi-stage4-preparation-f9e441b9-5a00-4c88-9e15-3abe7028d3da
- Last Writing Agent: codex-stage4-handoff-01a10792-bb63-7713-bc13-6e74fd9164ab；交接完成，停止写入。
- Worktree: /Users/zhulin/Workspace/my-basketball-gm
- Branch: mini-app-20261004
- Base Commit: b87d67f2eaba02f1db31abec822bda3c9f15e3bd
- Write Scope: 阶段 4 实施范围内的业务代码、配置、测试与文档（含本文件与 `docs/AI_HANDOFF.md`），保留 Codex 的产品文档、D-005 及计划修改。不提交、不推送；阶段 3 未完成验收保留。

## Goal

按已确认产品要求完成阶段 4 实现并通过验收：微信免密码账号、Web 小程序扫码确认登录与既有密码登录兼容、中文用户名、唯一身份绑定、安全游客导入与本人历史 AI 战报。2026-10-13 用户授权实施；实现已完成，自动化验证通过，真实微信平台联调与真机验收进行中。阶段 3 未完成验收及历史证据持续保留。

## Acceptance Criteria

### 阶段 4 实施（本轮）

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

后端测试使用 `127.0.0.1:5432` 上的真实 PostgreSQL 数据库 `basketball_gm_test`，执行前确认测试数据库已启动；现有 Compose 业务数据库使用 5433 端口。游客模式不需要 API 地址；联网功能构建时配置 `MINI_API_BASE_URL`。

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

- 阶段 4 平台能力待真实环境核验：`wxacode.getUnlimited` 的 scene 参数长度与个人主体可用性、`jscode2session` 实际响应、手机浏览器同机进入小程序确认页的方式。票据标识已按 scene 32 字符限制设计；`GET /simulations/{id}` 未新增，列表字段已覆盖小程序详情展示。
- 登录票据有效期已实现为配置项 `WECHAT_TICKET_TTL`（默认 5 分钟），身份确认凭证为 `WECHAT_CREDENTIAL_TTL`（默认 10 分钟）。
- `.env.docker.example` 受工具敏感文件保护未修改；微信环境变量占位见 `application.yml` 与 `compose.yaml`。
- 验收表的预览构建版本与各用例基础库映射尚未填写；不由当前 Git HEAD 或此前白闪验证的 SDK 推定所有用例使用相同版本。编号 08/11/12 暂无验收条件，Android 未验收，不记录为 PASS。
- 用例 09 的本次 iPhone 白闪修复已完成验证。Android 白闪复验仍因设备缺失未执行；2026-10-06 的 iOS 记录仅为历史结果。
- 本次 iPhone 实际 SDK 为 3.17.4，最低基础库声明为 3.17.3；两者验证结果分别记录。Android 设备缺失，对应验收保留 NOT RUN，待设备就绪后执行并记录。
- Codex 已确认从可用 Skill 列表读取 canonical handoff；ZCode 于 2026-10-05 接手时未在自动发现的 Skill 列表中看到该 Skill，已显式读取 `.agents/skills/handoff/SKILL.md` 完成接手，显式引用路径可用；Kimi Code 的自动发现仍未验证。
- 阶段 4 四项产品选择及中文用户名规则已确认。微信昵称快捷填写、小程序码确认流程和手机浏览器同机使用方式需核对实际平台能力；登录票据具体期限及接口协议在实现设计中确定。阶段 5 分享选择和上线资格仍待确认。
- ZCode 记录的自动化重编译清空模拟器存储属于历史环境观察，Codex 尚未重新验证其原因及适用范围；不据此判定其余平台验收无法执行。

## Decision Candidates

none。阶段 4 账号及跨客户端数据规则已记录为 D-005，中文用户名规则经用户明确确认；此前球员详情页入口决定为 D-004。未确认分享选择仍保留在产品文档第 12 节。

## Validation

各次执行按日期和 Agent 分开记录；历史结果不代表本次重新执行。历史产品结果另见 Retained Product Evidence。

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

阶段 4 实施由 Kimi Code 完成并进入验收：微信免密码注册登录、已有账号密码验证绑定、Web 小程序扫码确认登录、两端与数据库统一中文用户名规则、新键幂等游客导入、小程序登录数据源切换与战报类型标示均已实现。后端 63 项测试（既有库升级与新库初始化）、前端 119 项测试、四包 typecheck、两端构建、格式与差异检查、本地真实进程冒烟全部通过；未提交、未推送。真实微信联调与真机验收待凭据与设备条件，保持 NOT RUN。阶段 3 保留验收项目不变。

此前交接已准备完成，目标为 Kimi Code；阶段 4 准备与阶段 3 保留验收均为 HANDOFF_READY，产品定义已完成。Owner 已释放为 unassigned，Codex 停止写入。四份文档修改保留未提交，没有推送或业务代码修改；接手者先核验，再取得写入归属，业务实施仍待用户后续授权。

此前阶段 4 产品文档任务已完成：已确认选择记录于产品文档、当前计划及 D-005，流程和验收条件一致，文档检查通过，阶段 3 未完成项与历史证据完整保留。后续阶段 4 实施须通过独立验证。

此前验收记录已按用户 2026-10-13 的反馈同步到 Google Docs 与本文件，代码质量面板三项重新扫描均为 PASS（用户确认）；该轮文档已提交为 `b87d67f`。编号 08/11/12 和 Android 的未验收状态保留，阶段 3 尚未全部验收。

本轮小程序阵容与历史战报卡片导航已实现：点击整张卡片分别进入对应编辑页与战报详情，按钮继续可用，每次只导航一次。105 项测试、四包 typecheck、两端构建、格式检查及独立开发者工具八项页面验证通过，Web 主资源保持一致。用户确认真机测试没有问题，并授权提交和推送当前分支；提交与推送状态以 Git 核验为准。

此前小程序编辑页首发置顶已提交并推送为 `2e69eed4aebc052a4513cc2065661ef7078208be`：进入或重新显示页面时将当前首发稳定分组到前面，支持草稿与正式阵容，页面内切换首发保持卡片位置，存储顺序保持不变。105 项测试、四包 typecheck、两端构建、格式检查及独立开发者工具页面验证通过，Web 主资源保持一致。用户确认真机测试没有问题。

此前两个小程序页面分页优化已提交并推送为 `3969134c401013c49a4b76ee9c1958f35b4ae786`：列表顶部页码、翻页后返回浏览区域起点、加入球员与详情返回保留位置通过独立开发者工具验收，101 项测试、四包 typecheck、两端构建及格式检查通过，Web 主资源保持一致。用户确认真机测试没有问题。

此前球员详情页入口调整已提交为 `b62fb252c0c37bcb75dfbfa2123291837c0b215a`：按钮及未使用导入已移除，长期决策记录为 D-004，四包 typecheck、小程序构建与独立开发者工具页面验证通过。

此前用例 09 的 iPhone 白闪修复提交为 `33bf7330c7e2b0caa94224d2e6de5da74e12cc42`，[独立排查记录](../troubleshooting/miniprogram-tab-white-flash.md)及文档入口提交为 `4ad96577ee82b60f6f2dcca11b788bd80d1140c3`，均已推送至 `origin/mini-app-20261004`。阶段 3 剩余范围见 Remaining Product Work；全部必需平台验收完成后才可设为 DONE。当前状态与 Owner 以本文件顶部及最新交接 checkpoint 为准。
