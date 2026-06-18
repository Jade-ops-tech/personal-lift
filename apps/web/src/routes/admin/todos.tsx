import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { dueCountdown, isOverdue } from "@/lib/neural";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 后台待办管理 —— 赛博视觉还原 + 真实 tRPC 数据（admin.todos）。
export const Route = createFileRoute("/admin/todos")({
	component: AdminTodosScreen,
});

const SIDE_NAV = [
	{ icon: "grid_view", label: "记录管理", to: "/admin/records", active: false },
	{ icon: "checklist", label: "待办管理", to: "/admin/todos", active: true },
	{ icon: "sell", label: "标签管理", to: "/admin/tags", active: false },
	{
		icon: "summarize",
		label: "总结管理",
		to: "/admin/summaries",
		active: false,
	},
] as const;

interface Priority {
	badge: string;
	badgeClass: string;
	dotClass: string;
}

function priorityOf(
	deadline: Date | string | null,
	status: string | null
): Priority {
	if (status === "done") {
		return {
			badge: "已完成",
			badgeClass:
				"text-secondary-fixed bg-secondary-container/10 border border-secondary-container/20",
			dotClass: "bg-secondary-fixed",
		};
	}
	if (status === "cancelled") {
		return {
			badge: "已取消",
			badgeClass:
				"text-on-surface-variant bg-surface-variant/20 border border-outline-variant/20",
			dotClass: "bg-on-surface-variant",
		};
	}
	if (isOverdue(deadline, status)) {
		return {
			badge: "紧急",
			badgeClass: "text-error bg-error/10 border border-error/20",
			dotClass: "bg-error animate-pulse",
		};
	}
	if (deadline) {
		return {
			badge: "高",
			badgeClass:
				"text-tertiary-fixed bg-tertiary-fixed/10 border border-tertiary-fixed/20",
			dotClass: "bg-tertiary-fixed",
		};
	}
	return {
		badge: "稳定",
		badgeClass:
			"text-primary-fixed bg-primary-fixed/10 border border-primary-fixed/20",
		dotClass: "bg-primary-fixed",
	};
}

const LOGS = [
	{
		time: "14:22:01",
		tag: "[信息]",
		tagClass: "text-primary-fixed",
		msg: "入站握手：NODE_7",
	},
	{
		time: "14:21:55",
		tag: "[警告]",
		tagClass: "text-error",
		msg: "在 GATE_4 检测到延迟响应",
	},
	{
		time: "14:21:42",
		tag: "[信息]",
		tagClass: "text-primary-fixed",
		msg: "情报库重索引完成",
	},
];

function AdminTodosScreen() {
	const todos = useQuery(trpc.admin.todos.list.queryOptions());
	const update = useMutation(
		trpc.admin.todos.update.mutationOptions({
			onSuccess: () => todos.refetch(),
		})
	);

	const items = todos.data ?? [];
	const pendingCount = items.filter(
		(t) => t.todoStatus === "pending" || t.todoStatus === "in_progress"
	).length;
	const overdueCount = items.filter((t) =>
		isOverdue(t.deadline, t.todoStatus)
	).length;
	const doneCount = items.filter((t) => t.todoStatus === "done").length;
	const efficiency = items.length
		? Math.round((doneCount / items.length) * 100)
		: 0;

	return (
		<div className="overflow-hidden font-body-md text-body-md text-on-surface">
			{/* 顶栏 */}
			<header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-outline-variant/10 border-b bg-surface/10 px-margin-desktop shadow-[0_0_15px_rgba(0,242,255,0.1)] backdrop-blur-xl">
				<div className="flex items-center gap-8">
					<span className="font-bold font-headline-md text-headline-md text-primary-fixed tracking-tighter drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">
						NEURAL_OS
					</span>
					<div className="hidden items-center gap-6 md:flex">
						<span className="cursor-pointer font-bold font-label-mono text-label-mono text-primary-fixed">
							核心进程
						</span>
						<Link
							className="cursor-pointer rounded-[2px] px-3 py-1 font-label-mono text-label-mono text-on-surface-variant transition-colors hover:bg-[#e1fdff]/10"
							to="/admin/records"
						>
							记录管理
						</Link>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<span className="material-symbols-outlined cursor-pointer text-on-surface-variant transition-colors hover:text-primary-fixed">
						notifications
					</span>
				</div>
			</header>

			{/* 侧边导航 */}
			<nav className="fixed top-0 left-0 z-40 hidden h-full w-64 flex-col border-outline-variant/10 border-r bg-surface-container-lowest/80 pt-20 pb-8 shadow-[5px_0_15px_rgba(0,242,255,0.05)] backdrop-blur-xl md:flex">
				<div className="mb-8 px-6">
					<div className="mb-1 flex items-center gap-3">
						<div className="h-2 w-2 animate-pulse rounded-full bg-primary-fixed" />
						<span className="font-headline-md text-headline-md text-primary-fixed uppercase tracking-widest">
							智能中枢
						</span>
					</div>
					<span className="font-label-mono text-label-mono text-on-surface-variant opacity-60">
						v4.0 运行中
					</span>
				</div>
				<div className="flex flex-1 flex-col">
					{SIDE_NAV.map((item) => (
						<Link
							className={
								item.active
									? "flex items-center gap-3 border-primary-fixed border-l-2 bg-primary-container/10 px-6 py-3 text-primary-fixed transition-all duration-300"
									: "flex items-center gap-3 px-6 py-3 text-on-surface-variant opacity-60 transition-all duration-300 hover:bg-[#e1fdff]/5 hover:opacity-100"
							}
							key={item.label}
							to={item.to}
						>
							<span className="material-symbols-outlined">{item.icon}</span>
							<span className="font-label-mono text-label-mono">
								{item.label}
							</span>
						</Link>
					))}
				</div>
			</nav>

			{/* 主内容 */}
			<main className="flex h-screen flex-row overflow-hidden pt-16 md:ml-64">
				{/* 仪表板画布 */}
				<div className="custom-scrollbar relative flex-1 overflow-y-auto p-8">
					{/* 统计卡 */}
					<div className="relative z-10 mb-10 grid grid-cols-1 gap-gutter md:grid-cols-3">
						<div className="glass-panel group p-6 transition-all duration-500 hover:border-primary-fixed/40">
							<div className="mb-4 flex items-start justify-between">
								<span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-widest">
									待处理总数
								</span>
								<span className="material-symbols-outlined text-primary-fixed/50 transition-colors group-hover:text-primary-fixed">
									pending_actions
								</span>
							</div>
							<div className="flex items-baseline gap-2">
								<h2 className="font-headline-xl text-headline-xl text-primary-fixed">
									{pendingCount}
								</h2>
								<span className="font-label-mono text-on-surface-variant text-xs">
									共 {items.length} 条
								</span>
							</div>
							<div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
								<div
									className="h-full bg-primary-fixed shadow-[0_0_10px_rgba(0,219,231,0.5)]"
									style={{
										width: `${items.length ? (pendingCount / items.length) * 100 : 0}%`,
									}}
								/>
							</div>
						</div>
						<div className="glass-panel group border-l-4 border-l-error p-6 transition-all duration-500 hover:bg-error/5">
							<div className="mb-4 flex items-start justify-between">
								<span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-widest">
									逾期矩阵
								</span>
								<span className="material-symbols-outlined animate-pulse text-error/50 group-hover:text-error">
									warning
								</span>
							</div>
							<div className="flex items-baseline gap-2">
								<h2 className="font-headline-xl text-error text-headline-xl">
									{String(overdueCount).padStart(2, "0")}
								</h2>
								<span className="font-label-mono text-error/70 text-xs">
									关键优先级
								</span>
							</div>
							<div className="mt-4 flex gap-1">
								<div className="h-1 flex-1 bg-error" />
								<div className="h-1 flex-1 bg-error" />
								<div className="h-1 flex-1 bg-error/30" />
								<div className="h-1 flex-1 bg-error/30" />
							</div>
						</div>
						<div className="glass-panel group p-6 transition-all duration-500 hover:border-secondary-fixed-dim/40">
							<div className="mb-4 flex items-start justify-between">
								<span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-widest">
									执行效率
								</span>
								<span className="material-symbols-outlined text-secondary-fixed-dim/50 group-hover:text-secondary-fixed-dim">
									bolt
								</span>
							</div>
							<div className="flex items-baseline gap-2">
								<h2 className="font-headline-xl text-headline-xl text-secondary-fixed-dim">
									{efficiency}
									<span className="text-headline-md">%</span>
								</h2>
								<span className="font-label-mono text-secondary-fixed-dim/70 text-xs">
									已完成 {doneCount}
								</span>
							</div>
							<div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
								<div
									className="h-full bg-secondary-fixed-dim"
									style={{ width: `${efficiency}%` }}
								/>
							</div>
						</div>
					</div>

					{/* 任务矩阵表 */}
					<div className="relative z-10">
						<div className="mb-6 flex items-center justify-between">
							<h3 className="flex items-center gap-3 font-headline-md text-headline-md">
								<span className="h-6 w-1 bg-primary-fixed" />
								活跃任务
							</h3>
							<button
								className="flex items-center gap-1 border border-outline-variant/20 bg-surface-container px-4 py-2 font-label-mono text-label-mono text-xs hover:bg-surface-container-high disabled:opacity-50"
								disabled={todos.isFetching}
								onClick={() => todos.refetch()}
								type="button"
							>
								<span
									className={`material-symbols-outlined text-sm ${todos.isFetching ? "animate-spin-slow" : ""}`}
								>
									sync
								</span>
								刷新
							</button>
						</div>
						<div className="glass-panel border-t-0">
							<div className="grid grid-cols-12 border-outline-variant/10 border-b px-6 py-4 font-label-mono text-label-mono text-on-surface-variant opacity-40">
								<div className="col-span-1">ID</div>
								<div className="col-span-5">任务定义</div>
								<div className="col-span-2">优先级</div>
								<div className="col-span-2">到期周期</div>
								<div className="col-span-2 text-right">操作</div>
							</div>

							{todos.isLoading ? (
								<div className="flex justify-center p-10">
									<span className="material-symbols-outlined animate-spin text-primary-fixed">
										progress_activity
									</span>
								</div>
							) : null}

							{!todos.isLoading && items.length === 0 ? (
								<div className="p-10 text-center font-label-mono text-label-mono text-on-surface-variant">
									没有待办任务
								</div>
							) : null}

							{items.map((task) => {
								const pr = priorityOf(task.deadline, task.todoStatus);
								const closed =
									task.todoStatus === "done" || task.todoStatus === "cancelled";
								return (
									<div
										className={`group grid grid-cols-12 items-center border-outline-variant/5 border-b px-6 py-5 transition-colors hover:bg-[#e1fdff]/5 ${closed ? "opacity-40" : ""}`}
										key={task.id}
									>
										<div className="col-span-1 font-label-mono text-label-mono text-on-surface-variant">
											#{task.id.slice(0, 4)}
										</div>
										<div className="col-span-5 flex flex-col">
											<span
												className={`line-clamp-1 font-headline-md text-body-lg ${closed ? "line-through" : "text-on-surface transition-colors group-hover:text-primary-fixed"}`}
											>
												{task.content}
											</span>
											<span className="text-on-surface-variant text-xs opacity-60">
												{task.category}
											</span>
										</div>
										<div className="col-span-2">
											<span
												className={`inline-flex items-center gap-2 px-2 py-1 font-label-mono text-xs ${pr.badgeClass}`}
											>
												<span
													className={`h-1.5 w-1.5 rounded-full ${pr.dotClass}`}
												/>
												{pr.badge}
											</span>
										</div>
										<div className="col-span-2 font-label-mono text-on-surface-variant text-xs">
											{dueCountdown(task.deadline)}
										</div>
										<div className="col-span-2 flex items-center justify-end gap-3">
											{closed ? (
												<span className="material-symbols-outlined text-on-surface-variant">
													history
												</span>
											) : (
												<button
													aria-label="标记完成"
													className="material-symbols-outlined text-primary-fixed opacity-0 transition-opacity disabled:opacity-50 group-hover:opacity-100"
													disabled={update.isPending}
													onClick={() =>
														update.mutate({ id: task.id, todoStatus: "done" })
													}
													type="button"
												>
													task_alt
												</button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* 每日情报侧栏（系统视觉） */}
				<aside className="custom-scrollbar glass-panel hidden w-96 flex-col gap-8 overflow-y-auto border-outline-variant/10 border-l p-6 lg:flex">
					<div className="flex flex-col gap-2">
						<span className="font-bold font-label-mono text-label-mono text-primary-fixed tracking-tighter">
							每日情报
						</span>
						<div className="h-px w-12 bg-primary-fixed" />
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">
								完成进度
							</span>
							<span className="font-label-mono text-primary-fixed text-xs">
								{efficiency}%
							</span>
						</div>
						<div className="relative flex h-32 w-full items-end gap-1 overflow-hidden rounded-[4px] bg-surface-container-low px-2 py-2">
							<div
								className="flex-1 bg-primary-fixed/60 shadow-[0_0_10px_rgba(0,219,231,0.5)]"
								style={{ height: `${Math.max(8, efficiency)}%` }}
							/>
							<div
								className="flex-1 bg-error/40"
								style={{
									height: `${Math.max(8, items.length ? (overdueCount / items.length) * 100 : 0)}%`,
								}}
							/>
							<div
								className="flex-1 bg-primary-fixed/20"
								style={{
									height: `${Math.max(8, items.length ? (pendingCount / items.length) * 100 : 0)}%`,
								}}
							/>
						</div>
						<div className="flex justify-between font-label-mono text-[10px] text-on-surface-variant opacity-60">
							<span>完成</span>
							<span>逾期</span>
							<span>待处理</span>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<span className="border-outline-variant/10 border-b pb-2 font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">
							实时遥测
						</span>
						<div className="flex flex-col gap-3">
							{LOGS.map((log) => (
								<div
									className="group flex gap-3 font-label-mono text-xs"
									key={`${log.time}-${log.msg}`}
								>
									<span className="text-on-surface-variant opacity-40">
										{log.time}
									</span>
									<span className={log.tagClass}>{log.tag}</span>
									<span className="text-on-surface transition-transform group-hover:translate-x-1">
										{log.msg}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className="mt-auto rounded-[4px] border border-outline-variant/20 bg-surface-container p-4">
						<div className="mb-4 flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-fixed/30 bg-primary-container/10">
								<span className="material-symbols-outlined text-primary-fixed">
									psychology
								</span>
							</div>
							<div className="flex flex-col">
								<span className="font-label-mono text-primary-fixed text-xs">
									AI 监视器
								</span>
								<span className="font-bold text-sm">预测性维护</span>
							</div>
						</div>
						<p className="font-label-mono text-on-surface-variant text-xs leading-relaxed">
							当前有 {overdueCount} 条逾期任务，建议优先处理以恢复执行效率。
						</p>
					</div>
				</aside>
			</main>
		</div>
	);
}
