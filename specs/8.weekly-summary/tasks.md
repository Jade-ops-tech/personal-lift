# weekly-summary — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/8.weekly-summary/

## 任务列表

### 功能 1: 周总结生成与查询（API）

- [x] T-001: 本周确定性统计 `buildWeeklyStats`（每日趋势/高频分类/高频标签 Top5/完成事项/新增想法）+ ISO 周键/周区间工具 ~30min
- [x] T-002: AI 概括 `summarizeWeekly`（主要内容 + 下周建议跟进，opus）+ `summary.generateWeekly` upsert，失败降级 ~30min
- [x] T-003: `summary.getWeekly` 查询 procedure（按 ISO 周键，含空态）~15min

### 功能 2: H5 周视图（前端）

- [x] T-004: `/h5/summary` 今日/本周切换（DailySection/WeeklySection）+ 周总结展示（趋势/高频分类标签/完成/新增想法/下周建议）~30min

### 集成与测试

- [ ] T-005: 集成验收：造一周记录生成周总结，校验高频分类/标签、完成事项、下周建议；无记录空态（覆盖 AC-001/AC-002/AC-003）~30min `[BLOCKED: 需 DB + ANTHROPIC_API_KEY 运行时]`

## 依赖关系

- T-002 依赖 T-001
- T-003 依赖 T-002
- T-004 依赖 T-003
- T-005 依赖 T-004
- 跨 feature：依赖 1.data-foundation、2.ai-recognition；复用 5.daily-summary 的 summaries router 与生成框架

## 风险点

- ISO 周边界（跨年第 1 周/第 53 周）→ 用成熟日期库计算 weekKey，验收覆盖年初样例。
- 一周记录量大导致概括 token 成本高 → 先喂统计摘要而非全文，控制成本。
