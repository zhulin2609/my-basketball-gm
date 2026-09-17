# AI Handoff

更新时间：2026-09-17

## 开始工作前

按以下顺序读取仓库内容：

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. 本文件
4. `docs/plans/current.md`
5. `docs/DECISIONS.md`
6. 与任务相关的源码和测试

随后运行：

```bash
git status --short --branch
git diff
git log -5 --oneline
```

保留用户已有改动。禁止使用 Git 回滚用户文件。

## 当前目标

游客无需注册即可浏览球员库、创建或编辑球员与阵容，并使用本地规则引擎进行梦幻对战。游客产生的数据保存在当前浏览器。注册后自动导入游客数据；登录已有账号时，由用户选择导入或暂不导入。

该目标已经完成。当前工作是关闭开发 Session、保存交接信息并维持可复现的测试状态。

## 已完成工作

### 前端游客体验

- 未登录用户默认进入球员库，页面不再由登录表单拦截。
- 顶部显示游客身份、登录或注册链接，并持续提示本机数据的临时性质。
- 游客可以使用球员库、自定义球员、阵容编辑和本地比赛模拟。
- 游客不能使用需要服务端账号的 AI 设置和 AI 模拟。
- 登出后重新读取浏览器游客存档并返回球员库。
- 登录页提供“继续游客体验”，可以返回球员库。
- 页面支持简体中文和英文游客文案。

### 浏览器存储

- `src/lib/guest-workspace.ts` 使用 `dream-court.guest-workspace.v1` 保存统一游客工作区。
- 工作区包含稳定的 UUID、schema 版本、时间、用户进度标记、球员修改、阵容和战报。
- 旧键 `dream-court.players.v1`、`dream-court.lineups.v1`、`dream-court.games.v1` 会自动迁移，并在迁移完成后删除。
- 内置示例阵容不会把 `hasUserProgress` 标记为 `true`；用户实际修改会标记进度。
- 游客战报仍按 30 天有效期过滤，浏览器最多保存 20 场。

### 登录后的游客数据导入

- 注册成功后自动导入存在用户进度的游客工作区。
- 登录已有账号后显示待导入的球员、阵容和战报数量；用户可以选择“导入并继续”或“暂不导入”。
- 导入成功后才清空浏览器游客工作区。
- 导入失败时保留浏览器数据，并允许重试、暂不导入或继续游客体验。
- `src/lib/guest-import.ts` 负责构造服务端请求，并为旧版战报补齐阵容名称与球员显示快照；无法可靠恢复的数据会立即报错。

### 后端与数据库

- 新增认证接口 `POST /api/v1/guest-imports`。
- Flyway 迁移 `V10__add_guest_imports.sql` 新增 `guest_imports`，以游客工作区 UUID 作为主键。
- 同一游客工作区向同一账号重试时返回已导入结果，不会重复写入。
- 同一游客工作区导入另一个账号时返回 HTTP 409，避免跨账号污染。
- 自定义球员写入数据库后，阵容成员和战报球员引用会转换为新的数据库球员 ID。
- 已过期的游客战报不会导入；有效战报保留原创建时间和到期时间。
- 整个导入过程使用一个数据库事务，任何校验或写入失败都会撤销本次导入。

## 未完成工作

- 游客态目标没有遗留的功能开发任务。
- 本次 Session 的交接文档尚未提交：`docs/AI_HANDOFF.md`、`docs/plans/current.md`、`docs/ARCHITECTURE.md`。
- 腾讯云 TKE 部署仍属于后续工作，当前仓库只验证本地运行。

## 本轮修改过的文件

游客态业务改动已经包含在提交 `47d8020 feat: 支持游客态，更新 AGENTS.md 中的交接规范`：

- 项目与依赖：`.gitignore`、`AGENTS.md`、`package.json`、`package-lock.json`、`backend/pom.xml`
- 前端入口与界面：`src/App.tsx`、`src/styles.css`、`src/i18n/resources.ts`
- 前端数据边界：`src/lib/api.ts`、`src/lib/repository.ts`、`src/lib/guest-workspace.ts`、`src/lib/guest-import.ts`
- 前端测试：`src/App.test.tsx`、`src/lib/repository.test.ts`、`src/lib/guest-workspace.test.ts`、`src/lib/guest-import.test.ts`
- 后端游客导入：`backend/src/main/java/com/links/basketballgm/guest/` 下全部 Java 文件
- 后端战报导入支持：`backend/src/main/java/com/links/basketballgm/simulation/SimulationMapper.java`
- 数据库迁移：`backend/src/main/resources/db/migration/V10__add_guest_imports.sql`
- 后端测试：`backend/src/test/java/com/links/basketballgm/guest/GuestImportApiTest.java`、`backend/src/test/resources/application-test.yml`
- 文档骨架：`docs/AI_HANDOFF.md`、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/plans/current.md`

提交 `13d11b1 docs: 完善 AI 交接规范` 继续更新了 `AGENTS.md`。

## 修改中的文件

- `docs/AI_HANDOFF.md`
- `docs/plans/current.md`
- `docs/ARCHITECTURE.md`

业务源码在开始本次文档更新前没有未提交改动。

## 当前已知 bug

当前没有已确认且可以复现的产品 bug。

本地曾存在一个已经处理的运行状态问题：5173 端口上的旧 Vite 进程仍提供旧模块，导致登出后看到登录页。重启 Vite 后已确认服务返回当前游客态源码。切换分支或更改依赖后，如果浏览器显示内容与源码不一致，先检查 5173 端口上的进程和实际响应内容。

Vite 构建会报告单个 JavaScript chunk 超过 500 kB。这是构建警告，当前不会阻止运行或测试。

## 设计决策及原因

### 一个浏览器对应一个游客工作区

游客工作区使用持久 UUID。这个 UUID 同时用于导入幂等控制和跨账号冲突检查，使网络重试不会重复写入，也能阻止同一份浏览器存档进入两个账号。

### 注册自动导入，已有账号登录时由用户选择

注册产生新账号，没有覆盖已有远端数据的风险，因此自动导入。已有账号可能已经包含球员、阵容和战报，所以先显示数量并让用户决定。

### 成功导入后清空游客数据

清空可以防止后续用户在同一台设备上继承前一个用户的游客数据。失败和暂不导入都会保留工作区，保证用户可以重试或继续游客体验。

### 浏览器只保存差异数据

内置球员目录来自 `src/data/players.ts` 与生成的历史目录。localStorage 只保存自定义球员和用户覆盖，避免复制完整球员库。示例阵容只用于开始体验，不计为用户进度。

### 游客只能使用本地模拟

AI API Key 在服务端按账号加密保存。游客没有服务端身份，所以梦幻对战直接使用 TypeScript 本地规则引擎；登录用户可以在本地模拟和 AI 模拟之间选择。

### 导入使用完整事务

球员 ID、阵容成员和战报统计存在引用关系。后端在一个事务中完成预留、ID 转换和全部写入，避免数据库留下部分导入的数据。

## 本地运行条件

- Node.js 与 npm 已安装。
- Java 必须使用 JDK 21。
- Maven 位于 `/usr/local/opt/maven/bin`。
- PostgreSQL 16 本地开发库为 `basketball_gm_dev`。
- 后端集成测试库为 `basketball_gm_test`，测试配置见 `backend/src/test/resources/application-test.yml`。
- 根目录 `.env.local` 设置 `VITE_API_BASE_URL=/api/v1`，Vite 将 `/api` 代理到 `127.0.0.1:8080`。

启动后端：

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend
mvn spring-boot:run
```

启动前端：

```bash
npm run dev -- --host 127.0.0.1
```

前端地址为 `http://127.0.0.1:5173/`，后端健康检查为 `http://127.0.0.1:8080/api/v1/health`。

## 测试方法

前端单元、组件和数据测试：

```bash
npm test
```

TypeScript 类型检查与生产构建：

```bash
npm run build
```

格式检查：

```bash
npm run format:check
```

后端全部测试，包含真实本地 PostgreSQL 的游客导入接口测试：

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend
mvn test
```

`GuestImportApiTest` 会连接 `basketball_gm_test`，运行 Flyway，并验证幂等导入、跨账号冲突、自定义球员 ID 转换和过期战报过滤。测试清理自己创建的用户数据。

## 测试状态

2026-09-17 最近一次完整验证：

- 前端：8 个测试文件、18 项测试全部通过。
- 生产构建：通过。
- Prettier：通过。
- 后端：14 项测试全部通过，包含 3 项真实 PostgreSQL 游客导入接口测试。
- `git diff --check`：业务和交接文档没有空白错误；`AGENTS.md` 已在后续提交中修正先前的尾随空格。

## 下一步具体行动

1. 读取必需文档并检查 Git 状态。
2. 确认三份交接文档的改动符合新的任务背景。
3. 如果要提交本次交接文档，先再次运行前端与后端全部测试，再提交这些文件。
4. 新功能从 `develop` 分支继续开发和验证。
5. 合并或推送 `main` 前，遵守 `AGENTS.md`：完整运行全部测试并确保全部通过。

## 当前 Git 状态

- 分支：`develop`
- HEAD：`13d11b1 docs: 完善 AI 交接规范`
- 上游：`origin/develop`
- 开始本次交接更新前：本地与上游一致，工作区干净。
- 完成本次交接更新后：仅 `docs/AI_HANDOFF.md`、`docs/plans/current.md` 和 `docs/ARCHITECTURE.md` 有未提交修改。
