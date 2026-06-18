---
description: 测试约定与覆盖率要求
---

# 测试

> ⚠️ 当前仓库尚未安装测试框架，但 `.husky/pre-commit` 会运行 `pnpm test`，根 `package.json` 缺 `test` script。引入测试时需补上该 script，否则 pre-commit 会失败。

## 框架选型建议

- 单元 / 组件测试：**Vitest**（与 Vite 工具链一致，`apps/web` 用 Vite）
- 组件交互：`@testing-library/react`
- E2E：Playwright

## 约定

- 断言写在 `it()` / `test()` 块内
- 异步测试用 `async/await`，禁止 done 回调
- 提交代码中禁止 `.only` / `.skip`
- describe 嵌套保持扁平，避免过度分层
- 测试文件就近放置：`*.test.ts` / `*.test.tsx` 与被测文件同目录，或集中于包内 `tests/`
- 覆盖率产物（`coverage`、`.nyc_output`）已在 `.gitignore`，不要提交

## 关注点

Biome 能覆盖格式与常见错误，测试应聚焦：业务逻辑正确性、边界条件、错误状态、tRPC procedure 的输入校验与错误码。
