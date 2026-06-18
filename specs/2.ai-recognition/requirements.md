# ai-recognition — 需求规格

## 概述

提供统一的内容识别接口：输入一段文字，输出结构化结果（分类、标签、是否待办、时间、情绪、概括），第一版直接接入 Claude 模型，模型失败时降级，保证记录仍可写入。

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始需求 |

## 用户故事

- 作为用户，我随手输入一句话，系统就能自动判断它属于哪类、有哪些标签、是不是待办、有没有时间，省去手动分类。

## 功能需求

1. [F-001] 统一识别接口：`recognize(text, now) -> RecognitionResult`，结果含 category/tags/is_todo/planned_time/deadline/emotion/follow_up_required/summary。
2. [F-002] 接入 Claude 完成识别，分类/标签等轻任务用 `claude-haiku-4-5`，结构化 JSON 输出（schema 约束）。
3. [F-003] 分类判断覆盖 PRD 第 9 节关键词倾向（学习/工作/生活/想法/待办）。
4. [F-004] 时间识别：今天/明天/后天/本周/周末/下周、具体日期（6月30号、2026-06-30）；模糊计划（有空/之后）标记为无精确时间。识别结果以传入的 `now` 为基准归一化为时间戳。
5. [F-005] 失败降级：Claude 调用失败/超时时，返回兜底结果（category=其他、tags=[]、is_todo=false），不阻断记录写入。

## 非功能需求

- 性能: 单次识别在合理延迟内返回；失败有超时上限并降级。
- 安全: `ANTHROPIC_API_KEY` 经 `@personal-lift/env` 读取，禁止硬编码（security.md）。
- 可替换: 识别能力封装在统一接口后，未来可替换模型或加入规则前置，不影响调用方。

## 验收标准

- [ ] [AC-001] 输入学习/工作/生活/想法类内容，分类结果大概率正确（PRD AI 验收 1-4）。
- [ ] [AC-002] 输入含时间和动作的内容（如「明天下午改按钮」），识别为待办且 planned_time 正确归一化（AI 验收 5）。
- [ ] [AC-003] 输入「6月30号前…」识别出 deadline=2026-06-30。
- [ ] [AC-004] Claude 不可用时返回兜底结果且不抛错给调用方。

## 依赖

- Claude API（`@anthropic-ai/sdk`）、`@personal-lift/env`（注入 API key）。
- `RecognitionResult` 的 zod schema 作为本 feature 对外契约，被 3/5/8 号 feature 消费。

## 开放问题

- 无（模型形态已确认为真实 Claude）。
