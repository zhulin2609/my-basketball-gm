---
name: deploy-tencent
description: 检查或部署 My Basketball GM 的腾讯云 Docker Compose 服务。用于用户要求通过 basketball / mybasketball 检查服务器、更新云端 main、备份数据库、重建 Web/API 或验证部署结果；检查请求保持只读，部署须有当前用户授权。
---

# 腾讯云部署

遵循仓库 `AGENTS.md`。先读取 `docs/deployment.md`、当前任务计划和本次发布相关的 accepted decisions，核对实际配置与 Git 状态。

## 目标与授权

- 本机入口：`basketball` 是 `ssh mybasketball` 的 shell alias。自动执行使用 SSH Host `mybasketball`，每次通过 `ssh -G mybasketball` 核验实际目标与用户；不依赖交互 shell 加载 alias。
- 云端项目目录：`/opt/my-basketball-gm`；发布分支：`main`；Compose 服务：`web`、`api`、`postgres`。这些是定位线索，必须核验。
- “检查连接”“查看状态”只执行只读检查；创建或修改本 Skill 不授权部署。“部署最新 main”授权按下列顺序拉取代码、备份、构建并更新应用服务，不需要重复确认同一授权。
- 不自动提交、推送、修改 SSH 配置、调整防火墙、申请证书、切换数据库版本或开放社区。小程序上传发布另需授权。
- 仓库管理 HTTPS Compose 与 Nginx 配置源文件，服务器保存安装副本及环境参数；部署授权包含经核验的目标版本配置安装。保留数据库容器和数据卷、服务器 `.env`、长期加密密钥、证书及既有备份。不要读取私钥内容，不打印完整 `.env`、容器环境变量或含凭据的 Compose 配置。证书安装、更换另需授权。

## 1. 只读检查

使用已配置的 SSH 认证和已知主机记录：

```bash
ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o UpdateHostKeys=no -o ConnectTimeout=10 -o ConnectionAttempts=1 -o ClearAllForwardings=yes -o RemoteCommand=none mybasketball 'hostname; id -un'
```

认证失败、主机密钥未知或变化时停止，报告具体原因；不关闭主机校验，不要求用户在聊天中发送密码或私钥。

通过 SSH 分别执行以下云端检查，逐项检查退出码：

```bash
git -C /opt/my-basketball-gm branch --show-current
git -C /opt/my-basketball-gm rev-parse HEAD
git --no-optional-locks -C /opt/my-basketball-gm status --porcelain=v1 --untracked-files=all
sudo -n docker compose version
```

读取 `docs/deployment.md` 的 HTTPS 配置清单，确认两个 Compose 文件、`.env`、Nginx 配置存在且类型正确。证书来源从服务器有效配置读取；只在远端进程内使用实际路径，不写入仓库、日志或回执。`HTTPS_TLS_DIRECTORY` 必须显式设置为包含当前站点证书链和私钥的目录；缺失时停止，不推断或写入默认值。不读取或依赖个人 shell 命令定义，不自动创建缺失挂载目录或省略 HTTPS 覆盖文件。

在云端同一 Bash 会话中定义命令数组，仅固定调用参数，不执行部署：

```bash
deployment_compose=(
  sudo -n env -u HTTPS_TLS_DIRECTORY -u HTTPS_NGINX_CONFIG docker compose
  --project-directory /opt/my-basketball-gm
  --env-file /opt/my-basketball-gm/.env
  -f /opt/my-basketball-gm/compose.yaml
  -f /etc/my-basketball-gm/compose.https.yaml
)
"${deployment_compose[@]}" config --quiet
"${deployment_compose[@]}" ps
```

该数组用于已安装配置的检查、启动、日志与验证；候选配置阶段使用第 4 节的 `candidate_compose`，两者须具有相同项目、环境文件与基础 Compose。每次新建 SSH 会话都重新定义；通过标准输入传送脚本时，无需输入的 `exec -T` 命令使用 `</dev/null`，避免消费后续脚本。基础文件在前、HTTPS 覆盖文件在后；不得仅加载仓库 `compose.yaml` 重建云端 Web，否则可能移除 443 与证书挂载。

确认项目目录可读写、服务名称和 PostgreSQL 状态；记录更新前 SHA、容器 ID、镜像 ID、数据卷名称及挂载。用 Compose 项目名称和容器的 `com.docker.compose.project` 标签核对同一项目；不通过修改项目名称创建另一组服务。仅筛选需要的 `docker inspect` 字段，不输出完整对象。

核对有效配置和正在运行的 Web 容器：HTTP 80、HTTPS 443、证书与站点配置只读挂载、`/healthz` 健康检查。目标配置将当前站点证书目录挂载到 `/etc/nginx/tls`，证书文件为 `fullchain.crt` 与 `private.key`，站点配置挂载到 `/etc/nginx/conf.d/default.conf`。首次采用目标布局时，对照服务器现状明确挂载差异；证书保留原位，不搬移文件。未解释的容器与已安装配置差异必须先解决。

若云端非 main、存在未提交或未跟踪文件、sudo 权限不足、数据库不健康或已有部署正在运行，停止部署并报告。不自动 stash、删除、切换分支或覆盖修改。只读请求可继续执行第 3 节的配置、现有容器证书检查及第 5 节的只读 HTTP 验证；不进入拉取、备份、构建、临时容器或启动步骤。

## 2. 确定发布版本并拉取代码

以下步骤仅在有部署授权时执行。只读检查和发布期间使用同一个已核验的目标；不并行执行同一服务器的部署。

1. 在云端执行 `git fetch origin main`，记录 `origin/main` 的完整 SHA 作为本次目标。
2. 核验云端 HEAD 是目标的祖先。存在本地独有提交或分叉时停止；不要将云端自有提交随本次发布上线。
3. 检查更新前 SHA 到目标 SHA 的变更，特别是 Compose、Dockerfile、数据库迁移和部署配置。PostgreSQL 镜像、数据卷或挂载变化须单独处理，不能直接继续应用更新。
4. 查验目标版本对应的前后端完整测试、`npm run test:https` 与独立审查证据。HTTPS 测试必须使用真实 Nginx TLS、Spring Boot 和独立 PostgreSQL，覆盖携带 Origin 的登录及本地 HTTP 回归。缺少证据时，在本机隔离环境针对该版本补齐，测试数据库独立于用户开发库和生产库。若业务代码与已审版本相同且仅增加文档，可记录差异沿用业务审查结论。历史报告格式例外按已接受范围处理。
5. 执行并核验：

```bash
git -C /opt/my-basketball-gm pull --ff-only origin main
git -C /opt/my-basketball-gm rev-parse HEAD
```

更新后 HEAD 必须等于已记录的目标；远端在检查期间变化时停止后续操作，重新核验新目标，不能直接发布未经核验的版本。

实际按“拉取代码 → 核对配置差异 → 备份数据库与配置 → 准备候选配置 → 构建与验证 → 安装配置 → 更新容器 → 验证”顺序执行。逐步调用明确命令，不依赖交互 shell 的函数或别名。

## 3. 备份与配置核验

比较目标提交的 `deploy/compose.https.yaml`、`deploy/nginx/https.conf`、服务器安装副本和上次成功部署回执中的源文件及安装摘要。将本次版本变更与服务器额外修改分别核实；未知修改停止覆盖。首次纳入管理没有历史摘要时，逐项解释现有差异后建立基线。配置差异可能含旧证书路径，禁止直接将原始 diff 写入日志或回执，只记录脱敏字段及影响。

备份使用更新前已记录的 PostgreSQL 容器 ID，避免新 Compose 配置意外指向其他数据库。在云端创建唯一的私有备份目录，例如 `$HOME/my-basketball-gm-backups/<UTC时间>-<目标SHA前缀>`；设置 `umask 077`，目录存在时停止，避免覆盖备份。

以下命令在云端 shell 执行；`pg_container` 和 `backup_dir` 必须赋为本轮已核验的容器 ID 和新建目录。采用分步骤命令，或先写入仓库忽略目录中的脚本并检查后执行，避免复杂多层引号。

```bash
sudo -n docker exec "$pg_container" sh -c 'pg_dump --username="$POSTGRES_USER" --format=custom "$POSTGRES_DB"' > "$backup_dir/database.dump"
```

仅在 `pg_dump` 退出码为 0 后继续：

```bash
test -s "$backup_dir/database.dump"
sudo -n docker exec -i "$pg_container" pg_restore --list < "$backup_dir/database.dump" > "$backup_dir/database.toc"
cp -p /opt/my-basketball-gm/.env "$backup_dir/environment.env"
chmod 600 "$backup_dir/environment.env"
sudo -n install -m 600 /etc/my-basketball-gm/compose.https.yaml "$backup_dir/compose.https.yaml"
sudo -n install -m 600 /etc/my-basketball-gm/default.conf "$backup_dir/default.conf"
sha256sum "$backup_dir/database.dump"
```

额外核对备份的三个配置文件与源文件 SHA-256 相同；证书只记录 SHA-256 指纹、有效期、SAN 和权限检查结果。证书及私钥保留原位，不复制到仓库或本机回执。配置备份失败同样停止部署。配置安装只在第 4 节候选验证通过后进行。

每条命令成功才进入下一步；目录外不复制备份内容。失败或 SSH 中断产生的文件保留并标为不完整，不以文件存在判定成功。`pg_restore --list` 仅证明归档目录可读，不能宣称恢复演练通过。原始数据和配置备份仅留在云端私有目录，回执只记录路径、大小、SHA-256 和命令状态。

对候选配置和安装后的有效 Compose 分别核验：

- 使用对应命令数组的 `config --quiet` 检查基础与 HTTPS 配置的合并结果；核验项目名称、端口、只读挂载、`/healthz` 健康检查及 PostgreSQL 定义。Compose 端口可能合并保留，须检查有效配置，不凭覆盖文件中的单项判断最终端口。通过标准输入将 `config --format json` 交给 `scripts/https/check-config.py` 检查真实来源目录、非空文件及只读挂载；使用 `set -o pipefail`，不将完整配置打印或保存。
- 当前社区关闭要求服务器 `.env` 显式设置 `FORUM_ENABLED=false`。按当前 accepted decision 核验 Web 构建参数与 API 环境变量的有效值均为 false；只输出这些非敏感字段，使用标准 JSON/YAML 解析器读取 Compose 输出，避免完整配置进入日志。
- 服务器已有 `true` 会覆盖默认值；若发现偏差，报告具体字段及影响，按用户已授权的配置调整范围处理后重新核验，禁止带着偏差继续构建。不得自行更换 JWT、数据库密码或 `LLM_CREDENTIAL_ENCRYPTION_KEY`。
- 确定实际 Web 监听端口和公网入口；不要将文档示例端口、域名或 HTTPS 状态视为运行事实。
- HTTPS 的 API 有效配置必须包含 `SERVER_FORWARD_HEADERS_STRATEGY=native`、`SERVER_TOMCAT_REDIRECT_CONTEXT_ROOT=false`；Nginx 覆盖客户端转发头并保留实际 Host/HTTPS 协议。核验 API 没有宿主机发布端口、实际 Nginx 来源地址在 Tomcat 内部代理受信范围内；不清空代理限制，不扩大 CORS 允许名单。

从有效 Compose 的证书挂载来源检查目录和文件，实际路径仅保留在远端进程内。证书目录应为 root 所有、权限 700，私钥为 root 所有、权限 600，证书链可为 644。使用 `stat` 只输出权限与所有者，不输出文件名；使用 `openssl x509` 检查指纹、有效期及两个域名匹配。权限不符、过期、尚未生效或域名不匹配时停止，不自动更改。错误输出中包含实际路径时必须脱敏。

执行现有容器 `nginx -t`，并在第 4 节用候选配置检查证书与私钥匹配及 Nginx 语法。证书链信任、有效期及实际服务域名还须通过第 5 节的 HTTPS 请求验证，不能用 `-k` / `--insecure` 绕过。配置与证书校验结果不等于已成功部署。

## 4. 验证候选配置、安装并更新应用服务

在云端私有备份目录内准备 `candidate` 子目录，将已核验目标版本的两个源文件复制为 `compose.https.yaml` 与 `https.conf`，比较 SHA-256 确认复制一致。`candidate_dir` 必须指向该目录。准备候选文件不修改正式安装副本；源文件、环境参数和证书不得在验证期间变化。

定义候选命令数组。`HTTPS_NGINX_CONFIG` 在 sudo 后设置，确保临时容器使用候选配置；证书目录仍从服务器 `.env` 读取。清除调用进程中同名的证书目录变量，避免覆盖服务器参数。不 source `.env`。

```bash
candidate_compose=(
  sudo -n env -u HTTPS_TLS_DIRECTORY
  "HTTPS_NGINX_CONFIG=$candidate_dir/https.conf"
  docker compose
  --project-directory /opt/my-basketball-gm
  --env-file /opt/my-basketball-gm/.env
  -f /opt/my-basketball-gm/compose.yaml
  -f "$candidate_dir/compose.https.yaml"
)
set -o pipefail
"${candidate_compose[@]}" config --quiet
"${candidate_compose[@]}" config --format json |
  sudo -n python3 /opt/my-basketball-gm/scripts/https/check-config.py
"${candidate_compose[@]}" build web api
"${candidate_compose[@]}" run --rm --no-deps -T web nginx -t </dev/null
```

逐条检查退出码，每条成功才进入下一步；管道失败立即停止。构建或候选配置检查失败时，正式配置和原服务保持原状。`run` 创建短暂测试容器，不发布端口、不启动依赖，仅在部署授权下执行；现有 API 必须可供 Nginx 解析上游名称。

候选检查通过后，重新核对正式文件摘要与备份时一致、候选与目标提交一致、环境和证书未变化。将候选文件安装至正式路径，设置 root 所有和 644 权限；逐个文件在目标目录写入临时副本后原子替换，避免截断正在使用的文件。两个文件无法组成一次原子替换，任一步失败都停止，记录已替换文件及摘要，不启动服务、不自动恢复。配置相同时无需替换。

使用 `deployment_compose` 再次执行合并配置检查、同一预检脚本和临时容器 `nginx -t`；安装摘要必须与候选一致，有效配置除 Nginx 来源路径外必须一致。正式 Nginx 来源必须为已核验的安装路径，不能遗留候选路径。通过后按以下命令重新创建应用容器，让单文件挂载和 API 环境参数一起生效：

```bash
"${deployment_compose[@]}" up --detach --no-deps --force-recreate --wait --wait-timeout 180 api web
```

启动前确认 PostgreSQL 仍健康。仅更新 Web/API；不执行 `down`、`down --volumes`、数据库重建或清理镜像。保留本轮候选文件、备份和配置摘要，供下次核对。

构建耗时较长时保留会话与日志，定期报告实际进展。SSH 中断后先检查云端进程、镜像与容器状态，确定上一条命令是否完成，再决定下一步；不能直接重跑整套流程。

启动失败或超时后只收集相关服务的有限日志和状态，脱敏后报告。数据库迁移可能已经执行，禁止自动恢复数据库、回退 Git 或反复重启。明确记录代码、镜像、容器及迁移各自的当前状态。

## 5. 验证并返回结果

1. 检查三个服务状态、健康状态、退出码和重启次数；核对 Web/API 容器使用本轮构建的镜像 ID。
2. 确认 PostgreSQL 容器 ID、数据卷及挂载与发布前一致。
3. 重新核对 Web 实际 80/443 端口与只读挂载，执行现有容器 `nginx -t`。`http://127.0.0.1/healthz` 应返回 200。分别使用 `curl --resolve link9.fun:443:127.0.0.1` 和 `curl --resolve www.link9.fun:443:127.0.0.1` 请求相应 HTTPS 首页和 `/api/v1/health`；保留域名、SNI 与证书校验，确认 HTTP 200 和响应内容。从首页取得实际 JS/CSS 路径并验证资源内容与类型。HTTP 首页预期为 308，Location 指向对应域名的 HTTPS 地址并保留路径和查询参数；验证跳转时不使用 `--location`，避免只检查最终 200。
4. 从本机按正常 DNS 分别请求 `https://link9.fun/`、`https://www.link9.fun/` 及各自的 API 和静态资源，验证证书信任和域名匹配，并检查两个 HTTP 入口的跳转。请求设置连接与总超时；直接连接诊断可用 `--noproxy '*'`，并记录实际使用的网络路径。若受网络、DNS、TLS 或防火墙阻挡，单独标为未通过，不将云端回环检查表述为公网验收通过。回环诊断可使用第 3 项的 `--resolve`，公网验收不得通过固定 IP 掩盖 DNS 问题。
5. 两个域名的回环与公网检查都须增加对应 `Origin: https://<域名>`：GET `/api/v1/health` 返回 200 且 JSON `status=ok`；OPTIONS `/api/v1/auth/login` 携带 `Access-Control-Request-Method: POST` 和 `Access-Control-Request-Headers: content-type` 返回 200。无 Origin 的健康请求不能替代该检查；任何 `Invalid CORS request` 均判定失败。使用已授权测试账号进行 HTTPS Origin 登录，再用 token 请求 `/api/v1/auth/me` 验证账号；密码和 token 不进入参数列表、日志或回执。未取得测试账号授权时将真实登录记为 NOT RUN，不宣称登录验收通过；生产环境不自动注册账号或尝试错误密码。
6. 检查本次版本的功能要求。当前包括备案号 `沪ICP备2026051556号-1` 与链接 `https://beian.miit.gov.cn/`、社区入口与阵容公开区域关闭、旧社区地址跳转，以及匿名社区读取返回 404。交互验证使用实际 DOM；遵守用户关于视觉工具的限制。登录状态验证仅使用已授权的测试账号，不自行创建生产数据；缺少条件的项目记为 NOT RUN。
7. 查看本轮启动后的有限 API/Web 日志，确认没有迁移或启动错误。不得为验证执行对战、发帖、修改身份绑定等未经授权的生产写入。

在云端本轮备份目录保存部署回执，并在本机仓库忽略目录 `.cache/deploy-tencent/<运行标识>/` 保存脱敏副本。记录目标别名、部署前后完整 SHA、配置源文件及安装副本的摘要、上次成功回执位置、已解释的差异、候选检查结果、备份位置及摘要、证书指纹与有效期、构建与容器状态、两个域名的 HTTPS/HTTP/API 验证、PASS / FAIL / NOT RUN 和未验证范围。证书实际路径、完整环境参数和含敏感参数的命令不进入回执。未成功完成的运行标为失败或未完成，不替换上次成功基线。原工作区由其他 Agent 持有时不得写入；按仓库协作规则取得独立工作区。

最终回复说明部署结果、上线版本、备份路径、内网与公网验证结果及任何失败；仅完成构建或容器 healthy 时不能宣称全部功能验收通过。S01–S07 等平台验收保持原有状态，部署结果不替代平台验收。
