# daily-summary — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: API（`packages/api`）、前端（`apps/web`，`/h5/summary`）

## 功能模块设计

### 模块 1: 今日总结生成（API）

`packages/api` 新增 `summaries` 子 router：

- `summaries.generateDaily`（protectedProcedure, input `{ date? }` 默认今天）：
  1. 拉取当天记录，做确定性统计（记录数、各分类计数、待跟进列表、逾期列表、想法列表）。
  2. 把记录文本喂给 Claude（`claude-opus-4-8`，概括质量优先）产出「今日关键词」「主要内容概括」「值得推进的想法」自然语言部分。
  3. 组装结构化 content（jsonb），upsert 进 summaries（type=daily, period_key=date）。
- 统计部分与 AI 概括分离：即使 AI 失败，统计型字段仍可返回（降级，参考 2.ai-recognition 思路）。

### 模块 2: 今日总结查询（API）

- `summaries.getDaily`（input `{ date? }`）：返回已存总结；不存在则触发一次 generateDaily 或返回空态由前端决定。

### 模块 3: H5 总结页（前端）

- 路由 `/h5/summary`：今日总结视图，分区展示数量统计、分类分布、关键词、概括、待跟进/逾期/想法。
- 空态：当天无记录时展示引导文案。

## 接口契约

- `summaries.generateDaily({ date? }) -> Summary`
- `summaries.getDaily({ date? }) -> Summary | null`

content 结构（jsonb）：`{ recordCount, categoryCounts, keywords[], overview, followUps[], overdue[], ideas[] }`。

## 数据模型

复用 summaries 表（1.data-foundation）。`(user_id, type, period_key)` 唯一，重复生成 upsert。

## 安全考虑

- protectedProcedure，按会话归属统计与生成（security.md）。
- 喂给模型的是用户自己的记录文本；API key 服务端持有。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 统计 vs 概括 | 统计确定性计算 + AI 概括 | 数量类不该靠模型，保证准确；语言概括交给模型 |
| 概括模型 | claude-opus-4-8 | 概括需更强语言能力，与轻量识别(haiku)区分 |
| 存储 | upsert by period_key | 当天可多次重算，幂等更新 |
