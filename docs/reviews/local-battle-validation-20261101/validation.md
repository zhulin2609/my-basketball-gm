# 本地对战资格校验验证记录

日期：2026-11-01（Asia/Shanghai）。基线：`fbdd5bcd83a389a04095928e6ca91c8ea5193b45`；业务源码对应审查快照 `local-battle-validation-01`。

## 实现与回归范围

- 编辑阵容和梦幻对战两个 Web 入口共同使用 `validateMatchup`，禁用不合格对战并说明主客队、阵容名称与原因。
- `play` 在调用服务前校验实际参数；共享 `simulate` 在计算统计之前抛出 `MatchupValidationError`。只有成功模拟才保存战报。
- 沿用现有规则：5–15 名成员、最多 13 名激活球员、五个位置各一名激活首发、球员唯一。另检查双方存在、双方不同及球员引用完整。
- 空阵容继续允许创建、保存和编辑。后端、小程序页面源码无修改；小程序使用的共享引擎同步获得校验。

新增 46 项测试：core 资格矩阵 31 项、引擎空队回归 3 项、client 历史保存回归 3 项、Web 交互 9 项。覆盖双方 0–4 人、全部非激活、全部替补、首发不足或过多、首发位置缺失或重复、球员重复、14 名激活、16 名成员、球员引用丢失、同队对战、选择缺失；合格 5 人与 15 人边界仍正确模拟。Web 覆盖新建空队、对手选择、成员删除、首发取消、选择变化、中英文原因、合法恢复、历史保留与重新挂载。

## 命令与结果

日志目录：`.cache/local-battle-validation/`。

- `npm test -- packages/core/src/simulator.test.ts packages/client/src/battle-service.test.ts`，仅加入回归、修复之前：FAIL（预期）。`red.log`；6 项新增空队用例失败、8 项通过，确认原缺陷可复现。
- `npm run build`：PASS。`build.log`；包括四包 typecheck 和 Web 构建。保留大于 500 kB 的 chunk 提示。
- `MINI_API_BASE_URL=http://127.0.0.1:8088/api/v1 npm run build:weapp`：PASS。`build-weapp-configured.log`；四包 typecheck、小程序编译及 dist 地址核验通过。此地址仅为本地构建参数。保留资源大小提示。
- `npm test -- --maxWorkers=1`，独立审查：PASS。`reviewer/full-tests.log`；34 文件 / 226 项通过，223.24 秒；项目 API 使用真实 Spring Boot 和隔离 PostgreSQL。
- `npm run typecheck`，独立审查：PASS。`reviewer/typecheck.log`；四包通过。
- 范围内 `npx prettier --check`、`git diff --check`：PASS。`reviewer/format.log` 及独立报告。
- 审查前后 `shasum -a256 -c .cache/local-battle-validation/review/manifest.sha256`：PASS。审查者起止、实施者接收时均 26/26 一致。

完整测试的前几次运行发生等待超时，日志 `full-test.log`、`full-test-final.log`、`full-test-bounded.log` 保留。首次执行还发现新增测试的查询名称不准确，修正查询后新增用例通过。既有认证、社区测试单独运行结果为 18 PASS / 2 FAIL；将 `@/App` 映射到 HEAD 原文件的对照运行中，社区同样两个用例等待“已保存”失败，DOM 仍为“保存中…”，见 `retest-existing.log`、`baseline-community.log`。后续独立审查完整套件全部通过。未删除测试、放宽断言或增加等待时限。

首次单独 typecheck 发现新增测试传入不支持的 `exact` 查询参数；移除该参数后，构建和独立 typecheck 均通过。首次小程序构建缺少必须的 `MINI_API_BASE_URL`，dist 校验失败；提供上述本地地址后的完整命令通过。这些首次失败日志均保留。

## 浏览器实际验证

在 Chrome 的独立来源 `http://127.0.0.1:4183/` 运行 Web production preview，使用页面操作和 DOM 检查；没有注入存储或替代引擎，没有操作用户已有的 8088 页面数据。

1. 创建空“新建阵容”，主队不合格时快捷按钮禁用，显示 5–15 人原因。
2. 选择合格主队并将空阵容设为客队，快捷按钮禁用，原因标记客队；没有新战报。
3. 梦幻对战页面的空主队同样禁用。
4. 选择 Classic Five 与 My Dream Team，真实模拟产生 149–150 的战报。刷新后保留一份历史，双方各五名球员、各 240 分钟。
5. 改选空客队，切换英文，按钮禁用并展示 `Away` 和 5–15 players 原因；历史仍为一份。
6. 浏览器 console 无 error/warn。验证结束关闭测试标签页并停止 preview。

## 验证边界

没有执行后端 Maven 全部测试、微信开发者工具或真机验收、云端部署。后端源码无修改；本轮前端套件通过真实项目 API 覆盖相关调用。历史平台验收事项继续保留。

本地 8088 Web 更新与健康检查结果记录在当前计划。
