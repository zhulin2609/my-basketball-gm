# Current Plan

更新时间：2026-09-17

## 当前目标

完成游客态，使未注册用户可以直接体验球员库、自建阵容和本地梦幻对战，并在注册或登录后安全地把浏览器游客数据导入账号。

状态：已完成，等待交接文档提交。

## 验收结果

- [x] 未登录访问默认显示球员库。
- [x] 游客可以创建和修改球员、阵容与本地战报。
- [x] 页面持续说明游客数据保存在当前设备。
- [x] 登出后恢复当前浏览器游客工作区并显示球员库。
- [x] 登录页可以返回游客体验。
- [x] 注册后自动导入有用户进度的游客工作区。
- [x] 登录已有账号时显示数据数量，并提供导入和暂不导入选项。
- [x] 导入成功后清空当前游客存档。
- [x] 导入失败或暂不导入时保留游客存档。
- [x] 同一工作区向同一账号重复请求不会重复写入。
- [x] 同一工作区不能导入两个不同账号。
- [x] 自定义球员的新数据库 ID 会同步替换阵容和战报引用。
- [x] 过期游客战报不会进入云端数据库。
- [x] 简体中文和英文文案齐全。
- [x] 前端、构建、格式和后端全部测试通过。

## 已完成工作

- 前端游客入口、提示条、登录入口、登出恢复和登录页返回交互。
- 统一 localStorage 工作区及旧存档迁移。
- 注册自动导入和已有账号登录选择导入。
- 游客导入请求转换与旧战报展示快照补全。
- Spring Boot 游客导入接口、MyBatis 写入和事务处理。
- PostgreSQL `guest_imports` 幂等记录表。
- 前端游客态回归测试和真实 PostgreSQL 后端集成测试。
- 重启旧 Vite 开发进程并确认 5173 返回当前游客态源码。

## 未完成工作

- 没有游客态功能遗留任务。
- `docs/AI_HANDOFF.md`、本文件与 `docs/ARCHITECTURE.md` 尚未提交。
- 腾讯云 TKE 构建、配置和发布尚未开始。

## 修改过的文件

完整文件清单和职责见 `docs/AI_HANDOFF.md` 的“本轮修改过的文件”。游客态业务代码已提交到 `47d8020`，交接规范更新已提交到 `13d11b1`。

## 修改中的文件

- `docs/AI_HANDOFF.md`
- `docs/plans/current.md`
- `docs/ARCHITECTURE.md`

## 当前已知 bug

当前没有已确认且可以复现的产品 bug。

开发服务器可能在长时间运行或切换分支后持有旧模块。页面与源码不一致时，检查 5173 端口并重启 Vite。该运行问题已经在本 Session 处理并验证。

## 设计决策及原因

- 浏览器生成稳定游客工作区 UUID：支持幂等重试和跨账号冲突检查。
- 注册自动导入：新账号没有已有远端数据冲突。
- 已有账号登录前显示摘要：用户明确决定是否合并浏览器数据。
- 仅在服务端确认成功后清空 localStorage：网络或校验失败不会丢失游客数据。
- 导入成功后清空当前游客工作区：避免同一设备上的后续用户继承前一位用户的数据。
- 示例阵容不计作用户进度：没有实际操作的游客不会看到无意义的导入流程。
- 游客使用本地规则引擎：AI Key 继续由已登录账号在服务端加密保存。
- 服务端事务导入：球员、阵容和战报保持完整引用关系。

## 下一步具体行动

1. 查看 `git status` 和三份交接文档的差异。
2. 运行本文件列出的全部测试。
3. 提交 `docs/AI_HANDOFF.md`、`docs/plans/current.md` 与 `docs/ARCHITECTURE.md`。
4. 等待新的产品目标；后续功能在 `develop` 分支开发。
5. 任何 `main` 推送都必须先通过全部测试。

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

- `npm test`：8 个测试文件、18 项测试通过。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。
- `mvn test`：14 项测试通过，其中 3 项使用真实 PostgreSQL 验证游客导入接口。

## 当前 Git 状态

- `develop` 指向 `13d11b1`，开始交接更新时与 `origin/develop` 一致。
- 游客态业务代码已经提交。
- 当前未提交内容只应包含 `docs/AI_HANDOFF.md`、`docs/plans/current.md` 和 `docs/ARCHITECTURE.md`。
