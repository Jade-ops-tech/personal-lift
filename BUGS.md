# Bug 清单

> 记录 bug,交给 Claude 扫描并自动修复。
> 用法:往下面追加 bug → 跟我说「扫一遍 BUGS.md 里 TODO 的,挨个修」。
>
> 字段说明:
> - **位置**:文件/模块/功能线索,模糊也行(如「登录那块」),越具体定位越快
> - **现象**:实际发生了什么、怎么复现
> - **期望**:正确行为应该是什么
> - **状态**:`TODO`(待修) / `FIXING`(修复中) / `DONE`(已修)

---

## BUG-001 示例:标题简述
- 位置: apps/web 用户菜单 / packages/auth
- 现象: 登录成功后头像还是默认图,刷新页面才更新
- 期望: 登录后立即显示用户头像
- 状态: TODO
- 备注:

<!-- 复制下面这段往上加新 bug:

## BUG-XXX 标题简述
- 位置:
- 现象:
- 期望:
- 状态: TODO
- 备注:

-->
## BUG-002 登陆页（包括注册页）所有内容都聚在一起了
- 位置: apps/web/src/routes/login.tsx、apps/web/src/components/sign-in-form.tsx、sign-up-form.tsx
- 现象: 面板内边距与字段间距偏紧（p-6 / space-y-4 / mb-6），整体挤在一起
- 期望: 舒展一些
- 状态: DONE
- 备注: 放大留白 —— 面板 p-6→p-8、字段间距 space-y-4→space-y-6、标题 mb-6→mb-8、页脚 mt-4→mt-6、logo 区 mb-8→mb-10

