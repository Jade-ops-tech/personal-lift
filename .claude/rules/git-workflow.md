---
description: 分支、commit、PR 与提交前检查约定
---

# Git 工作流

## 提交前（自动）

`.husky/pre-commit` 会：

1. 运行 `pnpm test`
2. 对暂存文件执行 `ultracite fix` 并重新 `git add`

未通过 Ultracite 且无法自动修复的问题会阻断提交。本地提交前可先手动跑 `pnpm fix` / `pnpm check`。

## Commit message

- 推荐 **Conventional Commits**：`feat:` / `fix:` / `chore:` / `refactor:` / `docs:` / `test:`
- monorepo 中建议带 scope 标注影响范围，如 `feat(web): ...`、`fix(db): ...`、`chore(api): ...`
- 描述聚焦「为什么」，保持简洁

## 分支

- 从最新主分支切出，命名 `feature/xxx`、`fix/xxx`、`chore/xxx`
- 一个分支聚焦一个 feature / 修复，保持可独立 review 与回滚

## PR

- 跑通 `pnpm check-types` 与 `pnpm build` 再提 PR
- 描述变更动机、影响的 workspace、验证方式
