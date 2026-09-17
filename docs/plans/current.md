# Current Plan

更新时间：2026-09-17

## 当前目标

为球员库和我的阵容页面的球员列表提供分页，避免数百名球员一次性渲染导致浏览困难。

状态：已完成，等待提交。

## 验收结果

- [x] 球员库网格每页 12 名球员，可前后翻页。
- [x] 我的阵容候选球员每页 9 名，可前后翻页。
- [x] 搜索、位置过滤或排序条件变化后回到第 1 页。
- [x] 列表缩短时页码钳制到有效范围。
- [x] 只有一页时不显示分页控件。
- [x] 小屏设备上翻页按钮保持可见。
- [x] 简体中文和英文文案齐全。
- [x] 前端测试、构建、格式检查全部通过。

## 已完成工作

- 新增 `src/lib/use-pagination.ts`，统一处理页码状态、重置信号、钳制和切片。
- `src/App.tsx` 新增 `PaginationBar` 组件；球员库网格和我的阵容候选列表接入分页。
- `src/i18n/resources.ts` 新增 `pagination` 文案（简体中文、英文）。
- `src/styles.css` 新增 `.pagination` 样式；翻页按钮使用 `ghost`，避开小屏下 `.compact` 被隐藏的规则。
- `src/App.test.tsx` 新增 3 项分页回归测试。

## 未完成工作

- 本次分页改动尚未提交。
- 腾讯云 TKE 构建、配置和发布尚未开始。

## 修改过的文件

- `src/lib/use-pagination.ts`（新增）
- `src/App.tsx`
- `src/i18n/resources.ts`
- `src/styles.css`
- `src/App.test.tsx`

## 修改中的文件

无。本次文档更新完成后，`docs/plans/current.md`、`docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md` 与上述 5 个源码文件一起处于未提交状态。

## 当前已知 bug

当前没有已确认且可以复现的产品 bug。

开发服务器可能在长时间运行或切换分支后持有旧模块。页面与源码不一致时，检查 5173 端口并重启 Vite。

## 设计决策及原因

- 分页状态放在自定义 Hook `usePagination` 中：页码钳制和切片是可复用逻辑，组件只负责渲染。
- 通过 `resetSignal` 重置页码：搜索词、位置过滤和排序都是查询条件，条件变化后停留在旧页码会看到错误的子集。
- 列表缩短时钳制页码而非重置：向阵容添加球员会让候选列表变短，用户停留在接近原位置的最后一页符合预期。
- 只有一页时隐藏分页控件：没有可翻页内容时控件没有作用。
- 球员库每页 12 名，配合双列卡片网格整行显示；我的阵容候选列表每页 9 名，配合三列网格整行显示。
- 翻页按钮使用 `ghost` 样式：`.compact` 在 900px 以下屏幕会被隐藏，不能用于必须始终可用的控件。

## 下一步具体行动

1. 查看 `git status` 确认改动范围。
2. 提交分页功能与本次文档更新。
3. 等待新的产品目标；后续功能在 `develop` 分支开发。
4. 任何 `main` 推送都必须先完整运行前端与后端全部测试并全部通过。

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

2026-09-17 最近一次验证：

- `npm test`：8 个测试文件、21 项测试通过（含 3 项分页测试）。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。
- `mvn test`：14 项测试通过（本次未修改后端代码，结果为接手基线时的完整验证）。

## 当前 Git 状态

- 分支：`develop`，HEAD：`17ef87e docs: Codex 完善交接文档`，与 `origin/develop` 一致。
- 未提交改动：`src/lib/use-pagination.ts`（新增）、`src/App.tsx`、`src/i18n/resources.ts`、`src/styles.css`、`src/App.test.tsx`，以及三份交接文档。
