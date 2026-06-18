# ai-recognition — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/2.ai-recognition/

## 任务列表

### 功能 1: 契约与接入

- [x] T-001: 定义 `recognitionResultSchema` zod 与 `RecognitionResult` 类型（`packages/api/src/recognition.ts`，对外契约）~15min
- [x] T-002: 接入 `@anthropic-ai/sdk`，`ANTHROPIC_API_KEY` 经 env 注入，封装 Claude 客户端（claude-haiku-4-5）~30min
- [x] T-003: 识别 prompt（分类倾向 + now 时间基准）+ `messages.parse` 结构化输出（zodOutputFormat）~30min

### 功能 2: 解析与降级

- [x] T-004: 时间归一化 `normalizeTime`（基于 now 校验 ISO，非法置 null）~30min
- [x] T-005: 失败/超时降级 `fallbackResult` + 15s timeout，封装 `recognize(text, now)` 出口 ~15min

### 集成与测试

- [ ] T-006: 集成验收：用 PRD 第 5 节四个示例 + 时间/deadline 样例验证分类与时间识别，并模拟 Claude 不可用验证降级（覆盖 AC-001/AC-002/AC-003/AC-004）~30min `[BLOCKED: 缺 ANTHROPIC_API_KEY，待环境就绪]`

## 依赖关系

- T-003 依赖 T-001/T-002
- T-004、T-005 依赖 T-003
- T-006 依赖 T-005
- 无跨 feature 依赖（本 feature 为横切基础，被 3/5/8 依赖）

## 风险点

- 模型对中文模糊时间（「周末」「有空」）归一化不稳定 → 服务端校验兜底为 null，并在验收样例中覆盖。
- haiku 结构化输出偶发不符 schema → zod 解析失败即走降级，不抛给调用方。
