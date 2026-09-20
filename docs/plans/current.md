# Current Plan

更新时间：2026-09-20

## 当前目标

社区总开关：新增标准配置项 `app.forum.enabled`（环境变量 `FORUM_ENABLED`，默认 `true`）。开关关闭时社区全部 8 个接口返回 404，数据表与数据保留，重新打开即恢复；整改响应因此是一次运维操作（改环境变量 + 重启），不需要改代码。`FORUM_ADMIN_USERNAMES`（`app.admin.usernames`）在社区治理批次已实现，本次不改动。

## 已确认的决策

- 开关默认开启，本地开发与测试不需要任何额外配置；只有线上需要关停论坛时在 `app.env` 里显式写 `FORUM_ENABLED=false`。
- 实现方式用 `@ConditionalOnProperty` 摘掉整个 `ForumController`：控制器不进容器，8 个映射全部消失返回 404，比逐方法加判断更难漏。`ForumService` 等只被该控制器引用，留下不影响其他功能。
- 前端不做功能标志下发，接口 404 时社区页沿用既有加载失败提示。
- 配套修复：安全链放行 ERROR 分发（`dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()`），否则未映射路径经 `/error` 被入口点拦截成 401；该差异只有真实容器能复现，MockMvc 看不到。

## 验收标准

- [x] `FORUM_ENABLED=false` 时 8 个接口（3 个匿名读 + 5 个登录写）全部返回 404，其余接口正常。
- [x] 默认配置下社区行为与此前一致，既有 `ForumApiTest`、`ForumModerationTest` 保持绿色。
- [x] 真实进程实测：关闭后匿名读 404，恢复默认后匿名读 200。

## 实施步骤

1. `application.yml` 新增 `app.forum.enabled: ${FORUM_ENABLED:true}`。
2. `ForumController` 加 `@ConditionalOnProperty(name = "app.forum.enabled", havingValue = "true", matchIfMissing = true)`。
3. `SecurityConfig` 放行 ERROR 分发。
4. 新增 `ForumDisabledTest`：独立 Spring 上下文（`app.forum.enabled=false`）断言 8 个接口 404 与健康检查 200。
5. 门禁：`mvn test`、`npm run format:check`；`mvn package` 重新打包。
6. 真实进程实测关闭与恢复，更新 `docs/AI_HANDOFF.md` 与本文件。

## 测试状态

2026-09-20 完成后验证：

- 后端：42 项测试全部通过（新增 `ForumDisabledTest`）。
- Prettier：通过。`mvn package` 重新打包。
- 真实进程实测：`FORUM_ENABLED=false` 启动后匿名 GET 帖子列表与详情均 404；默认配置重启后恢复 200。前后端服务以默认配置运行中。

## 当前 Git 状态

- 分支：`develop`，基线提交：`84e53ba refactor: 后端 Java 包从 com.links.basketballgm 重命名为 com.basketballgm`。
- LLM 请求参数适配、上场时间约束与社区总开关改动未提交，文件清单见 `docs/AI_HANDOFF.md`。
