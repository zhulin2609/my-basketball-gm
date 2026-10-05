---
name: handoff
description: Prepare the current repository and task state for another coding agent to safely continue the work. Use when explicitly asked for a handoff, switching Codex/Kimi/ZCode, ending an unfinished coding session, requesting fresh context, or transferring blocked work.
---

# Agent Handoff

Prepare a verifiable, self-contained repository and task state that a fresh
coding agent can use without access to the current conversation.

Follow the repository-wide rules in `AGENTS.md`.
Do not duplicate or override those rules here.

默认只读检查 Git。commit、push、create branch、merge、stash、reset、checkout、创建 worktree、删除文件及修改 Git history 均不自动执行；用户明确授权的操作仍须遵守 `AGENTS.md`。

## 1. Inspect repository state

执行 `AGENTS.md` 的 Git verification，检查 branch、HEAD、status、staged/unstaged diff、untracked files；需要时查看 recent commits。确定 CLEAN / DIRTY，确认未提交文件的归属与保留原因。来源不明时保留现状并记录待核验事项。

## 2. Inspect current task

读取 `docs/plans/current.md`、相关代码、相关 ARCHITECTURE 章节与 DECISIONS 条目。确认目标、验收、Owner、进度、blocker 和下一步能从仓库理解；不读取无关文档。

## 3. Validate current work

按 `AGENTS.md` 的 Validation Rules 运行当前改动最有意义的验证。记录实际 command、PASS / FAIL / NOT RUN、范围及必要的失败原因；历史结果与本次执行分开记录。

## 4. Update docs/plans/current.md

在 preparing handoff checkpoint 同步完成 milestone、剩余工作、问题、blocker 和验证结果。按仓库规则设置状态及 Owner，保持任务说明 session-independent。

## 5. Update durable documentation if necessary

按仓库规则核对本任务是否改变当前架构或产生已接受的长期决策。需要时更新对应文档；没有 durable change 时保持原文。

## 6. Write docs/AI_HANDOFF.md

刷新当前交接内容，引用 current plan 的完整状态。路径以仓库根目录为基准，使用以下字段：

```md
# AI Handoff

## Metadata

- From: codex | kimi | zcode
- To: any
- Task: 当前任务标识
- Status: current plan 的当前状态
- Branch: 核实后的 branch
- Base Commit: 当前任务起始基线
- HEAD: 核实后的完整提交 SHA
- Worktree: CLEAN | DIRTY

## Objective

用一到两句话说明任务目标。

## Where We Are

引用 current plan 的具体章节与 checkpoint。

## Changes Since Last Handoff

说明关键语义变化并引用文件路径。

## Validation

列出实际 command、PASS / FAIL / NOT RUN、范围及必要的失败原因。

## Uncommitted Work

逐项说明文件、归属与保留原因；没有时写 none。

## Next Action

给出一个具体文件、命令或未完成验收项作为第一步。

## Read Next

列出下一 Agent 最应优先读取的文件。

## Risks / Unknowns

列出尚未验证的风险、假设和未知条件。

## Handoff Confidence

HIGH | MEDIUM | LOW，并说明证据覆盖范围和缺口。
```

仅在下一 Agent 很可能重复失败方案时增加 Failed Approaches；没有此类信息时省略。

## 7. Final consistency check

重新核对实际 Git 状态和引用，确认 Task、Status、Owner、基线与 Next Action 一致；所有未提交和未跟踪内容有解释；每个 PASS 有真实执行依据。确认 fresh agent 仅依赖仓库、规则、plan、handoff 及其引用就能继续。

Confidence 按证据覆盖选择：HIGH 表示必要事实与验证齐全；MEDIUM 表示仓库事实已核验但存在明确验证缺口；LOW 表示关键事实或归属未确认。按 `AGENTS.md` 检查隐私，避免复制原始敏感值。

## 8. Final response

简短说明 handoff prepared、当前状态、实际验证、具体下一步及必要的验证缺口。完成交接后停止写入。
