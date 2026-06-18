# weekly-summary — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: API（`packages/api`）、前端（`apps/web`，`/h5/summary`）

## 功能模块设计

### 模块 1: 周总结生成（API）

复用 5.daily-summary 的 `summaries` 子 router，新增：

- `summaries.generateWeekly`（input `{ weekKey? }` 默认本周 ISO 周）：
  1. 拉取本周记录，确定性统计：每日记录数趋势、高频分类 Top、高频标签 Top、本周完成事项（todo_status=done）、本周新增想法（category=想法）。
  2. Claude（`claude-opus-4-8`）概括「主要工作/学习/生活内容」「下周建议跟进事项」（结合未完成/逾期待办）。
  3. upsert summaries（type=weekly, period_key=weekKey）。
  - AI 失败降级，保留统计字段。

### 模块 2: 周总结查询（API）

- `summaries.getWeekly`（`{ weekKey? }`）：返回已存周总结或空。

### 模块 3: H5 总结页 - 周视图（前端）

- 在 `/h5/summary` 增加「今日 / 本周」切换；周视图展示趋势、高频分类/标签、主要内容、新增想法、完成事项、下周建议。
- 空态处理。

> 后台总结查看与重新生成在 9.admin-management-extras 实现，本 feature 仅做生成能力 + H5 展示。

## 接口契约

- `summaries.generateWeekly({ weekKey? }) -> Summary`
- `summaries.getWeekly({ weekKey? }) -> Summary | null`

content 结构：`{ dailyTrend[], topCategories[], topTags[], mainContent, newIdeas[], completed[], nextWeekFollowUps[] }`。

## 数据模型

复用 summaries（type=weekly）。period_key 用 ISO 周字符串（如 2026-W25），`(user_id, type, period_key)` 唯一。

## 安全考虑

- protectedProcedure，按会话归属（security.md）。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 周键格式 | ISO 周（YYYY-Www） | 稳定、可排序、避免跨月歧义 |
| 复用 daily 框架 | 是 | 统计/概括/降级结构一致，减少重复 |
| 趋势粒度 | 按天计数 | 满足「本周记录趋势」且实现简单 |
