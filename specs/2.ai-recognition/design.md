# ai-recognition — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: 服务端能力包（建议 `packages/api` 内 `recognition/` 模块，或新建 `@personal-lift/ai`）

## 功能模块设计

### 模块 1: 识别结果契约（RecognitionResult）

用 zod 定义对外契约（与 PRD 第 9 节 JSON 对齐）：

```ts
const RecognitionResult = z.object({
  category: z.enum(["学习", "工作", "生活", "想法", "待办", "其他"]),
  tags: z.array(z.string()),
  is_todo: z.boolean(),
  planned_time: z.string().datetime().nullable(),
  deadline: z.string().datetime().nullable(),
  emotion: z.string().nullable(),
  follow_up_required: z.boolean(),
  summary: z.string(),
});
```

该 schema 是本 feature 的稳定出口，供 3.quick-capture / 5.daily-summary / 8.weekly-summary 复用。

### 模块 2: Claude 接入

- 用 `@anthropic-ai/sdk`，模型 `claude-haiku-4-5`（分类/标签/待办/时间属轻量结构化任务，haiku 速度成本最优）。
- 用 tool use / 结构化输出约束模型按 `RecognitionResult` 返回，再用 zod 解析校验。
- API key 经 `@personal-lift/env` 注入。

**涉及层及关键设计:**

- 接口：`recognize(text: string, now: Date): Promise<RecognitionResult>`。
- prompt 内注入分类倾向规则（PRD 第 9 节关键词）与「以 now 为今天」的时间基准说明，让模型直接产出归一化后的 ISO 时间。

### 模块 3: 时间归一化

- 优先让模型基于传入 `now` 输出 ISO 时间戳；服务端对返回的 planned_time/deadline 再做一次合法性校验（非法则置 null）。
- 模糊计划（有空/之后/周末无具体日）→ planned_time/deadline 为 null，但 is_todo 仍可为 true。

### 模块 4: 失败降级

- 设置调用超时；捕获异常或 zod 解析失败时返回兜底 `{ category: "其他", tags: [], is_todo: false, planned_time: null, deadline: null, emotion: null, follow_up_required: false, summary: text.slice(0, 50) }`。
- 调用方（记录提交）据此始终能写库，识别质量降级但不丢记录。

## 接口契约

- 出口：`recognize(text, now) -> RecognitionResult`，以及 `RecognitionResult` zod schema 与类型。

## 数据模型

无独立表。识别结果由调用方写入 `records.ai_result`（jsonb）及对应结构化列。

## 安全考虑

- API key 仅服务端持有，经 env 包读取，绝不下发前端（security.md）。
- 模型输出经 zod 校验后才落库，防止结构污染。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 模型 | claude-haiku-4-5 | 识别为轻量结构化任务，haiku 延迟/成本最优；概括类重任务由 5/8 号 feature 自行选 opus |
| 结构化方式 | tool use + zod 校验 | 保证输出可解析、可降级 |
| 时间解析 | 交给模型 + 服务端校验 | PRD 非目标排除「完整自然语言时间解析」，模型够用且简单 |
| 封装位置 | 统一接口模块 | 满足 PRD「保留统一接口、底层可替换」 |
