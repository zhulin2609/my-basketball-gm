# Current Plan

更新时间：2026-09-19

## 当前目标

社区内容治理（上线前置批次）：为腾讯云公网部署补上内容合规与滥用防御能力。

范围：

1. 本地 DFA 敏感词前置过滤。
2. 腾讯云 CMS 文本审核接入（同步、全量、写路径）。
3. 服务端限频。
4. 新账号链接限制（注册不满 24 小时禁发链接）。
5. 管理员删除通道。
6. 结构化错误码，前端按码映射文案。

## 已确认的决策

- 审核串行顺序：本地词表 → 腾讯云 CMS。全部内容同步过审，不做「审核中」中间态，不做先发后审。
- CMS 调用失败或超时（3 秒）→ 拒绝写入，社区写操作短暂不可用；fast-fail，不放行未审内容。
- 命中敏感词不回显具体词条，只返回统一违规文案，避免词库被试探。
- 错误码：`CONTENT_REJECTED`（422）、`RATE_LIMITED`（429）、`MODERATION_UNAVAILABLE`（503）、`LINK_RESTRICTED`（403）。前端按 code 映射 i18n 文案，不拼后端原始 message；无 code 的错误保持现有 message 展示。
- 发帖（阵容名称与描述）与评论走同一套审核与错误处理。
- 限频额度：评论每秒钟 1 条、每天 50 条；发帖每小时 3 次。发帖额度只计新建帖子：帖子列表按 created_at 排序，更新已公开帖子不会顶帖，因此更新不占额度。额度全部做成配置项，测试通过配置覆盖。
- CMS 配置门控（参照 LLM credential 模式）：未配置腾讯云密钥时云端审核关闭，本地词表仍然生效。
- CMS 的 HTTP 调用必须位于数据库事务之外：`ForumController` 在调用写方法前完成内容审核；限频与链接判断是纯数据库计数，留在 `ForumService` 事务内。
- 管理员由配置 `app.admin.usernames`（环境变量 `FORUM_ADMIN_USERNAMES`，逗号分隔）指定。删除帖子与删除评论接口放行管理员；`/auth/me` 与登录、注册响应的用户对象增加 `admin` 布尔字段，前端据此对他人的帖子与评论显示删除按钮。
- 新账号判断使用 `users.created_at`；链接识别只匹配 `http://`、`https://`、`www.`。
- 词表位置由 `app.moderation.word-list`（环境变量 `MODERATION_WORD_LIST`）指定，注入的是 Spring Resource：默认 `classpath:moderation-words.txt`，可改为 `file:` 前缀的外置文件。以 jar 方式运行且使用默认 classpath 词表时，词表变更需要重新打包并重启；外置词表只需重启进程。
- 手机号实名属于后续合规评估，不在本次范围。

## 验收标准

- [x] 评论或发帖命中本地词表：422，错误体含 `code: CONTENT_REJECTED`，文案不回显词条。
- [x] 评论超过每秒钟或每天额度、发帖超过每小时额度：429，`code: RATE_LIMITED`。
- [x] 注册不满 24 小时的账号发布含链接内容：403，`code: LINK_RESTRICTED`。
- [x] 未配置腾讯云密钥时 CMS 关闭、其余检查照常；配置后调用 TMS `TextModeration`，`Block` 与 `Review` 均按拒绝处理。
- [x] CMS 调用失败或超时：503，`code: MODERATION_UNAVAILABLE`。
- [x] 管理员可删除他人的帖子与评论（204），普通用户仍 403。
- [x] 前端按 code 展示对应文案；提交中保持 loading 态，失败保留草稿。
- [x] 前端测试、构建、格式检查与后端测试全部通过。

注：`MODERATION_UNAVAILABLE` 与云端 `Block/Review` 分支依赖真实腾讯云密钥，代码就绪但本地未激活；其余验收项均已在真实 PostgreSQL 集成测试与真实运行的后端上验证。

## 实施步骤

### 后端

1. `pom.xml` 增加 `com.tencentcloudapi:tencentcloud-sdk-java-tms:3.2.9`（Maven Central 已核实存在），禁止手写 TC3 签名。
2. `config/ApiException.java`（新）：携带 `HttpStatus`、`code`、`message`；`ApiExceptionHandler` 增加对应处理器，错误体输出 `{message, code}`。既有 `ResponseStatusException` 处理保持不变。
3. `moderation/` 新包：
   - `SensitiveWordFilter`：启动时从 classpath `moderation-words.txt` 构建 DFA 词表（跳过空行与 `#` 注释，拉丁字母大小写不敏感），提供 `contains(String)`。
   - `TencentModerationClient`：配置门控；启用时调用 TMS `TextModeration`（版本 2020-12-29，Content 为 base64 文本，超时 3 秒），`Block`/`Review` 抛 `CONTENT_REJECTED`，异常或超时抛 `MODERATION_UNAVAILABLE`。
   - `ModerationService`：`check(String)` 串联本地词表与云端审核。
4. `user/AdminRegistry.java`（新）：解析 `app.admin.usernames`，提供 `isAdmin(String username)`（大小写不敏感，与登录的用户名匹配规则一致）。
5. `forum/ForumWriteGuard.java`（新）：评论限频（每秒钟、每天）、发帖限频（每小时，仅新建）、新账号链接检查，抛出带 code 的 `ApiException`。
6. `ForumMapper` 增加：按时间窗统计评论数与发帖数、查询 `users.created_at`。
7. `ForumController`：`publish`、`addComment` 在调用 service 前执行 `ModerationService.check`；发帖文本通过 service 新增的只读方法按 lineupId 取出名称与描述。
8. `ForumService`：`publish`（仅新建时）与 `addComment` 接入 `ForumWriteGuard`；`deletePost`、`deleteComment` 经 `UserMapper` + `AdminRegistry` 放行管理员。
9. `AuthUserResponse` 增加 `admin` 字段；`AuthService` 经 `AdminRegistry` 填充。
10. `application.yml` 增加 `app.admin.usernames`、`app.forum.rate-limit.*`、`app.forum.new-account-link-hours`、`app.moderation.tencent.*` 配置项，全部支持环境变量覆盖。

### 前端

11. `src/lib/api.ts`：新增 `ApiError`（携带 `status` 与 `code`，继承 `Error`，既有 catch 行为不变）；`AuthUser` 增加 `admin` 字段。
12. `src/lib/errors.ts`（新）：`communityWriteError(t, error, fallbackKey)` 按 code 映射到新 i18n 文案，无 code 时回退到原有 `{{message}}` 拼接。
13. `src/i18n/resources.ts`：中英文各增加 `errorContentRejected`、`errorRateLimited`、`errorUnavailable`、`errorLinkRestricted`。
14. `src/App.tsx`：发表评论与公开阵容的 catch 改用映射函数；`CommunityHub`/`CommunityPostView` 增加 `isAdmin` 传递，帖子撤回按钮与评论删除按钮对管理员可见。

### 测试

15. `ForumModerationTest.java`（新，`@ActiveProfiles("test")`，限频额度用 `properties` 收紧，管理员用户名用 `@DynamicPropertySource` 注入随机值）：本地词表 422、评论秒级与天级限频 429（天级用 `jdbcTemplate` 写入窗口外的历史评论构造）、发帖限频 429、新账号链接 403（并用 `jdbcTemplate` 把账号注册时间改早后验证放行）、管理员删除他人评论与帖子 204、`/auth/me` 的 `admin` 字段、错误体 code 断言。
16. `SensitiveWordFilterTest.java`（新，纯单元测试）：词表加载、注释与空行跳过、大小写不敏感、正文中间命中。
17. `src/lib/errors.test.ts`（新）：四种 code 的映射、无 code 时回退 message、非 Error 输入。
18. 四道门禁：`npm test`、`npm run build`、`npm run format:check`、`mvn test`。
19. 更新 `docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md` 与本文件。

## 测试方法

```bash
npm test
npm run build
npm run format:check
cd backend && mvn test
```

## 测试状态

2026-09-18 功能完成后验证：

- `npm test`：10 个测试文件、41 项测试通过（含 4 项错误码映射测试）。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。
- `mvn test`：34 项测试通过（含 `ForumModerationTest` 8 项与 `SensitiveWordFilterTest` 4 项）。
- 端到端（真实运行的后端 + curl）：`/auth/me` 返回 `admin` 字段；正常评论 201；一分钟内重复评论 429 `RATE_LIMITED`；命中词表 422 `CONTENT_REJECTED` 且不回显词条；新账号含链接的评论与发帖 403 `LINK_RESTRICTED`。

2026-09-19 词表扩充后复验：

- `mvn package`：34 项测试通过，词表（237 行）随新 jar 打包，后端以 `java -jar` 重启。
- 端到端（真实运行的后端 + curl）：命中新增词条的评论 422 `CONTENT_REJECTED`，正常评论 201，验证数据已清理。

## 当前 Git 状态

- 分支：`develop`，基线提交：`6cceac3 feat: 我的阵容候选球员列表按能力值降序`。
- 治理改动完成但未提交，文件清单见 `docs/AI_HANDOFF.md`。
