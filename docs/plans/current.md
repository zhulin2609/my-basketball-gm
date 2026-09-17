# Current Plan

更新时间：2026-09-17

## 当前目标

在球员库中补齐 1978–2026 年全部总决赛 FMVP 球员。

状态：开发完成，全部测试通过，等待提交。

## 已确认的决策

- 排查结果：1978–2026 共 30 位 FMVP，其中 29 位已经通过 NBA 75 大、全明星、最佳阵容、最佳防守阵容等现有数据源进入目录；只有 Cedric Maxwell（1981 年 FMVP）生涯没有任何上述荣誉，从未被覆盖。
- 上游数据集没有 FMVP 表，参照生成脚本中 `nba75Names`、`allNba2026` 的既有模式，把 1978–2026 每年的 FMVP 以 `finalsMvpByYear` 显式列在生成脚本中（2026 年 FMVP 为 Jalen Brunson，纽约尼克斯 4–1 圣安东尼奥马刺）。
- 生成脚本新增 `finalsMvp` 数据源：每个名字必须在生涯数据中解析成功，49 个赛季（1978–2026，1999 年总决赛正常举办）必须完整；覆盖元数据新增 `fmvpSeasons` 与 `sourceNames.finalsMvp`。
- 目录测试新增断言：`fmvpSeasons` 覆盖 1978–2026 全部赛季；既有的「每个数据源球员恰好出现一次」测试自动覆盖 FMVP 名单。
- 再生成只新增 Cedric Maxwell 一名球员（峰值 1978–79 赛季，波士顿，SF），其余 396 名球员与上游数据保持一致，无意外漂移。
- V9 迁移是生成物，随目录一起再生成；已应用旧版 V9 的本地数据库删除 `flyway_schema_history` 中的 V9 行后，以 `SPRING_FLYWAY_OUT_OF_ORDER=true` 启动一次完成重新应用（V9 是幂等 upsert），后续启动正常校验。全新数据库按序应用全部迁移，不需要这些步骤。操作步骤记录在 `src/data/README.md`。

## 验收标准

- [x] 1978–2026 年全部 30 位 FMVP 都在球员库中，目录测试断言赛季覆盖完整。
- [x] Cedric Maxwell 出现在前端目录、数据库种子迁移与本地两个数据库中。
- [x] 再生成不引入 FMVP 之外的球员变更。
- [x] 前端测试、构建、格式检查与后端全部测试通过；后端常规启动（无环境变量）通过 Flyway 校验。

## 实施步骤

1. `scripts/generate-nba-history-catalog.mjs` 新增 `finalsMvpByYear`（1978–2026）与 `finalsMvp` 数据源、赛季完整性断言、覆盖元数据。
2. 运行生成脚本（网络受限时先下载 CSV 到 `.cache/nba-data/` 并设置 `NBA_DATA_DIR`），重新生成 `src/data/historical-players.generated.ts` 与 V9 迁移。
3. `src/data/historical-player-catalog.test.ts` 新增 `fmvpSeasons` 断言。
4. 本地开发库与测试库删除 V9 历史行，以 `SPRING_FLYWAY_OUT_OF_ORDER=true` 运行一次后端（或测试）重新应用 V9，随后常规启动验证校验通过。
5. 全部测试通过后更新 `docs/AI_HANDOFF.md`、`src/data/README.md`、本文件。

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

2026-09-17 FMVP 补齐完成后验证：

- `npm test`：9 个测试文件、35 项测试通过（目录测试断言 FMVP 1978–2026 全覆盖）。
- `npm run build`：通过；Vite 仅报告 chunk 大小警告。
- `npm run format:check`：通过。
- `mvn test`：22 项测试通过（真实 PostgreSQL；V9 重新应用后常规运行）。

## 当前 Git 状态

- 分支：`develop`，基线提交：`36ff947 feat: 模拟对战结果展示本场最佳球员`。
- FMVP 改动完成但未提交：`scripts/generate-nba-history-catalog.mjs`、`src/data/historical-players.generated.ts`、`src/data/historical-player-catalog.test.ts`、`src/data/README.md`、`backend/src/main/resources/db/migration/V9__seed_historical_player_catalog.sql`，以及三份交接文档。
