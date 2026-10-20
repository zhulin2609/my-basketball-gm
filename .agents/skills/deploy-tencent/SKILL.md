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
- 保留数据库容器和数据卷、服务器 `.env`、长期加密密钥及既有备份。不要读取私钥内容，不打印完整 `.env`、容器环境变量或含凭据的 Compose 配置。

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
sudo -n docker compose -f /opt/my-basketball-gm/compose.yaml version
sudo -n docker compose -f /opt/my-basketball-gm/compose.yaml ps
```

确认项目目录可读写、服务名称和 PostgreSQL 状态；记录更新前 SHA、容器 ID、镜像 ID、数据卷名称及挂载。仅筛选需要的 `docker inspect` 字段，不输出完整对象。

若云端非 main、存在未提交或未跟踪文件、sudo 权限不足、数据库不健康或已有部署正在运行，停止部署并报告。不自动 stash、删除、切换分支或覆盖修改。只读检查到此结束，可读取 `~/.bash_aliases` 中的 `gmup` 定义，但不得执行或 source 该文件。

## 2. 确定发布版本并拉取代码

以下步骤仅在有部署授权时执行。只读检查和发布期间使用同一个已核验的目标；不并行执行同一服务器的部署。

1. 在云端执行 `git fetch origin main`，记录 `origin/main` 的完整 SHA 作为本次目标。
2. 核验云端 HEAD 是目标的祖先。存在本地独有提交或分叉时停止；不要将云端自有提交随本次发布上线。
3. 检查更新前 SHA 到目标 SHA 的变更，特别是 Compose、Dockerfile、数据库迁移和部署配置。PostgreSQL 镜像、数据卷或挂载变化须单独处理，不能直接继续应用更新。
4. 查验目标版本对应的前后端完整测试与独立审查证据。缺少证据时，在本机隔离环境针对该版本补齐，测试数据库独立于用户开发库和生产库。若业务代码与已审版本相同且仅增加文档，可记录差异沿用业务审查结论。历史报告格式例外按已接受范围处理。
5. 执行并核验：

```bash
git -C /opt/my-basketball-gm pull --ff-only origin main
git -C /opt/my-basketball-gm rev-parse HEAD
```

更新后 HEAD 必须等于已记录的目标；远端在检查期间变化时停止后续操作，重新核验新目标，不能直接发布未经核验的版本。

实际按“拉取代码 → 备份数据库 → 构建 → 启动 → 验证”顺序执行。逐步调用明确命令，不直接调用 `gmup`；`gmup` 的定义可能随服务器配置变化，不能代替版本、备份和验证检查。

## 3. 备份与配置核验

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
sha256sum "$backup_dir/database.dump"
```

每条命令成功才进入下一步；目录外不复制备份内容。失败或 SSH 中断产生的文件保留并标为不完整，不以文件存在判定成功。`pg_restore --list` 仅证明归档目录可读，不能宣称恢复演练通过。原始数据和配置备份仅留在云端私有目录，回执只记录路径、大小、SHA-256 和命令状态。

在应用启动前核验更新后的 Compose：

- 使用 `sudo -n docker compose -f /opt/my-basketball-gm/compose.yaml config --quiet` 检查配置。
- 当前社区关闭要求服务器 `.env` 显式设置 `FORUM_ENABLED=false`。按当前 accepted decision 核验 Web 构建参数与 API 环境变量的有效值均为 false；只输出这些非敏感字段，使用标准 JSON/YAML 解析器读取 Compose 输出，避免完整配置进入日志。
- 服务器已有 `true` 会覆盖默认值；若发现偏差，报告具体字段及影响，按用户已授权的配置调整范围处理后重新核验，禁止带着偏差继续构建。不得自行更换 JWT、数据库密码或 `LLM_CREDENTIAL_ENCRYPTION_KEY`。
- 确定实际 Web 监听端口和公网入口；不要将文档示例端口、域名或 HTTPS 状态视为运行事实。

## 4. 构建并更新应用服务

先完成构建，再更新容器：

```bash
sudo -n docker compose -f /opt/my-basketball-gm/compose.yaml build web api
sudo -n docker compose -f /opt/my-basketball-gm/compose.yaml up --detach --no-deps --wait --wait-timeout 180 api web
```

构建失败立即停止，保留原运行服务。启动前确认 Compose 支持这些参数且 PostgreSQL 仍健康。仅更新 Web/API；不执行 `down`、`down --volumes`、数据库重建或清理镜像。

构建耗时较长时保留会话与日志，定期报告实际进展。SSH 中断后先检查云端进程、镜像与容器状态，确定上一条命令是否完成，再决定下一步；不能直接重跑整套流程。

启动失败或超时后只收集相关服务的有限日志和状态，脱敏后报告。数据库迁移可能已经执行，禁止自动恢复数据库、回退 Git 或反复重启。明确记录代码、镜像、容器及迁移各自的当前状态。

## 5. 验证并返回结果

1. 检查三个服务状态、健康状态、退出码和重启次数；核对 Web/API 容器使用本轮构建的镜像 ID。
2. 确认 PostgreSQL 容器 ID、数据卷及挂载与发布前一致。
3. 从云端回环地址请求首页和 `/api/v1/health`，确认 HTTP 状态及响应内容；从首页取得实际 JS/CSS 路径并验证资源可访问，避免仅以首页 200 判定成功。
4. 从本机请求已确认的公网入口，检查首页与 API。若受网络、DNS、TLS 或防火墙阻挡，单独标为未通过，不将云端回环检查表述为公网验收通过。
5. 检查本次版本的功能要求。当前包括备案号 `沪ICP备2026051556号-1` 与链接 `https://beian.miit.gov.cn/`、社区入口与阵容公开区域关闭、旧社区地址跳转，以及匿名社区读取返回 404。交互验证使用实际 DOM；遵守用户关于视觉工具的限制。登录状态验证仅使用已授权的测试账号，不自行创建生产数据；缺少条件的项目记为 NOT RUN。
6. 查看本轮启动后的有限 API/Web 日志，确认没有迁移或启动错误。不得为验证执行对战、发帖、修改身份绑定等未经授权的生产写入。

在本机仓库忽略目录 `.cache/deploy-tencent/<运行标识>/` 保存脱敏回执，记录目标别名、部署前后完整 SHA、备份位置及摘要、构建与容器状态、实际命令和 PASS / FAIL / NOT RUN、未验证范围。原工作区由其他 Agent 持有时不得写入；按仓库协作规则取得独立工作区。

最终回复说明部署结果、上线版本、备份路径、内网与公网验证结果及任何失败；仅完成构建或容器 healthy 时不能宣称全部功能验收通过。S01–S07 等平台验收保持原有状态，部署结果不替代平台验收。
