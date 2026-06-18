# admin-records — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/6.admin-records/

## 任务列表

### 功能 1: 后台登录

- [x] T-001: 复用模板既有 `/login` + better-auth 邮箱密码登录与注册（单用户首次注册即初始账号），无需重复造登录页 ~30min
- [x] T-002: `/admin` 路由守卫（`apps/web/src/routes/admin/route.tsx`，beforeLoad 校验会话，未登录 redirect `/login`）~15min

### 功能 2: 记录管理（API）

- [x] T-003: `admin.records.list` 多维筛选（date/category/tagId/isTodo/status）+ ilike 关键词搜索 + 分页 + total（`packages/api/src/routers/admin.ts`）~30min
- [x] T-004: `admin.records.update`（分类/状态/标签，标签走 `setTags`）/ `admin.records.remove`（级联删 record_tags）~30min

### 功能 3: 后台记录管理页（前端）

- [x] T-005: `/admin/records` 筛选/搜索区 + 记录列表 + 行内编辑（分类/状态 select）/删除 + 分页 ~30min

### 集成与测试

- [ ] T-006: 集成验收：登录后台 → 查看全部记录 → 按分类/日期/状态筛选 → 编辑分类/标签/状态；未登录访问被拦截（覆盖 AC-001~AC-004）~30min `[BLOCKED: 需 DB 运行时]`

## 依赖关系

- T-002 依赖 T-001
- T-004 依赖 T-003
- T-005 依赖 T-003/T-004
- T-006 依赖 T-002/T-005
- 跨 feature：T-001/T-002 依赖 1.data-foundation（better-auth 会话）；数据来源依赖 3.quick-capture

## 风险点

- 单用户初始账号如何创建（注册入口 vs 种子脚本）→ MVP 用种子脚本/一次性注册，避免开放注册。
- 删除级联（record_tags、关联待办）→ 确认外键级联或事务删除。
