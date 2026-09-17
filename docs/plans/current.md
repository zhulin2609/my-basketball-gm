# Current Plan

更新时间：2026-09-17

## 当前目标

新增「社区」功能：登录用户可以把自建的阵容公开到社区，其他用户可以浏览、评论（含一级回复）、一键复制到自己的阵容。游客只读浏览。

状态：开发完成，全部测试通过，等待提交。

## 已确认的决策

- 公开即快照：帖子内容在公开时刻冻结，作者之后修改或删除源阵容不影响帖子。
- 一套阵容同一时间最多一个公开帖；重复公开刷新快照，评论数与复制数保留；可撤回，撤回时评论级联删除。
- 只有完全由公共目录球员组成、且作者没有覆盖过这些球员的阵容可以公开；含自定义球员或编辑过公共球员的阵容，前端禁用公开入口并列出阻止公开的球员名单，后端校验失败返回 422 与名单。
- 公开之后作者再把自定义球员加入源阵容不影响帖子；「更新公开内容」重新校验，不合规则拒绝。
- 复制时所有成员都是公共球员引用，直接写入 `lineup_players`，单事务完成，返回新阵容。
- 评论平铺展示，支持一级回复（回复不能再被回复）；只有评论作者本人能删除评论，删除时回复级联删除。
- 帖子列表与评论都使用服务端分页（`page` + `pageSize`，响应带 `total`），前端复用 `PaginationBar`。
- 发帖、评论、复制要求登录；游客可浏览列表、详情、评论，写操作入口显示登录引导。
- 不做举报、审核、置顶等治理功能。

## 验收标准

- [x] 登录用户可以公开符合条件的阵容，重复公开刷新快照。
- [x] 含自定义球员或覆盖球员的阵容无法公开，后端返回 422 与球员名单。
- [x] 任何游客可以浏览帖子列表、详情和评论。
- [x] 登录用户可以发表评论与一级回复，可以删除自己的评论。
- [x] 登录用户可以一键复制公开阵容，复制结果与帖子快照一致。
- [x] 作者可以撤回公开帖，撤回后评论清空。
- [x] 帖子列表与评论分页正确。
- [x] 游客的写操作得到 401，非作者删帖或删评论得到 403。
- [x] 简体中文与英文文案齐全。
- [x] 前端测试、构建、格式检查与后端全部测试通过。

## 实施步骤

1. Flyway 迁移 `V11__add_forum.sql`：`shared_lineups`（含 members jsonb 快照、comment_count、copy_count、source_lineup_id 唯一索引）与 `lineup_comments`（含 parent_id、内容限长 2000）。
2. 后端新增 `forum` 模块：`GET /api/v1/forum/posts`（公开）、`GET /api/v1/forum/posts/{id}`（公开）、`GET /api/v1/forum/posts/{id}/comments`（公开）、`POST /api/v1/forum/posts`、`DELETE /api/v1/forum/posts/{id}`、`POST /api/v1/forum/posts/{id}/comments`、`DELETE /api/v1/forum/comments/{id}`、`POST /api/v1/forum/posts/{id}/copy`。
3. Spring Security 放行社区三个只读 GET 接口。
4. 后端集成测试（真实 PostgreSQL，参照 `GuestImportApiTest` 模式）。
5. 前端 `src/lib/api.ts` 新增社区接口方法。
6. `src/App.tsx` 新增社区列表与帖子详情视图；我的阵容页新增「公开到社区 / 更新公开内容 / 撤回公开」入口。
7. `src/i18n/resources.ts` 中英文案；`src/styles.css` 社区页面样式。
8. 前端测试：游客只读、登录后写操作入口、分页。
9. 全部测试通过后更新 `docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md`、本文件。

## 测试方法

前端：

```bash
npm test
npm run build
npm run format:check
```

后端：

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend
mvn test
```

后端测试需要本地 PostgreSQL 数据库 `basketball_gm_test`。连接配置位于 `backend/src/test/resources/application-test.yml`。

## 测试状态

2026-09-17 社区功能完成后验证：

- `npm test`：8 个测试文件、26 项测试通过（含 3 项社区界面测试、1 项保存反馈测试与 1 项输入法组合测试）。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。
- `mvn test`：22 项测试通过（既有 14 项 + 新增 8 项 `ForumApiTest`，真实 PostgreSQL）。

## 当前 Git 状态

- 分支：`develop`，HEAD：`b9d8364 feat: 球员库与我的阵容球员列表分页`。
- 社区功能改动完成但未提交，涉及后端 `forum` 模块、V11 迁移、阵容接口扩展，以及前端社区页面、样式、文案与测试。
