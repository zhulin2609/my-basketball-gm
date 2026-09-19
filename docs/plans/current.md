# Current Plan

更新时间：2026-09-19

## 当前目标

后端 Java 包从 `com.links.basketballgm` 重命名为 `com.basketballgm`，消除冗长的 `links` 层级。

## 已确认的决策

- 目录与包声明一起改：`backend/src/main/java/com/links/basketballgm/` 与对应 test 树整体 `git mv` 到 `com/basketballgm/`，98 个 Java 文件的 package 声明与 import 同步替换。
- Maven 坐标 `backend/pom.xml` 的 groupId 从 `com.links` 改为 `com.basketballgm`，artifactId 与 jar 文件名不变。
- 项目没有 MyBatis XML mapper（SQL 全部在注解上）、没有字符串形式的反射引用、没有显式 `@ComponentScan`/`@MapperScan`，重命名只涉及 package、import 与文档路径。Flyway 迁移是纯 SQL，不受影响；jar 入口由 spring-boot-maven-plugin 自动探测主类。

## 验收标准

- [x] 全部 98 个 Java 文件移动到新目录且内容替换完成，仓库内无 `com.links.basketballgm` 残留。
- [x] `mvn test` 34 项全部通过。
- [x] `npm run format:check` 通过。
- [x] 文档中的路径引用同步更新。

## 实施步骤

1. `git mv` 移动 main 与 test 两棵源码树到 `com/basketballgm/`。
2. 逐文件用编辑工具把 `com.links.basketballgm` 替换为 `com.basketballgm`（package 声明与 import），不使用脚本批量修改。
3. `backend/pom.xml` 的 groupId 改为 `com.basketballgm`。
4. 更新 `README.md`、`docs/README.en.md`、`docs/ARCHITECTURE.md`、`DESIGN.md` 中的路径引用。
5. 门禁：`mvn test`、`npm run format:check`。
6. 更新 `docs/AI_HANDOFF.md` 与本文件。

## 测试方法

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend && mvn test
npm run format:check
```

## 测试状态

2026-09-19 完成后验证：

- 后端：34 项测试全部通过（真实 PostgreSQL，含社区、游客导入、审核词表与模拟引擎测试）。
- Prettier：通过。
- 前端源码不引用 Java 包名，无需改动。

## 当前 Git 状态

- 分支：`develop`，基线提交：`96f3a70 docs: 在 AGENTS.md 中添加禁止 AI 修改的文件`。
- 包名重命名改动未提交，文件清单见 `docs/AI_HANDOFF.md`。
- 本地验证需要重新 `mvn package` 并重启后端：正在运行的旧 jar 仍是重命名前的构建产物。
