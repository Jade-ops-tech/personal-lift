import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { H5AppShell } from "@/components/h5-app-shell";
import { categoryStyle, dueCountdown, formatHM, isOverdue } from "@/lib/neural";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 待跟进中心 —— 赛博视觉还原 + 真实 tRPC 数据（todoCenter）。
export const Route = createFileRoute("/h5/todos")({
	component: FollowUpScreen,
});

const FILTERS = [
	{ value: "all", label: "[ 全部节点 ]" },
	{ value: "overdue", label: "逾期" },
	{ value: "today", label: "今日" },
	{ value: "tomorrow", label: "明日" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const LOAD_BARS = [42, 58, 85, 45, 70, 95, 30, 65, 55, 80, 40, 25];
const BAR_OPACITY = [
	"bg-[#e1fdff]/20",
	"bg-[#e1fdff]/20",
	"bg-[#e1fdff]/40",
	"bg-[#e1fdff]/20",
	"bg-[#e1fdff]/30",
	"bg-[#e1fdff]/60",
	"bg-[#e1fdff]/20",
	"bg-[#e1fdff]/40",
	"bg-[#e1fdff]/20",
	"bg-[#e1fdff]/30",
	"bg-[#e1fdff]/20",
	"bg-[#e1fdff]/10",
];

function FollowUpScreen() {
	const [filter, setFilter] = useState<Filter>("all");

	const allTodos = useQuery(
		trpc.todoCenter.list.queryOptions({ filter: "all" })
	);
	const listQuery = useQuery(trpc.todoCenter.list.queryOptions({ filter }));

	const completeMutation = useMutation(
		trpc.todoCenter.complete.mutationOptions({
			onSuccess: () => {
				allTodos.refetch();
				listQuery.refetch();
			},
		})
	);

	const all = allTodos.data ?? [];
	const overdueCount = all.filter((t) =>
		isOverdue(t.deadline, t.todoStatus)
	).length;
	const todayCount = all.filter((t) => {
		if (!t.deadline) {
			return false;
		}
		const d = new Date(t.deadline);
		const now = new Date();
		return d.toDateString() === now.toDateString();
	}).length;
	const upcomingCount = all.filter(
		(t) => t.todoStatus === "pending" || t.todoStatus === "in_progress"
	).length;

	const list = listQuery.data ?? [];
	const [highlight, ...rest] = list;

	return (
		<H5AppShell>
			<div className="mx-auto max-w-[1440px]">
				{/* 头部与统计 */}
				<div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="rounded-[2px] bg-primary-container/10 px-2 py-0.5 font-label-mono text-[10px] text-primary-fixed">
								关键任务
							</span>
						</div>
						<h1 className="font-extrabold font-headline-md text-headline-lg text-on-surface">
							待跟进中心
						</h1>
						<p className="whitespace-nowrap font-body-md text-on-surface-variant">
							神经链路已激活。{all.length} 个同步协议正等待操作员处理。
						</p>
					</div>
					<div className="grid w-full grid-cols-3 gap-2 md:w-auto">
						<div className="glass-panel min-w-[80px] rounded-[4px] p-3 text-center">
							<div className="font-bold font-label-mono text-error text-lg">
								{String(overdueCount).padStart(2, "0")}
							</div>
							<div className="font-label-mono text-[10px] text-on-surface-variant">
								已逾期
							</div>
						</div>
						<div className="glass-panel min-w-[80px] rounded-[4px] p-3 text-center">
							<div className="font-bold font-label-mono text-lg text-primary-fixed">
								{String(todayCount).padStart(2, "0")}
							</div>
							<div className="font-label-mono text-[10px] text-on-surface-variant">
								今日
							</div>
						</div>
						<div className="glass-panel min-w-[80px] rounded-[4px] p-3 text-center">
							<div className="font-bold font-label-mono text-lg text-on-surface">
								{String(upcomingCount).padStart(2, "0")}
							</div>
							<div className="font-label-mono text-[10px] text-on-surface-variant">
								待处理
							</div>
						</div>
					</div>
				</div>

				{/* 筛选 chip */}
				<div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
					<div className="glass-panel flex items-center gap-2 rounded-[4px] p-1.5">
						{FILTERS.map((chip) => (
							<button
								className={
									chip.value === filter
										? "rounded-[2px] border border-primary-fixed-dim bg-[#00dbe7]/10 px-4 py-1.5 font-label-mono text-label-mono text-primary-fixed transition-all"
										: "rounded-[2px] px-4 py-1.5 font-label-mono text-label-mono text-on-surface-variant transition-all hover:bg-surface-variant/50"
								}
								key={chip.value}
								onClick={() => setFilter(chip.value)}
								type="button"
							>
								{chip.label}
							</button>
						))}
					</div>
				</div>

				{/* Bento 网格 */}
				<div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
					{/* 重点任务 */}
					{highlight ? (
						<div className="energy-glow group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[8px] border border-primary-fixed/20 bg-primary-container/5 p-6 md:col-span-8">
							<div className="absolute top-0 right-0 p-4">
								<span className="material-symbols-outlined animate-pulse text-primary-fixed">
									priority_high
								</span>
							</div>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="rounded-[2px] border border-primary-fixed/30 px-2 py-0.5 font-label-mono text-[10px] text-primary-fixed">
										{highlight.category}
									</div>
									<div
										className={`flex items-center gap-1 font-bold text-[10px] ${isOverdue(highlight.deadline, highlight.todoStatus) ? "text-error" : "text-on-surface-variant"}`}
									>
										<span className="material-symbols-outlined text-[14px]">
											timer
										</span>
										<span>{dueCountdown(highlight.deadline)}</span>
									</div>
								</div>
								<div>
									<h3 className="mb-2 line-clamp-2 font-headline-md text-2xl text-on-surface">
										{highlight.content}
									</h3>
									<div className="flex flex-wrap gap-2">
										{highlight.recordTags.map((rt) => (
											<span
												className="font-label-mono text-[10px] text-on-surface-variant"
												key={rt.tag.id}
											>
												#{rt.tag.name}
											</span>
										))}
									</div>
								</div>
							</div>
							<div className="mt-6 flex items-center justify-end">
								<button
									className="flex items-center gap-2 rounded-[2px] bg-primary-container px-6 py-2 font-bold font-label-mono text-label-mono text-on-primary-fixed transition-all hover:brightness-110 disabled:opacity-50"
									disabled={completeMutation.isPending}
									onClick={() => completeMutation.mutate({ id: highlight.id })}
									type="button"
								>
									标记完成
									<span className="material-symbols-outlined text-[18px]">
										task_alt
									</span>
								</button>
							</div>
						</div>
					) : (
						<div className="glass-panel flex min-h-[240px] items-center justify-center rounded-[8px] md:col-span-8">
							<p className="font-label-mono text-label-mono text-on-surface-variant">
								{listQuery.isLoading ? "加载中…" : "当前筛选下没有待跟进任务"}
							</p>
						</div>
					)}

					{/* 情报流 */}
					<div className="glass-panel flex flex-col gap-4 rounded-[8px] p-6 md:col-span-4">
						<div className="flex items-center justify-between">
							<span className="font-label-mono text-label-mono text-on-surface-variant">
								情报流
							</span>
							<span className="material-symbols-outlined text-primary-fixed">
								sensors
							</span>
						</div>
						<div className="space-y-4">
							{all.slice(0, 3).map((t, i) => (
								<div
									className={`space-y-1 border-l-2 p-3 ${i === 0 ? "light-sweep border-primary-fixed bg-[#e1fdff]/5" : "border-outline-variant/30"}`}
									key={t.id}
								>
									<div
										className={`font-label-mono text-[10px] ${i === 0 ? "text-primary-fixed" : "text-on-surface-variant"}`}
									>
										{formatHM(t.createdAt)}
									</div>
									<div className="line-clamp-1 text-on-surface text-sm">
										{t.content}
									</div>
								</div>
							))}
							{all.length === 0 ? (
								<p className="font-label-mono text-[10px] text-on-surface-variant">
									暂无情报
								</p>
							) : null}
						</div>
					</div>

					{/* 标准任务卡 */}
					{rest.slice(0, 6).map((task) => {
						const style = categoryStyle(task.category);
						const overdue = isOverdue(task.deadline, task.todoStatus);
						return (
							<div
								className="glass-panel group space-y-4 rounded-[8px] p-5 transition-all hover:border-primary-fixed/30 md:col-span-4"
								key={task.id}
							>
								<div className="flex items-start justify-between">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-[2px] bg-surface-variant/50 ${style.text}`}
									>
										<span className="material-symbols-outlined">
											{style.icon}
										</span>
									</div>
									<span className="font-label-mono text-[10px] text-on-surface-variant">
										{task.category}
									</span>
								</div>
								<div>
									<h4 className="line-clamp-1 font-bold text-base text-on-surface transition-colors group-hover:text-primary-fixed">
										{task.content}
									</h4>
									<p className="mt-1 line-clamp-2 text-on-surface-variant text-xs">
										{task.content}
									</p>
								</div>
								<div className="flex items-center justify-between border-outline-variant/10 border-t pt-4">
									<div
										className={`flex items-center gap-1 font-label-mono text-[10px] ${overdue ? "text-error" : "text-on-surface-variant"}`}
									>
										<span className="material-symbols-outlined text-[14px]">
											{overdue ? "warning" : "schedule"}
										</span>
										<span>{dueCountdown(task.deadline)}</span>
									</div>
									<button
										className="material-symbols-outlined text-primary-fixed disabled:opacity-50"
										disabled={completeMutation.isPending}
										onClick={() => completeMutation.mutate({ id: task.id })}
										type="button"
									>
										task_alt
									</button>
								</div>
							</div>
						);
					})}

					{/* 负载可视化（系统视觉） */}
					<div className="glass-panel relative min-h-[300px] overflow-hidden rounded-[8px] p-6 md:col-span-12">
						<div className="relative z-10 flex h-full flex-col">
							<div className="mb-8 flex items-center justify-between">
								<div>
									<h3 className="font-headline-md text-on-surface">
										神经链路密度
									</h3>
									<p className="font-label-mono text-[10px] text-on-surface-variant">
										实时系统负载可视化
									</p>
								</div>
								<div className="flex gap-4">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-primary-fixed shadow-[0_0_5px_#00dbe7]" />
										<span className="font-label-mono text-[10px] text-on-surface-variant">
											活跃
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-surface-variant" />
										<span className="font-label-mono text-[10px] text-on-surface-variant">
											空闲
										</span>
									</div>
								</div>
							</div>
							<div className="grid flex-1 grid-cols-12 items-end gap-2">
								{LOAD_BARS.map((h, i) => (
									<div
										className={`group relative rounded-t-sm transition-all hover:bg-primary-fixed ${BAR_OPACITY[i]}`}
										key={`bar-${h}`}
										style={{ height: `${h}%` }}
									>
										<div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-[2px] bg-[#e1fdff] px-1 font-label-mono text-[10px] text-on-primary group-hover:block">
											{h}%
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</H5AppShell>
	);
}
