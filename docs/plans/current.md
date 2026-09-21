# Current Plan

更新时间：2026-09-21

## 当前状态

没有进行中的任务。上一个开发 Session 已完成并收尾：社区功能（公开阵容、评论、复制）、内容治理（敏感词审核、限频、管理员删除）、hash 路由、LLM 请求参数按服务商适配、梦幻对战上场时间约束（球队总分钟 240 + 25 × 加时，单人上限 48 + 5 × 加时，双引擎同步）、社区总开关（`FORUM_ENABLED`）、阵容成员展示顺序统一。

全部改动已提交，`main` 与 `develop` 及各自远端分支指向同一提交，工作区干净。

## 下一步候选方向

- 腾讯云部署：按 `README.md` 与 `docs/AI_HANDOFF.md` 的运行条件准备服务器，配置 `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` / `FORUM_ADMIN_USERNAMES` 等环境变量；域名走大陆 ICP 备案，个人主体备案期间社区功能可用 `FORUM_ENABLED=false` 关停兜底。
- 引擎 V2：加时战报（`distributeTeamMinutes(rawMinutes, overtimePeriods)` 的加时参数已预留）、逐回合播放等。

## 测试方法

```bash
npm test
npm run build
npm run format:check
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=/usr/local/opt/maven/bin:$JAVA_HOME/bin:$PATH
cd backend && mvn test
```

## 当前 Git 状态

- 分支：`main`（本地停留分支；后续开发先切回 `develop`）。
- `main`、`develop` 与各自远端分支保持同步，指向同一提交；工作区干净，无未提交改动。
- 最近的功能提交：`e9531f1 feat: 阵容编辑表与社区帖子成员表统一首发在前的展示顺序`。
