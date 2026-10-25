# Compose 预检兼容性独立审查 Round 01

## Metadata

- Task：`compose-preflight-compat-20261025`
- Round：01；Mode：`independent`
- Reviewer：Codex / `compose_compat_review`
- Implementer：`codex-compose-preflight-compat-20261025`
- Date：2026-10-25 09:55 +08:00
- 独立上下文：未参与实现，未读取本任务其他审查报告、实施者日志或自评。任务需求和冻结摘要来自父任务；读取当前 checkout 的规则、相关代码、部署说明及 current plan 中的既有任务索引。既有记录中的运行结果不计入本轮验证。
- Branch：detached HEAD。
- Worktree：`/Users/zhulin/.codex/worktrees/compose-compat-review/my-basketball-gm`
- Base Commit / HEAD：`b52f57fd5f559a6484e5c6ab79597c9f315fb950`
- Reviewed Commit：N/A，包含未提交文件。
- Snapshot ID：`compose-compat-01`。内容保存在上述独立 worktree，未提交文件须继续保留才能复现；摘要本身不保存文件内容。
- Scope：下列五个文件；比较命令为 `git diff -- scripts/https/check-config.py scripts/test-https.py docs/deployment.md`，两个未跟踪 YAML 文件逐项读取。`git diff --cached` 为空。
- Requirements：本轮任务指令要求兼容 Compose 2.32.4 省略 `false` 与 5.5.1 省略 `true` 的 JSON 输出；接受禁止自动创建目录的有效只读挂载，拒绝自动创建目录、缺失文件等风险；禁止根据未知版本猜测；验证必须使用真实 Compose 输出。现有文件要求来自 `docs/ARCHITECTURE.md:21`、`deploy/compose.https.yaml` 与 `docs/deployment.md:172`。
- Write Scope：仅本报告与本 worktree 的忽略 `.cache`；未修改实现、测试、计划、规则或其他报告。未提交、推送、连接服务器、读取生产目录或凭据。

## Snapshot

开始和结束检查均匹配以下 SHA-256，删除项为空。原始未暂存为三个已跟踪文件，未跟踪为两个 YAML；暂存区为空。

| 文件 | SHA-256 |
| --- | --- |
| `scripts/https/check-config.py` | `fa6d742385b1e0d9d3c27060b21d875d68e5550a5f7153316e89d3e1ad9a3e02` |
| `scripts/https/compose.bind-policy.yaml` | `d3f4f93e01d52cb25d811c43d078909885bb1ddd862240aeadce3e95654f4829` |
| `scripts/https/compose.unsafe-bind.yaml` | `f68886a910a3cc3a8b0f0a9ec53e7e763a539ab5d7244e85109bd65e5ab4b044` |
| `scripts/test-https.py` | `446186335787a26095df298b03e5a05c13db83eda008151a6e934c5e4e6b8446` |
| `docs/deployment.md` | `629e08bf263840071b4fcf24f4b1c1a8222061f69306b2a55d3cfc0d8daa9fc7` |

相关未修改输入均来自上述 HEAD；结束时核对 Git 状态，未发现其他实现差异：

| 文件 | SHA-256 |
| --- | --- |
| `compose.yaml` | `6fccbce7e58c9af1d04f2fb68ae673c5acb2872f5488a6b76e92ff49ed0489b1` |
| `deploy/compose.https.yaml` | `65e7c6c0e13adc22e687b950f181e856ee450f9171c5a51f8245a367b4a6ae65` |
| `scripts/https/compose.test.yaml` | `3a564da775c105cd3893139b91e4b1427ee462bc24df43a7cd441e64c6cca190` |
| `deploy/nginx/https.conf` | `f11cf92188ddbd00acb00c9c053cb3097217e4a4a9b0602a77e263d68c0cf307` |
| `package.json` | `39bf09234c76a7c60154fc1297eade354ed9befd3469d3b4c5ac56b2c83e5244` |
| `AGENTS.md` | `f2b82c4cefc5c513faef71c34574a47983aed6f3a2bad7708208b8f452cc630d` |
| `.agents/skills/code-review/SKILL.md` | `bc05498afdc1cb794e3c1013b62f492ba592af670ee77d71e09281cbe7a6ea55` |
| `.agents/skills/code-review/references/reporting.md` | `1fbb98550216dca2098d0a4a5b055892b7864853396fb24d5e457b118f3d94f8` |

排除实施者的 current plan 运行记录、其他 worktree 的未提交内容、历史审查报告、生产配置及凭据。只读取父任务明确提供的官方 ARM64 Compose 2.32.4 工具；其 SHA-256 为 `dc30b0276c0ba45857eef021b677d4fb2bbf13bcf809f99b691db9512bca47cc`，与任务提供值一致。

## Findings

未发现本轮范围内已确认缺陷。缺陷计数：blocker 0、major 0、minor 0。

## Coverage and Validation

已核对 `serialized_false()` 的探测输入、成功输出解析、不可区分策略时的拒绝逻辑及异常传播。探测 YAML 明确包含 `false` 和 `true` 两种策略，实际挂载使用同一 Compose 的序列化结果比较；未根据版本号设置默认值。探测仅执行 `config`，不启动服务。

实际运行确认：Compose 2.32.4 输出 disabled `{}`、enabled `{"create_host_path": true}`；Compose 5.5.1 输出 disabled `{"create_host_path": false}`、enabled `{}`。两种情况下，安全挂载通过、允许创建目录的挂载被拒绝。

检查现有 `configuration_checks()` 的全部 13 项，并独立补充五项真实配置验证。每个版本均通过以下 18 项：

1. `HTTPS_TLS_DIRECTORY` 未设置时 Compose 拒绝配置。
2. `HTTPS_TLS_DIRECTORY` 为空字符串时 Compose 拒绝配置。
3. 证书目录缺失时预检拒绝。
4. 证书目录实际为文件时预检拒绝。
5. 空证书目录被拒绝。
6. 仅有证书链、缺少私钥时预检拒绝。
7. 仅有私钥、缺少证书链时预检拒绝。
8. Nginx 配置文件缺失时预检拒绝。
9. 上述预检未创建缺失来源路径。
10. 实际短期自签证书、私钥与仓库 Nginx 配置通过预检。
11. TLS 挂载的实际 Compose JSON 为只读。
12. Nginx 配置挂载的实际 Compose JSON 为只读。
13. TLS 挂载显式 `create_host_path: true` 时预检拒绝。
14. Nginx 配置挂载显式 `create_host_path: true` 时预检拒绝。
15. Nginx 配置挂载 `read_only: false` 时预检拒绝。
16. Nginx 配置使用只读 short syntax 时，因允许创建来源目录被拒绝。
17. 证书链为零长度真实文件时预检拒绝。
18. 私钥为零长度真实文件时预检拒绝。

验证脚本保存在 `.cache/compose-compat-review/verify.py`。它加载待审 `scripts/test-https.py` 并直接执行 `configuration_checks()`；证书由 OpenSSL 生成，额外场景通过真实 YAML 和 Compose 产生 JSON，未手工伪造 JSON、替换 subprocess 或使用 mock。两个运行使用各自随机测试目录。Compose 2.32.4 通过本审查目录中的 Docker CLI 插件路径选择，生成配置和预检子进程继承同一 `DOCKER_CONFIG`。

| Command | Result | 环境、结果和局限 |
| --- | --- | --- |
| `docker compose version` | PASS | 本机 Compose v5.5.1。 |
| `DOCKER_CONFIG="$PWD/.cache/compose-compat-review/docker-v2" docker compose version` | PASS | 官方 ARM64 Compose v2.32.4，通过独立目录的 `cli-plugins/docker-compose` 符号链接加载。 |
| `PYTHONDONTWRITEBYTECODE=1 python3 .cache/compose-compat-review/verify.py > .cache/compose-compat-review/v5-final.log 2>&1` | PASS | 退出 0，18 项通过；本机 Compose 5.5.1，同一执行环境 `python3 --version` 返回 3.9.6。 |
| `DOCKER_CONFIG="$PWD/.cache/compose-compat-review/docker-v2" PYTHONDONTWRITEBYTECODE=1 python3 .cache/compose-compat-review/verify.py > .cache/compose-compat-review/v2-final.log 2>&1` | PASS | 退出 0，18 项通过；本机 Compose 2.32.4，同一执行环境 `python3 --version` 返回 3.9.6。 |
| 初次补充验证，日志 `v5.log`、`v2.log` | FAIL | 两个版本的现有 13 项均通过；审查辅助 YAML 未明确设置只读，导致首先触发只读校验，与辅助脚本期望不符。更正辅助 YAML 后完成上述最终运行，待审文件始终未变。 |
| `git diff --check` | PASS | 无空白错误。 |
| 开始、结束 `shasum -a 256` 与 `git status --short` | PASS | 五个冻结文件摘要完全匹配，无范围外实现改动。 |
| `npm run test:https` 完整容器运行 | NOT RUN | 本轮仅执行其中发生变化的配置检查；没有构建或启动服务，HTTPS 请求、CORS、真实容器 mount 行为不属于本轮新增兼容逻辑的验证范围。 |
| 前后端全量测试、TypeScript typecheck | NOT RUN | 本轮未修改实现；审查差异位于 Python 预检、Compose 配置与文档，执行真实配置定向验证。此结论不满足 main 推送的全量测试门禁。 |
| 生产 Linux Compose、服务器部署与重启后验收 | NOT RUN | 本轮未连接服务器；macOS 官方 2.32.4 输出验证不代表生产部署完成。 |

文档差异：未发现。`docs/deployment.md` 明确要求生成 JSON 和执行预检使用相同 Docker CLI、Compose 插件与执行环境，描述与实现一致。若跨版本传递 JSON，当前预检不具备识别来源的元数据；这属于文档明确排除的使用方式，本轮未扩大接口要求。

未知版本的不可区分输出仅完成代码路径检查；没有构造假的 Compose 输出来宣称实测。当前环境的两个真实版本均可区分对应策略。证书内容有效性、私钥匹配、服务器安装、运行时目录变更与容器启动属于部署阶段，本报告不授予这些环节的完成结论。

## Conclusion

`PASS`，适用于 `compose-compat-01` 的五个冻结文件及上述配置预检范围。36 项真实 Compose 检查通过，未发现需要修复的问题；无用户批准例外。报告不授予提交、合并、推送或部署权限，生产平台验收保持 NOT RUN。
