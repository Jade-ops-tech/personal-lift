import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { categoryStyle, formatHM } from "@/lib/neural";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 记录流（H5 首页）—— 赛博视觉还原 + 真实 tRPC 数据。
export const Route = createFileRoute("/h5/")({
	component: RecordStreamScreen,
});

const DAILY_LOAD_TARGET = 10;

function RecordStreamScreen() {
	const [content, setContent] = useState("");
	const records = useQuery(trpc.record.listToday.queryOptions());

	const createMutation = useMutation(
		trpc.record.create.mutationOptions({
			onSuccess: () => {
				records.refetch();
				setContent("");
			},
		})
	);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const trimmed = content.trim();
		if (trimmed) {
			createMutation.mutate({ content: trimmed });
		}
	};

	const items = records.data ?? [];
	const todoCount = items.filter((r) => r.isTodo).length;
	const loadPercent = Math.min(
		100,
		Math.round((items.length / DAILY_LOAD_TARGET) * 100)
	);
	const todoPercent = items.length
		? Math.round((todoCount / items.length) * 100)
		: 0;

	return (
		<div className="overflow-x-hidden font-body-md text-on-surface antialiased">
			{/* 顶部导航 */}
			<header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-outline-variant/10 border-b bg-surface/10 px-margin-mobile shadow-[0_0_15px_rgba(0,242,255,0.1)] backdrop-blur-xl md:px-margin-desktop">
				<div className="flex items-center gap-2">
					<span className="font-bold font-headline-md text-headline-md text-primary-fixed tracking-tighter drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">
						NEURAL_OS
					</span>
				</div>
				<div className="flex items-center gap-4">
					<button
						className="rounded-full p-2 text-on-surface-variant transition-colors duration-300 hover:bg-[#e1fdff]/10"
						type="button"
					>
						<span className="material-symbols-outlined">notifications</span>
					</button>
					<Link
						className="rounded-full p-2 text-on-surface-variant transition-colors duration-300 hover:bg-[#e1fdff]/10"
						to="/h5/summary"
					>
						<span className="material-symbols-outlined">analytics</span>
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-2xl space-y-8 px-margin-mobile pt-24 pb-32">
				{/* 录入区 */}
				<section className="space-y-4">
					<form
						className="glow-input glass-panel rounded-[8px] p-4 transition-all duration-300"
						onSubmit={handleSubmit}
					>
						<div className="flex items-start gap-3">
							<span className="material-symbols-outlined mt-1 text-primary-fixed">
								terminal
							</span>
							<textarea
								aria-label="记录内容"
								className="min-h-[80px] w-full resize-none border-none bg-transparent font-body-lg text-body-lg placeholder-on-surface-variant/40 focus:ring-0"
								disabled={createMutation.isPending}
								onChange={(e) => setContent(e.target.value)}
								placeholder="捕捉神经脉冲..."
								value={content}
							/>
						</div>
						<div className="mt-4 flex items-center justify-between border-outline-variant/10 border-t pt-4">
							<span className="font-label-mono text-label-mono text-on-surface-variant/60">
								AI 自动识别分类与标签
							</span>
							<button
								className="rounded-[4px] bg-primary-container px-6 py-2 font-bold font-label-mono text-label-mono text-on-primary-fixed shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-transform active:scale-95 disabled:opacity-50"
								disabled={createMutation.isPending || !content.trim()}
								type="submit"
							>
								{createMutation.isPending ? "写入中…" : "初始化"}
							</button>
						</div>
					</form>
				</section>

				{/* 每日洞察 */}
				<section className="holographic-glow glass-panel rounded-[8px] border-[#e1fdff]/20 p-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="flex items-center gap-2 font-label-mono text-label-mono text-primary-fixed uppercase tracking-widest">
							<span className="material-symbols-outlined text-[16px]">
								analytics
							</span>
							每日洞察
						</h3>
						<span className="font-label-mono text-label-mono-sm text-on-surface-variant opacity-60">
							{new Date().toLocaleDateString("zh-CN")}
						</span>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-[4px] border border-outline-variant/10 bg-surface/30 p-3">
							<p className="mb-1 text-label-mono-sm text-on-surface-variant">
								今日记录
							</p>
							<p className="font-headline-md text-[#e1fdff] text-headline-md">
								{items.length}
							</p>
							<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-outline-variant/20">
								<div
									className="h-full bg-primary-container"
									style={{ width: `${loadPercent}%` }}
								/>
							</div>
						</div>
						<div className="rounded-[4px] border border-outline-variant/10 bg-surface/30 p-3">
							<p className="mb-1 text-label-mono-sm text-on-surface-variant">
								待办占比
							</p>
							<p className="font-headline-md text-headline-md text-tertiary-container">
								{todoCount}
							</p>
							<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-outline-variant/20">
								<div
									className="h-full bg-tertiary-container"
									style={{ width: `${todoPercent}%` }}
								/>
							</div>
						</div>
					</div>
					<p className="mt-4 text-body-md text-on-surface-variant/80 italic">
						“今日已捕捉 {items.length} 条神经脉冲，其中 {todoCount}{" "}
						条进入待办队列。”
					</p>
				</section>

				{/* 记录流 */}
				<section className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="font-headline-md text-headline-md">近期节点</h2>
						<Link
							className="flex items-center gap-1 font-label-mono text-label-mono text-primary-fixed"
							to="/h5/todos"
						>
							待跟进
							<span className="material-symbols-outlined text-[16px]">
								filter_list
							</span>
						</Link>
					</div>

					{records.isLoading ? (
						<div className="flex justify-center py-10">
							<span className="material-symbols-outlined animate-spin text-primary-fixed">
								progress_activity
							</span>
						</div>
					) : null}

					{!records.isLoading && items.length === 0 ? (
						<div className="glass-panel rounded-[8px] p-10 text-center">
							<p className="font-label-mono text-label-mono text-on-surface-variant">
								今日暂无节点，捕捉第一条脉冲吧
							</p>
						</div>
					) : null}

					{items.map((item) => {
						const style = categoryStyle(item.category);
						return (
							<Link
								className={`${style.neon} glass-panel group block cursor-pointer rounded-[8px] p-5 transition-all duration-300 hover:translate-x-1`}
								key={item.id}
								params={{ id: item.id }}
								to="/h5/records/$id"
							>
								<div className="mb-3 flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className={`rounded-[2px] p-2 ${style.iconWrap}`}>
											<span
												className={`material-symbols-outlined ${style.text}`}
											>
												{style.icon}
											</span>
										</div>
										<div>
											<p
												className={`font-label-mono text-label-mono-sm ${style.text}`}
											>
												{item.category} / {formatHM(item.createdAt)}
											</p>
											<h4 className="line-clamp-1 font-headline-md text-[#e1fdff] text-headline-md">
												{item.content}
											</h4>
										</div>
									</div>
									{item.isTodo ? (
										<span className="rounded-[2px] bg-[#e1fdff]/10 px-2 py-0.5 font-label-mono-sm text-label-mono-sm text-primary-fixed">
											待办
										</span>
									) : (
										<span className="material-symbols-outlined text-on-surface-variant/40 transition-colors group-hover:text-primary-fixed">
											more_vert
										</span>
									)}
								</div>
								<p className="line-clamp-2 text-body-md text-on-surface-variant leading-relaxed">
									{item.content}
								</p>
								{item.recordTags.length > 0 ? (
									<div className="mt-4 flex flex-wrap gap-2">
										{item.recordTags.map((rt) => (
											<span
												className="rounded-[2px] bg-outline-variant/10 px-2 py-0.5 font-label-mono-sm text-label-mono-sm text-on-surface-variant"
												key={rt.tag.id}
											>
												#{rt.tag.name}
											</span>
										))}
									</div>
								) : null}
							</Link>
						);
					})}
				</section>
			</main>

			{/* 底部导航（移动端） */}
			<nav className="glass-panel fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t-0 px-4 md:hidden">
				<Link
					className="flex flex-col items-center gap-1 font-bold text-primary-fixed"
					to="/h5"
				>
					<span className="material-symbols-outlined">dynamic_feed</span>
					<span className="font-label-mono text-[10px]">动态</span>
				</Link>
				<Link
					className="flex flex-col items-center gap-1 text-on-surface-variant opacity-60"
					to="/h5/todos"
				>
					<span className="material-symbols-outlined">grid_view</span>
					<span className="font-label-mono text-[10px]">待办</span>
				</Link>
				<div className="relative -top-6">
					<button
						className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-fixed shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-transform active:scale-90 disabled:opacity-50"
						disabled={createMutation.isPending || !content.trim()}
						onClick={() => {
							const trimmed = content.trim();
							if (trimmed) {
								createMutation.mutate({ content: trimmed });
							}
						}}
						type="button"
					>
						<span className="material-symbols-outlined text-3xl">add</span>
					</button>
				</div>
				<Link
					className="flex flex-col items-center gap-1 text-on-surface-variant opacity-60"
					to="/h5/summary"
				>
					<span className="material-symbols-outlined">monitoring</span>
					<span className="font-label-mono text-[10px]">总结</span>
				</Link>
			</nav>
		</div>
	);
}
