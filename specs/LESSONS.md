# LESSONS — 架构决策与踩坑记录

> 由 /jy:ai 在开发中累积，后续 feature 开发必须先读这里。

## 既有架构（better-t-stack 模板，开发前必看）

- **tRPC 基础已存在**，不要重建：
  - `packages/api/src/index.ts`：`router` / `publicProcedure` / `protectedProcedure`（无 session 抛 UNAUTHORIZED）。
  - `packages/api/src/context.ts`：已注入 better-auth `session`（`auth.api.getSession`）。
  - `packages/api/src/routers/index.ts`：`appRouter`，新子 router 挂这里并导出 `AppRouter`。
  - 新增子 router 仿 `routers/todo.ts` 写法，放 `packages/api/src/routers/{name}.ts`。
- **server 已挂载**：`apps/server/src/index.ts` 用 `@hono/trpc-server` 挂 appRouter、better-auth handler（`/api/auth/*`）、CORS、context。端口 3000。
- **DB 访问**：`import { db } from "@personal-lift/db"`；schema 子路径 `@personal-lift/db/schema/{file}`（exports `./*` → `./src/*.ts`）。
- **better-auth schema 已建**：`packages/db/src/schema/auth.ts`（user.id 为 **text** 非 uuid → 外键 userId 用 `text`）。
- **示例脚手架**：`schema/todo.ts` + `routers/todo.ts` 是模板示例，与本项目 records 概念无关，暂留不动（无害）。

## 数据模型（1.data-foundation 已落地）

- `record`：核心表，待办 = `is_todo=true` 的记录。枚举 `category`/`record_status`/`todo_status`，`ai_result` jsonb（`AiResult` 类型，宽松存储）。id 为 uuid。
- `tag` + `record_tag`：多对多，复合主键，级联删除。
- `summary`：`(user_id, type, period_key)` 唯一；content jsonb。
- migration：`packages/db/src/migrations/0000_green_miracleman.sql`（已生成，未 apply）。
- 代码风格坑：biome 要求 **tab 缩进 + interface 而非 type + interface 成员按字母序排序**；写完务必 `pnpm dlx ultracite fix` 再手修 unsafe 项。

## AI 识别（2.ai-recognition 已落地，**第一版规则 mock**）

- 出口：`import { recognize, recognitionResultSchema, extractTags, type RecognitionResult } from "@personal-lift/api/recognition"`（`packages/api/src/recognition.ts`）。
- `recognize(text, now) => Promise<RecognitionResult>`：**纯规则实现，不调任何模型、不需要 API key**。分类按 PRD 第 9 节关键词，is_todo 关键词命中，时间解析（今天/明天/后天/本周/周末/下周 + `M月D号` / `YYYY-MM-DD`，含「前/截止」→ deadline），标签命中预设词。
- `summarize.ts` 同为规则 mock：`summarizeDaily`(关键词=高频标签 + 计数文案)、`summarizeWeekly`(计数 + 待跟进列表)。统计型字段仍由 summary router 确定性计算。
- 结果字段与 `records.aiResult`(AiResult) 完全对齐：category/tags/is_todo/planned_time/deadline/emotion/follow_up_required/summary；时间为 ISO 字符串或 null。
- **预留同接口**：后续换真实模型（DeepSeek/OpenAI 用 `openai` 包；Claude 用已装的 `@anthropic-ai/sdk`）只改 recognition.ts/summarize.ts 内部，调用方与字段不变。
- `@anthropic-ai/sdk` 仍在 `packages/api` deps（未用，留作切换备用）；env 已**移除** `ANTHROPIC_API_KEY`，server 无需任何 AI key 即可启动。

## 记录 router（3.quick-capture 已落地，4/6/7 复用）

- `packages/api/src/routers/record.ts` 的 `recordRouter` 已挂到 appRouter（key `record`），web 端 `trpc.record.*`。
- `record.create({content})`：protectedProcedure，调 `recognize` → 写 record（is_todo 时 status=pending、todoStatus=pending；plannedTime/deadline 字符串转 Date）→ `attachTags`（tags upsert by name + record_tags onConflictDoNothing）→ 返回带标签记录。
- `record.listToday`：当天（`startOfToday`）+ 当前用户，倒序，`with: { recordTags: { with: { tag: true } } }`。
- 复用约定：4.todo-center / 7.record-detail 往 `recordRouter` 加 procedure；`attachTags` 标签写入逻辑可复用（标签编辑也走它）。
- web 路由：TanStack Router 文件式，`apps/web/src/routes/h5/index.tsx` → `/h5`；`routeTree.gen.ts` 由 vite build 自动生成，勿手改。tRPC 用 `trpc.<r>.<p>.queryOptions()/mutationOptions()`（见 `routes/todos.tsx` 范式）。UI 组件 `@personal-lift/ui/components/*`。
- 注意：httpBatchLink 无 transformer，Date 经 JSON 变 **字符串**，前端按 string 处理（`new Date(...)` 渲染）。
- 坑：biome 禁止嵌套三元（noNestedTernary）→ loading/data/empty 用两个独立 `&&` + 单层三元拆开。

## 待办 router（4.todo-center 已落地，9.admin 复用）

- `packages/api/src/routers/todo-center.ts` 的 `todoCenterRouter`，挂在 appRouter key `todoCenter`（注意：示例 `todo` router 仍在，是脚手架，勿混）。
- `todoCenter.list({filter})`：filter ∈ today/tomorrow/thisWeek/overdue/noTime/all；区间匹配 plannedTime 或 deadline；overdue = deadline<now 且 todoStatus 非 done/cancelled。
- 操作 procedure：complete / cancel / updatePlannedTime / updateDeadline / convertFromRecord，均 `ownTodo` 校验归属。9.admin 的后台待办管理可包装/复用这些。
- web：`/h5/todos`（筛选 tab + 列表 + 完成/取消）；「转待办」入口加在 `/h5` 今日流的非待办记录上（convertFromRecord）。
- 日期区间工具（startOfDay/endOfDay/weekRange）在 todo-center.ts，8.weekly-summary 的周区间可参考。

## 总结 router（5.daily-summary 已落地，8/9 复用）

- `packages/api/src/routers/summary.ts` 的 `summaryRouter`，挂在 appRouter key `summary`。
- `summary.generateDaily({date?})`：统计确定性计算（`buildStats`）+ AI 概括（`summarizeDaily` opus）分离 → upsert（target `[userId,type,periodKey]`，set content/generatedAt/edited=false）。periodKey = 本地 `YYYY-MM-DD`。
- `summary.getDaily({date?})`：返回 summary 行或 null。
- content 为 jsonb（schema 未 $type，tRPC 推断为 unknown）→ 前端按已知形状 `as` 断言（见 `/h5/summary.tsx` 的 `DailyContent`）。
- `packages/api/src/summarize.ts` 已含 `summarizeWeekly(texts, pendingTexts)`（opus，产 mainContent + nextWeekFollowUps）→ **8.weekly-summary 直接用**。
- 8.weekly-summary：在本 `summaryRouter` 加 generateWeekly/getWeekly；periodKey 用 ISO 周（YYYY-Www）；周区间参考 `todo-center.ts` 的 weekRange。
- 9.admin 总结管理：复用 generateDaily/generateWeekly 做「重新生成」，加 `summary.update` 改 content（置 edited=true）。

## 后台 admin router + 标签工具（6.admin-records 已落地，9.admin-extras 复用）

- `packages/api/src/tags.ts`：`attachTags(recordId, names)`（upsert 复用）、`setTags(recordId, names)`（清空再加）。record.ts 已改用它；7.record-detail 编辑标签、9.tag 管理都用这里。
- `packages/api/src/routers/admin.ts` 的 `adminRouter`，挂在 appRouter key `admin`，**嵌套子 router**：`trpc.admin.records.list/update/remove`。9.admin-extras 往 adminRouter 加 `todos`/`tags`/`summaries` 子 router。
- `admin.records.list`：多维筛选（date/category/tagId/isTodo/status）+ ilike 关键词 + 分页，返回 `{items, total}`。tagId 用子查询 `inArray(record.id, select recordId from recordTag where tagId)`。
- 后台鉴权：复用模板既有 better-auth（email/password 已启用）+ `/login`；`/admin` 守卫在 `apps/web/src/routes/admin/route.tsx`（beforeLoad `authClient.getSession()` 未登录 redirect `/login`）。新增后台页放 `routes/admin/*.tsx` 自动受守卫。
- web 端无 Select 组件库 → 用原生 `<select aria-label=...>`（biome a11y 要求 aria-label）。

## 记录详情（7.record-detail 已落地）

- `recordRouter` 加了 `getById({id})`（归属校验，含 ai_result + 标签）和 `update`（分类/标签/待办/计划时间/deadline/状态/todoStatus；标签走 `setTags`；**手动改不重新识别**）。
- web 动态路由文件名 `records.$id.tsx` → `/h5/records/$id`，`Route.useParams()` 取 id。表单用 useState + useEffect 在 data 到达后回填。
- **biome 坑（已配置 override）**：TanStack Router 动态路由文件名带 `$` 触发 `useFilenamingConvention`，已在 `biome.json` 加 `overrides`，对 `apps/web/src/routes/**` 关闭该规则。后续动态/pathless 路由（`$`、`_`）不再报错。
- a11y：`<label>` 必须含可识别控件（noLabelWithoutControl）→ 包装型 label 改 `<div>`，控件各自加 `aria-label`。

## 周总结（8.weekly-summary 已落地，9.admin 复用）

- `summaryRouter` 加了 `generateWeekly({date?})` + `getWeekly({date?})`，挂在 `summary` key 下。
- periodKey = ISO 周键 `isoWeekKey`（YYYY-Www）；周区间 `weekBounds`（本地周一~周日）；都在 `summary.ts`。
- content：dailyTrend(7天计数)/topCategories/topTags(Top5)/mainContent/newIdeas/completed/nextWeekFollowUps。
- web `/h5/summary` 已拆 DailySection + WeeklySection + 今日/本周 toggle；`GenerateButton` 复用。
- 9.admin 总结管理「重新生成」直接调 generateDaily/generateWeekly；需要新增 `summary.update`（改 content 置 edited=true）和后台查看。

## ⚠️ 环境阻塞（2026-06-17）

- **无可用 Postgres**：无 docker、无本地 pg 二进制、无 compose；`DATABASE_URL=...@localhost:5432/postgres` 不通。→ `db:migrate` 与一切运行时验证（集成/QA task）暂时无法执行。
- **缺 `ANTHROPIC_API_KEY`**：`apps/server/.env` 未配置 → 2.ai-recognition 接 Claude 的运行时被卡。
- 影响：每个 feature 的「集成与测试」task 在 DB/API key 就绪前只能完成代码、类型检查与 lint，无法做端到端运行时验收。
