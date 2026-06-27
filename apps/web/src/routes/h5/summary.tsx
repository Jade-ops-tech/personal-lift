import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { H5AppShell } from "@/components/h5-app-shell";
import { categoryStyle } from "@/lib/neural";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 总结回顾 / SYNOPSIS —— 赛博视觉还原 + 真实 tRPC 数据（summary）。
export const Route = createFileRoute("/h5/summary")({
	component: SummaryScreen,
});

interface RecordRef {
	content: string;
	id: string;
}
interface NamedCount {
	count: number;
	name: string;
}
interface DailyContent {
	categoryCounts: Record<string, number>;
	followUps: RecordRef[];
	ideas: RecordRef[];
	keywords: string[];
	overdue: RecordRef[];
	overview: string;
	recordCount: number;
}
interface WeeklyContent {
	dailyTrend: { date: string; count: number }[];
	mainContent: string;
	topCategories: NamedCount[];
	topTags: NamedCount[];
}

const HEATMAP_LEVELS = [
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed/60",
	"bg-primary-fixed shadow-[0_0_10px_rgba(0,242,255,0.6)]",
	"bg-primary-fixed/10",
	"bg-primary-fixed/30",
	"bg-primary-fixed/60",
	"bg-primary-fixed/10",
	"bg-primary-fixed/30",
	"bg-primary-fixed shadow-[0_0_10px_rgba(0,242,255,0.6)]",
	"bg-primary-fixed/60",
	"bg-primary-fixed/10",
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed/60",
	"bg-primary-fixed/30",
	"bg-primary-fixed shadow-[0_0_10px_rgba(0,242,255,0.6)]",
	"bg-primary-fixed/10",
	"bg-primary-fixed/60",
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed/30",
	"bg-primary-fixed/60",
	"bg-primary-fixed/10",
	"bg-primary-fixed/30",
	"bg-primary-fixed/60",
	"bg-primary-fixed/10",
	"bg-primary-fixed shadow-[0_0_10px_rgba(0,242,255,0.6)]",
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed/60",
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed/60",
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed shadow-[0_0_10px_rgba(0,242,255,0.6)]",
	"bg-primary-fixed/30",
	"bg-primary-fixed/60",
	"bg-primary-fixed/10",
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed/60",
	"bg-primary-fixed/30",
	"bg-primary-fixed/10",
	"bg-primary-fixed/30",
	"bg-primary-fixed/60",
	"bg-primary-fixed/10",
];
const HEATMAP_CELLS = HEATMAP_LEVELS.map((level, i) => ({
	id: `hm-${i}`,
	level,
}));

const EMPTY_TREND = Array.from({ length: 7 }, (_, i) => ({
	date: `d${i}`,
	count: 0,
}));

function DailyTerminal({
	daily,
	pending,
	onGenerate,
}: {
	daily: DailyContent | null;
	pending: boolean;
	onGenerate: () => void;
}) {
	if (!daily) {
		return (
			<div className="space-y-4 font-label-mono text-body-md text-on-surface-variant">
				<p className="terminal-cursor">&gt; 暂无今日总结数据</p>
				<button
					className="rounded-[2px] bg-primary-container px-4 py-2 font-bold text-label-mono text-on-primary-fixed transition-all hover:brightness-110 disabled:opacity-50"
					disabled={pending}
					onClick={onGenerate}
					type="button"
				>
					{pending ? "生成中…" : "生成今日总结"}
				</button>
			</div>
		);
	}
	return (
		<div className="space-y-4 font-label-mono text-[#e1fdff] text-body-md leading-relaxed">
			<p className="terminal-cursor">
				&gt; 今日捕捉 {daily.recordCount} 条节点 · 待跟进{" "}
				{daily.followUps.length} · 逾期 {daily.overdue.length}
			</p>
			<p className="border-primary-fixed/30 border-l-2 bg-primary-fixed/5 py-3 pl-4">
				<span className="text-primary-fixed">核心洞察：</span>{" "}
				{daily.overview || "暂无概述"}
			</p>
			{daily.keywords.length > 0 ? (
				<p className="flex flex-wrap gap-2 text-on-surface-variant">
					{daily.keywords.map((kw) => (
						<span key={kw}>#{kw}</span>
					))}
				</p>
			) : null}
		</div>
	);
}

function TrendChart({
	weekly,
	trend,
	maxCount,
	pending,
	onGenerate,
}: {
	weekly: WeeklyContent | null;
	trend: { date: string; count: number }[];
	maxCount: number;
	pending: boolean;
	onGenerate: () => void;
}) {
	const bars = trend.length ? trend : EMPTY_TREND;
	const weekTotal = trend.reduce((sum, d) => sum + d.count, 0);
	return (
		<section className="glass-card rounded-[8px] p-8 md:col-span-12">
			<div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
				<div className="flex-1">
					<div className="mb-8 flex items-center justify-between">
						<h3 className="font-label-mono text-label-mono uppercase tracking-widest">
							本周记录趋势
						</h3>
						{weekly ? null : (
							<button
								className="rounded-[2px] border border-primary-fixed/30 px-3 py-1 font-label-mono text-label-mono-sm text-primary-fixed hover:bg-primary-fixed/10 disabled:opacity-50"
								disabled={pending}
								onClick={onGenerate}
								type="button"
							>
								{pending ? "生成中…" : "生成本周"}
							</button>
						)}
					</div>
					<div className="flex h-48 w-full items-end gap-2 md:gap-4">
						{bars.map((d) => (
							<div
								className="group relative flex-1 cursor-crosshair rounded-t-sm bg-primary-fixed/10 transition-all hover:bg-primary-fixed/20"
								key={d.date}
							>
								<div
									className="absolute bottom-0 w-full rounded-t-sm bg-primary-fixed shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all duration-1000"
									style={{
										height: `${Math.max(4, (d.count / maxCount) * 100)}%`,
									}}
								/>
								<div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 font-label-mono text-[10px] text-primary-fixed group-hover:block">
									{d.count}
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="w-full space-y-4 md:w-64">
					<div className="rounded-[2px] border border-outline-variant/20 bg-surface-container-low p-4">
						<span className="font-label-mono text-label-mono-sm uppercase opacity-50">
							本周热门标签
						</span>
						<div className="mt-2 flex flex-wrap gap-2">
							{weekly?.topTags.length ? (
								weekly.topTags.map((t) => (
									<span
										className="font-label-mono text-label-mono text-primary-fixed"
										key={t.name}
									>
										#{t.name} {t.count}
									</span>
								))
							) : (
								<span className="font-label-mono text-label-mono-sm text-on-surface-variant">
									暂无
								</span>
							)}
						</div>
					</div>
					<div className="rounded-[2px] border border-outline-variant/20 bg-surface-container-low p-4">
						<span className="font-label-mono text-label-mono-sm uppercase opacity-50">
							本周记录总数
						</span>
						<div className="font-headline-md text-headline-md text-primary-fixed">
							{weekTotal}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function SummaryScreen() {
	const dailyQuery = useQuery(trpc.summary.getDaily.queryOptions({}));
	const weeklyQuery = useQuery(trpc.summary.getWeekly.queryOptions({}));

	const generateDaily = useMutation(
		trpc.summary.generateDaily.mutationOptions({
			onSuccess: () => dailyQuery.refetch(),
		})
	);
	const generateWeekly = useMutation(
		trpc.summary.generateWeekly.mutationOptions({
			onSuccess: () => weeklyQuery.refetch(),
		})
	);

	const daily = (dailyQuery.data?.content ?? null) as DailyContent | null;
	const weekly = (weeklyQuery.data?.content ?? null) as WeeklyContent | null;

	const trend = weekly?.dailyTrend ?? [];
	const maxCount = Math.max(1, ...trend.map((d) => d.count));
	const topCategories = Object.entries(daily?.categoryCounts ?? {})
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 3);

	return (
		<H5AppShell>
			<div className="mx-auto max-w-[1440px]">
				<div className="mb-8 flex flex-col items-end justify-between gap-4 md:flex-row">
					<div>
						<span className="mb-2 block font-label-mono text-label-mono text-primary-fixed uppercase tracking-[0.2em]">
							项目综合分析
						</span>
						<h2 className="font-headline-xl text-headline-xl text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(0,219,231,0.3)]">
							总结回顾 <span className="opacity-30">/ SYNOPSIS</span>
						</h2>
					</div>
					<div className="flex items-center gap-2">
						<button
							className="rounded-[2px] border border-primary-fixed/30 px-3 py-1.5 font-label-mono text-label-mono text-primary-fixed transition-all hover:bg-primary-fixed/10 disabled:opacity-50"
							disabled={generateDaily.isPending}
							onClick={() => generateDaily.mutate({})}
							type="button"
						>
							{generateDaily.isPending ? "生成中…" : "生成今日"}
						</button>
						<button
							className="rounded-[2px] border border-primary-fixed/30 px-3 py-1.5 font-label-mono text-label-mono text-primary-fixed transition-all hover:bg-primary-fixed/10 disabled:opacity-50"
							disabled={generateWeekly.isPending}
							onClick={() => generateWeekly.mutate({})}
							type="button"
						>
							{generateWeekly.isPending ? "生成中…" : "生成本周"}
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
					{/* AI 摘要终端 = 每日总结 overview */}
					<section className="glass-card group relative overflow-hidden rounded-[8px] p-6 md:col-span-8">
						<div className="absolute top-0 right-0 p-4 opacity-20">
							<span className="material-symbols-outlined text-4xl">
								neurology
							</span>
						</div>
						<div className="mb-6 flex items-center gap-3">
							<div className="h-2 w-2 animate-pulse rounded-full bg-primary-fixed" />
							<h3 className="font-label-mono text-label-mono text-primary-fixed uppercase tracking-widest">
								神经核心摘要
							</h3>
						</div>
						<DailyTerminal
							daily={daily}
							onGenerate={() => generateDaily.mutate({})}
							pending={generateDaily.isPending}
						/>
					</section>

					{/* 今日记录数 */}
					<div className="glass-card flex flex-col justify-between rounded-[8px] p-6 md:col-span-4">
						<div>
							<div className="mb-4 flex items-start justify-between">
								<span className="font-label-mono text-label-mono text-primary-fixed">
									今日节点数
								</span>
								<span className="material-symbols-outlined text-primary-fixed">
									bolt
								</span>
							</div>
							<div className="font-headline-lg text-glow text-headline-lg">
								{daily?.recordCount ?? 0}
							</div>
							<p className="mt-1 text-label-mono text-label-mono-sm text-on-surface-variant">
								{daily ? `想法 ${daily.ideas.length} 条` : "尚未生成"}
							</p>
						</div>
					</div>

					{/* 网络脉冲热力图（系统视觉） */}
					<section className="glass-card rounded-[8px] p-6 md:col-span-12">
						<div className="mb-6 flex items-center justify-between">
							<h3 className="font-label-mono text-label-mono uppercase tracking-widest">
								网络脉冲图
							</h3>
							<div className="flex items-center gap-4 font-label-mono text-label-mono-sm">
								<span className="opacity-50">低</span>
								<div className="flex gap-1">
									<div className="h-3 w-3 bg-primary-fixed/10" />
									<div className="h-3 w-3 bg-primary-fixed/30" />
									<div className="h-3 w-3 bg-primary-fixed/60" />
									<div className="h-3 w-3 bg-primary-fixed shadow-[0_0_8px_rgba(0,242,255,0.6)]" />
								</div>
								<span className="opacity-50">高峰</span>
							</div>
						</div>
						<div className="grid h-32 grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
							{HEATMAP_CELLS.map((cell) => (
								<div
									className={`h-full rounded-sm ${cell.level}`}
									key={cell.id}
								/>
							))}
						</div>
						<div className="mt-2 flex justify-between font-label-mono text-label-mono-sm opacity-40">
							<span>00:00</span>
							<span>06:00</span>
							<span>12:00</span>
							<span>18:00</span>
							<span>23:59</span>
						</div>
					</section>

					{/* 分类卡片 = 今日分类分布 */}
					{topCategories.length > 0 ? (
						topCategories.map((cat) => {
							const style = categoryStyle(cat.name);
							return (
								<div
									className="glass-card group overflow-hidden rounded-[8px] md:col-span-4"
									key={cat.name}
								>
									<div className="relative flex h-32 items-center justify-center overflow-hidden bg-surface-container-high">
										<span
											className={`material-symbols-outlined text-4xl drop-shadow-lg ${style.text}`}
										>
											{style.icon}
										</span>
									</div>
									<div className="p-6">
										<div className="mb-2 flex items-center justify-between">
											<h4 className="font-headline-md text-headline-md">
												{cat.name}
											</h4>
											<span className="font-label-mono text-label-mono text-primary-fixed">
												{cat.count} 条
											</span>
										</div>
										<p className="mb-4 font-body-md text-body-md text-on-surface-variant">
											该分类在今日记录中的累计条目。
										</p>
									</div>
								</div>
							);
						})
					) : (
						<div className="glass-card flex items-center justify-center rounded-[8px] p-10 md:col-span-12">
							<p className="font-label-mono text-label-mono text-on-surface-variant">
								{daily ? "今日暂无分类数据" : "生成今日总结后展示分类分布"}
							</p>
						</div>
					)}

					{/* 通量强度柱状图 = 本周每日趋势 */}
					<TrendChart
						maxCount={maxCount}
						onGenerate={() => generateWeekly.mutate({})}
						pending={generateWeekly.isPending}
						trend={trend}
						weekly={weekly}
					/>
				</div>
			</div>
		</H5AppShell>
	);
}
