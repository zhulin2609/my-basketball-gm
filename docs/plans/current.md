# Current Plan

更新时间：2026-09-19

## 当前目标

hash 路由：刷新页面后停留在当前视图，浏览器前进/后退按钮可用，社区帖子详情有可分享的独立链接。

## 已确认的决策

- 视图状态以 URL hash 为准，不引入路由依赖：`useHashRoute`（`src/lib/hash-route.ts`）手写 hash 的解析、写入与 `hashchange` 监听。
- hash 格式：`#/players`、`#/lineups`、`#/battle`、`#/community`、`#/community/<帖子id>`、`#/ai-settings`、`#/auth`。
- 挂载时从 hash 恢复视图；`navigate` 同步更新状态并写 hash；`hashchange` 处理前进/后退，重复事件按相同路由跳过。
- 无法识别的 hash 回退到球员库；受限视图（`ai-settings` 要求登录、`community` 要求 API 启用）条件不满足时回退到球员库渲染，URL 保持不变。
- 帖子被撤回后打开旧链接，沿用帖子详情既有的加载失败提示，不展示空白页。

## 验收标准

- [x] 刷新后停留在当前页面（各视图均从 hash 恢复）。
- [x] 切换页面更新 hash，浏览器前进/后退切换视图。
- [x] `#/community/<帖子id>` 直达帖子详情。
- [x] 非法 hash 与未登录访问 `#/ai-settings` 回退到球员库。
- [x] 前端测试、构建、格式检查通过；真实浏览器验证通过。

## 实施步骤

1. `src/lib/hash-route.ts`（新）：`parseHashRoute`、`routeToHash`、`useHashRoute`。
2. `src/App.tsx`：视图状态改由 `useHashRoute` 提供，删除独立的 `communityPostId` 状态，全部 `setView` 调用点改为 `navigate`，受限视图在渲染前回退。
3. `src/App.test.tsx`：各测试块的 `beforeEach` 增加 hash 重置（jsdom 环境在同一文件内共享，hash 会跨用例残留）；新增 6 项 hash 路由测试。
4. 门禁：`npm test`、`npm run build`、`npm run format:check`。
5. 真实浏览器验证刷新停留与前进/后退。
6. 更新 `docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md` 与本文件。

## 测试方法

```bash
npm test
npm run build
npm run format:check
```

## 测试状态

2026-09-19 完成后验证：

- `npm test`：10 个测试文件、47 项测试通过（新增 6 项 hash 路由测试）。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。
- 真实浏览器（Vite dev server + 运行中的后端）：`#/lineups` 加载恢复与刷新停留、`#/community` 切换、浏览器后退返回阵容页、`#/community/<帖子id>` 直达帖子详情与刷新保持，均验证通过。

## 当前 Git 状态

- 分支：`develop`，基线提交：`a3d2af8 feat: 社区内容治理：敏感词审核、限频、新账号链接限制与管理员删除通道`。
- hash 路由与 README（含英文版）改动未提交，文件清单见 `docs/AI_HANDOFF.md`。
