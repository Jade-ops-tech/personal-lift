# 开发计划索引

## 本次 PRD（2026-06-17）切分为 9 个 feature

来源：`docs/Daily-Inbox-PRD.md`（Daily Inbox 个人日常记录与待办整理工具）。
项目：personal-lift（Turborepo monorepo）。feature 数 > 8，按 epic 分组。

> 状态：✅ 代码完成（type-check + lint 全过）；运行时验收（各 feature 集成 task）因本地无 DB/无 ANTHROPIC_API_KEY 统一标 BLOCKED，待环境就绪。

### Epic A: 核心记录闭环 — `P0 最小闭环`

| 序号 | feature | 说明 | 依赖 | 状态 |
| ---- | ------- | ---- | ---- | ---- |
| 1 | data-foundation | DB schema、tRPC 基础、后台会话 —— 横切基础 | - | ✅ 代码完成 |
| 2 | ai-recognition | 统一识别接口，接入 Claude 完成分类/标签/待办/时间/概括 —— 横切基础 | - | ✅ 代码完成 |
| 3 | quick-capture | H5 快速记录 + 今日记录流 | 1,2 | ✅ 代码完成 |
| 4 | todo-center | H5 待跟进中心（筛选/状态/完成/改时间/转待办/取消） | 1,3 | ✅ 代码完成 |
| 5 | daily-summary | 今日总结生成 + H5 查看 | 1,2,3 | ✅ 代码完成 |

### Epic B: 后台管理 — `P0 最小闭环`

| 序号 | feature | 说明 | 依赖 | 状态 |
| ---- | ------- | ---- | ---- | ---- |
| 6 | admin-records | 后台登录（better-auth）+ 记录管理（筛选/搜索/编辑/删除） | 1,3 | ✅ 代码完成 |

### Epic C: 增强迭代 — `P1 后续迭代`

| 序号 | feature | 说明 | 依赖 | 状态 |
| ---- | ------- | ---- | ---- | ---- |
| 7 | record-detail | H5 记录详情 + 手动编辑字段 | 1,3 | ✅ 代码完成 |
| 8 | weekly-summary | 周总结生成 + H5/后台查看 | 1,2,5 | ✅ 代码完成 |
| 9 | admin-management-extras | 后台待办/标签/总结管理 | 1,6 | ✅ 代码完成 |

**推荐执行顺序**：1,2 →（并行基础）3 → 4,5,6,7（多数可并行）→ 8,9

> `/jy:ai` 先做 P0 两个 epic（Epic A + Epic B，序号 1-6）跑通最小闭环，再推进 P1（Epic C，序号 7-9）。
> PRD 第 13 节的 P2 项（AI Prompt 配置、情绪识别强化、复杂自然语言时间解析）本轮不切入，后续 PRD 再加。

## 关键决策（已与产品确认，2026-06-17）

- **端架构**：H5 与后台同在 `apps/web`，用 `/h5/*` 与 `/admin/*` 路由分区，共用一套 tRPC client。
- **AI 识别**：直接接真实 Claude 模型，统一接口封装；分类/标签等轻任务用 `claude-haiku-4-5`，今日/周总结概括用 `claude-opus-4-8`；模型失败时降级，保证记录仍可提交。
- **后台登录**：复用项目已集成的 better-auth，邮箱+密码，单用户。

## ID 编号约定

- 功能需求 / 任务 / 验收标准 ID **在单个 feature 内编号**，跨 feature 用 `{序号}.` 前缀区分。
- 例：`1.T-001` = 序号 1 这个 feature 的 T-001；`3.F-005` = 序号 3 的 F-005。
- **跨 feature 依赖**写全限定 ID，如 `3.T-001 依赖 1.T-004`。

## 数据模型总览（由 1.data-foundation 落地，其余 feature 复用）

- `records`：核心记录表（content、category 枚举、emotion、is_todo、follow_up_required、ai_result jsonb、status、todo_status、planned_time、deadline、user_id、时间戳）。待办是 `is_todo=true` 的记录。
- `tags` + `record_tags`：标签与多对多关联（标签可新增/合并/删除）。
- `summaries`：每日/每周总结（type、period_key、content jsonb、generated_at、edited）。
- 分类（category）第一版为固定枚举：学习/工作/生活/想法/待办/其他。
- 认证表复用 better-auth 既有 schema（`packages/db/src/schema/auth.ts`）。
