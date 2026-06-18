import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
	component: HomeScreen,
});

const ENTRIES = [
	{
		to: "/h5",
		icon: "dynamic_feed",
		title: "记录流",
		desc: "随手捕捉，AI 自动识别分类与标签",
	},
	{
		to: "/h5/todos",
		icon: "grid_view",
		title: "待跟进中心",
		desc: "任务矩阵，逾期/今日/明日一览",
	},
	{
		to: "/h5/summary",
		icon: "monitoring",
		title: "总结回顾",
		desc: "每日/每周综合分析与趋势",
	},
	{
		to: "/admin/records",
		icon: "admin_panel_settings",
		title: "后台管理",
		desc: "记录 / 待办 / 标签 / 总结",
	},
] as const;

function HomeScreen() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const online = Boolean(healthCheck.data);

	let statusText = "链路未连接";
	if (healthCheck.isLoading) {
		statusText = "检测中…";
	} else if (online) {
		statusText = "链路已连接";
	}

	return (
		<div className="mx-auto w-full max-w-[1100px] px-margin-mobile py-10 md:px-margin-desktop">
			{/* Hero */}
			<section className="mb-10">
				<span className="font-label-mono text-label-mono text-primary-fixed uppercase tracking-[0.3em]">
					个人提升系统
				</span>
				<h1 className="mt-2 font-extrabold font-headline-md text-4xl text-primary-fixed-dim tracking-tighter drop-shadow-[0_0_12px_rgba(0,219,231,0.3)] md:text-5xl">
					NEURAL_OS
				</h1>
				<p className="mt-3 whitespace-nowrap font-body-md text-on-surface-variant">
					把零散的念头化作结构化的进展。记录、待办、总结，一套神经接口全部接管。
				</p>
			</section>

			{/* 接口状态 */}
			<section className="glass-panel mb-10 flex items-center justify-between rounded-[8px] p-5">
				<div className="flex items-center gap-3">
					<span
						className={`h-2.5 w-2.5 rounded-full ${online ? "bg-primary-fixed shadow-[0_0_8px_rgba(0,242,255,0.6)]" : "bg-error"} ${healthCheck.isLoading ? "animate-pulse" : ""}`}
					/>
					<div>
						<p className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
							接口状态
						</p>
						<p className="font-headline-md text-headline-md text-on-surface">
							{statusText}
						</p>
					</div>
				</div>
				<span className="material-symbols-outlined text-primary-fixed">
					{online ? "sensors" : "sensors_off"}
				</span>
			</section>

			{/* 快捷入口 */}
			<section className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
				{ENTRIES.map((entry) => (
					<Link
						className="glass-panel group flex items-start gap-4 rounded-[8px] p-5 transition-all hover:translate-x-1 hover:border-primary-fixed/30"
						key={entry.to}
						to={entry.to}
					>
						<div className="rounded-[4px] bg-[#e1fdff]/10 p-3">
							<span className="material-symbols-outlined text-primary-fixed">
								{entry.icon}
							</span>
						</div>
						<div className="flex-1">
							<div className="flex items-center justify-between">
								<h2 className="font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-primary-fixed">
									{entry.title}
								</h2>
								<span className="material-symbols-outlined text-on-surface-variant/40 transition-colors group-hover:text-primary-fixed">
									arrow_forward
								</span>
							</div>
							<p className="mt-1 text-body-md text-on-surface-variant">
								{entry.desc}
							</p>
						</div>
					</Link>
				))}
			</section>
		</div>
	);
}
