# daily-summary — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/5.daily-summary/

## 任务列表

### 功能 1: 今日总结生成与查询（API）

- [x] T-001: 当天记录确定性统计 `buildStats`（记录数/分类计数/待跟进/逾期/想法）~30min
- [x] T-002: AI 概括 `summarizeDaily`（`packages/api/src/summarize.ts`，claude-opus-4-8 产出关键词/概括），失败降级保留统计；`summary.generateDaily` upsert（onConflictDoUpdate）~30min
- [x] T-003: `summary.getDaily` 查询 procedure（含空态返回 null）~15min

### 功能 2: H5 总结页（前端）

- [x] T-004: `/h5/summary` 今日总结展示（统计/分类/关键词/概括/待跟进/逾期/想法 + 空态 + 生成/重新生成）~30min

### 集成与测试

- [ ] T-005: 集成验收：造当天多条记录生成今日总结，校验覆盖主要记录与待跟进；无记录空态（覆盖 AC-001/AC-002/AC-003）~30min `[BLOCKED: 需 DB + ANTHROPIC_API_KEY 运行时]`

## 依赖关系

- T-002 依赖 T-001
- T-003 依赖 T-002
- T-004 依赖 T-003
- T-005 依赖 T-004
- 跨 feature：T-001 依赖 1.data-foundation 与 3.quick-capture（记录数据）；T-002 复用 2.ai-recognition 的 Claude 接入

## 风险点

- 记录较多时概括 token 成本/延迟 → 可截断或先做抽样，验收关注覆盖度而非全文。
- AI 概括失败 → 统计字段仍展示，概括区给降级文案。
