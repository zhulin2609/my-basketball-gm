# HTTPS 配置与部署流程独立审查

## Metadata

- Task：`https-config-release-20261025`。
- Round：01。
- Mode：`independent`。
- Reviewer：Codex；会话 `/root/https_independent_review`。
- Implementer：Codex；`codex-https-config-release-20261025` / `codex-https-origin-20261025`。
- Date：2026-10-25 09:35（Asia/Shanghai，UTC+08:00）。
- Branch：detached HEAD，独立审查 worktree。
- Worktree：`/Users/zhulin/.codex/worktrees/https-config-review/my-basketball-gm`。
- Base Commit：`c47b99156bdc5010d2baee7d2b45778005afa233`。
- Reviewed Commit：`23614ae84e79c9e99ea38241982b788121a5b729`。
- Snapshot：已提交版本；起始 worktree 干净，验证结束时 tracked 文件仍无修改，HEAD 未变化。本报告为唯一新增文档；测试证据保存在被忽略的 `.cache/https-origin/`。
- Comparison：`git diff c47b99156bdc5010d2baee7d2b45778005afa233 23614ae84e79c9e99ea38241982b788121a5b729`。
- Requirements：本轮审查委派的 HTTPS 同源 Origin 登录、CORS 与本地 HTTP 保持、证书目录必填及只读挂载、真实文件预检、候选验证后安装、容器更新及验收要求；上述版本的 `AGENTS.md`、canonical code-review Skill、`docs/plans/current.md` 相关 Goal / Acceptance Criteria，以及部署文档。
- Write Scope：本报告与独立 worktree 的 `.cache/` 验证证据。实现、测试、计划和主工作区保持原样；没有提交、推送或连接生产服务器。
- 独立上下文：本审查会话未参与实现，未读取旧审查报告。读取本轮变更及 current plan 时接触到了实施者在该文件中的历史 Validation 摘要，因此不声称完全未接触实施者自评。以下判断依据独立代码检查与本轮实际运行；历史测试摘要不作为通过证据。

## Scope

全部 11 个变更文件均已检查：

1. `.agents/skills/deploy-tencent/SKILL.md`
2. `deploy/compose.https.yaml`
3. `deploy/nginx/https.conf`
4. `docs/ARCHITECTURE.md`
5. `docs/deployment.md`
6. `docs/plans/current.md`
7. `package.json`
8. `scripts/https/check-config.py`
9. `scripts/https/compose.before-fix.yaml`
10. `scripts/https/compose.test.yaml`
11. `scripts/test-https.py`

同时核对基础 `compose.yaml`、`deploy/nginx/default.conf`、两个 Dockerfile、后端 `WebConfig` / `SecurityConfig`、application 配置、Maven 版本及相关 accepted decisions。范围不包含既有业务功能的重新全面审查、微信平台验收或生产部署执行。

## Findings

没有发现本轮范围内已确认的缺陷。`blocker`、`major`、`minor` 均为 0；没有待确认问题或需要用户接受的例外。

## Coverage and Validation

### 已核对项

- HTTPS Compose 仅在 HTTPS 部署启用 `SERVER_FORWARD_HEADERS_STRATEGY=native` 和 `SERVER_TOMCAT_REDIRECT_CONTEXT_ROOT=false`。API 没有宿主机发布端口；应用配置没有清空 Tomcat 内部代理限制。Nginx 保留实际 Host，覆盖 `X-Forwarded-Proto/Host/Port/For` 并清除 `Forwarded`，现有 CORS 允许名单没有扩大。
- 真实 Nginx TLS、Spring Boot 和独立 PostgreSQL 验证了关闭协议恢复时的 `403 Invalid CORS request`，以及启用目标配置后的两个域名健康、OPTIONS、注册、登录、token、错误密码和匿名认证行为。非法 Origin 与伪造转发头没有绕过检查。
- `HTTPS_TLS_DIRECTORY` 无默认值，未设置和空值均被 Compose 拒绝。证书和 Nginx 使用只读 bind 挂载并设置 `create_host_path: false`；预检拒绝缺失目录、错误目录类型、缺失证书链、缺失私钥和缺失 Nginx 文件。实际容器挂载 `RW=false`，写入探针收到只读文件系统错误。
- HTTPS 的 HTTP 入口保留两个域名及查询参数，返回 308。恢复基础 Compose 后，HTTP 同源注册、登录和 token 验证通过；开发 Origin 可用，非法 Origin 被拒绝。
- 部署 Skill 明确核对目标源文件、服务器安装副本与历史摘要，备份数据库和配置，验证候选 Compose 与 Nginx 后安装，再检查正式配置并使用 `--force-recreate` 更新 Web/API。PostgreSQL 容器与数据卷保留；步骤失败和来源差异均具有明确停止条件。
- 候选和正式 Compose 使用同一项目、基础配置与 `.env`；候选 Nginx 路径通过 sudo 后的环境变量传递。正式调用清除进程同名覆盖变量，配置检查确认正式安装路径。流程不依赖个人 shell 定义，配置 diff 与回执要求脱敏，仓库配置未写入真实证书目录或证书安装教程。
- 文档区分本地测试、候选校验、服务器安装、实际容器生效及公网验收。生产验收明确包含两个域名、正常 DNS、TLS 信任、Origin 健康、OPTIONS 和获授权账号登录；缺少账号授权须保留 NOT RUN。

### 本轮实际验证

| Command | Result | 环境、结果与边界 |
| --- | --- | --- |
| `git status --short`、`git rev-parse HEAD`、指定 SHA 的 `git diff` | PASS | 起始干净，完整 SHA 与委派一致；11 个文件差异已检查。 |
| `PATH="/usr/bin:$PATH" npm run test:https`（首次沙箱执行） | FAIL（环境） | `.cache` 创建被沙箱拒绝，尚未启动测试容器；随后经工具权限审批在同一独立目录执行。 |
| `PATH="/usr/bin:$PATH" npm run test:https`（获准执行） | PASS | 进程退出码 0，73 项真实检查通过；Compose 项目 `https-origin-19b6b3d59438`，随机回环端口，独立数据库卷；未使用主工作区 Maven 产物或测试数据库。 |
| 上述测试调用的 Web/API `docker compose build` | PASS | 当前 Reviewed Commit 的源码构建；Web 的 `npm run build` 包含四个包的 typecheck；后端 Maven package 使用 `-DskipTests`，不计为后端测试通过。 |
| 上述测试调用的 `docker compose exec -T web nginx -t` | PASS | 日志确认语法与配置检查成功；使用本轮测试证书和真实 HTTPS 配置。 |
| `git diff --check c47b99156bdc5010d2baee7d2b45778005afa233 23614ae84e79c9e99ea38241982b788121a5b729` | PASS | 变更没有 whitespace error。 |
| `git diff --quiet`、`git diff --cached --quiet`、`git rev-parse HEAD` | PASS | 验证后 tracked 文件仍无修改；HEAD 保持 Reviewed Commit。 |

实际本机环境：Docker Compose v5.5.1、系统 Python 3.9.6、curl 8.7.1、LibreSSL 3.3.6；项目 Spring Boot 为 4.1.1。构建与运行日志位于本审查 worktree 的 `.cache/https-origin/https-origin-19b6b3d59438/compose.log`，73 项检查记录为同目录 `checks.json`。日志确认本次 Web、API、PostgreSQL 三个容器全部停止；独立卷与证据按测试设计保留。

部署文档引用的 [Spring Boot 代理配置说明](https://docs.spring.io/spring-boot/how-to/webserver.html#howto.webserver.use-behind-a-proxy-server) 已实时读取，当前页面版本为 4.1.2。文档支持 native 转发头处理、Tomcat SSL 终止时的 redirect-context-root 设置及保留内部代理限制；项目 4.1.1 的实际行为以上述真实运行结果为依据。

### 文档差异与未验证项

没有发现本轮目标说明与实现之间影响验收的差异。current plan 保留的历史验证与实施者声明没有转换为本次审查执行结果。

- 前后端全部业务测试：本审查会话 NOT RUN；主任务另行执行。这里的集成检查仅支持 HTTPS 配置及相关认证回归结论，不能代替 main 推送前完整测试门禁。
- 生产服务器的配置差异、备份、候选安装、容器更新、DNS、真实证书链和线上账号登录：NOT RUN。本轮按授权只检查流程并执行本地隔离验证，没有连接生产环境。
- 生产 root 权限与文件替换失败路径、数据库恢复演练：NOT RUN；这些操作未获本轮执行授权。Skill 已规定对应检查和停止条件。
- 浏览器界面交互、微信真机与 S01–S07：NOT RUN，不在本轮配置变更的验证范围。

## Conclusion

`PASS`，适用于 `23614ae84e79c9e99ea38241982b788121a5b729` 相对 `c47b99156bdc5010d2baee7d2b45778005afa233` 的上述 11 个文件，以及所列本地 HTTPS/HTTP 验证范围。没有已确认缺陷或待用户接受的例外；生产安装和平台验收保持未执行状态。提交、合并、推送和发布仍遵守主任务授权与各自门禁。
