import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { NeuralAdminShell } from "@/components/neural-admin-shell";
import { categoryStyle, formatTimestamp } from "@/lib/neural";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 后台记录管理 —— 赛博视觉还原 + 真实 tRPC 数据（admin.records）。
export const Route = createFileRoute("/admin/records")({
	component: AdminRecordsScreen,
});

const PAGE_SIZE = 10;

interface StatusStyle {
	badge: string;
	dots: boolean[];
	label: string;
	level: string;
	levelClass: string;
}

const STATUS_STYLE: Record<string, StatusStyle> = {
	normal: {
		label: "普通",
		badge:
			"bg-surface-variant text-on-surface-variant border border-outline-variant/10",
		dots: [true, false, false, false],
		level: "低",
		levelClass: "opacity-60",
	},
	pending: {
		label: "待跟进",
		badge:
			"bg-primary-container/10 text-primary-fixed border border-primary-container/20",
		dots: [true, true, true, false],
		level: "高",
		levelClass: "opacity-60",
	},
	done: {
		label: "已完成",
		badge:
			"bg-secondary-container/10 text-secondary-fixed border border-secondary-container/20",
		dots: [true, true, true, true],
		level: "完成",
		levelClass: "opacity-60",
	},
	archived: {
		label: "已归档",
		badge:
			"bg-surface-variant text-on-surface-variant border border-outline-variant/10",
		dots: [true, true, false, false],
		level: "归档",
		levelClass: "opacity-40",
	},
};

function statusStyle(status: string): StatusStyle {
	return STATUS_STYLE[status] ?? STATUS_STYLE.normal;
}

function AdminRecordsScreen() {
	const [keyword, setKeyword] = useState("");
	const [page, setPage] = useState(1);

	const list = useQuery(
		trpc.admin.records.list.queryOptions({
			page,
			pageSize: PAGE_SIZE,
			keyword: keyword || undefined,
		})
	);

	const removeMutation = useMutation(
		trpc.admin.records.remove.mutationOptions({
			onSuccess: () => list.refetch(),
		})
	);

	const items = list.data?.items ?? [];
	const total = list.data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const to = Math.min(page * PAGE_SIZE, total);

	return (
		<NeuralAdminShell active="records">
			{/* 头部 */}
			<div className="flex flex-col justify-between gap-lg md:flex-row md:items-end">
				<div>
					<h1 className="mb-1 font-headline-lg text-headline-lg text-primary-fixed">
						记录管理
					</h1>
					<div className="flex items-center gap-4 font-label-mono text-label-mono text-on-surface-variant">
						<span className="flex items-center gap-1">
							<span className="h-2 w-2 rounded-full bg-primary-container" />{" "}
							系统稳定
						</span>
						<span className="flex items-center gap-1 opacity-50">/</span>
						<span className="text-secondary-fixed">
							条目总数: {total.toLocaleString()}
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-3 md:flex-row md:items-center">
					<div className="flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-1">
						<span className="material-symbols-outlined text-primary-fixed text-sm">
							search
						</span>
						<input
							aria-label="搜索记录"
							className="w-full min-w-0 border-none bg-transparent font-label-mono text-label-mono text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 md:w-48"
							onChange={(e) => {
								setKeyword(e.target.value);
								setPage(1);
							}}
							placeholder="系统查询..."
							type="text"
							value={keyword}
						/>
					</div>
					<button
						className="flex items-center gap-2 border border-outline-variant/30 bg-surface-container-high px-lg py-sm font-label-mono text-label-mono text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
						disabled={list.isFetching}
						onClick={() => list.refetch()}
						type="button"
					>
						<span
							className={`material-symbols-outlined text-sm ${list.isFetching ? "animate-spin-slow" : ""}`}
						>
							sync
						</span>
						同步流
					</button>
				</div>
			</div>

			{/* 统计 Bento（系统视觉，记录总数为真实值） */}
			<div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
				<div className="glass-panel relative overflow-hidden p-lg">
					<div className="scanline" />
					<p className="mb-2 font-label-mono-sm text-label-mono-sm text-primary-fixed opacity-60">
						记录总数
					</p>
					<p className="font-bold font-headline-md text-headline-md">
						{total.toLocaleString()}
					</p>
					<div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-variant">
						<div className="h-full w-[72%] bg-primary-container" />
					</div>
				</div>
				<div className="glass-panel p-lg">
					<p className="mb-2 font-label-mono-sm text-label-mono-sm text-secondary-fixed opacity-60">
						本页条目
					</p>
					<p className="font-bold font-headline-md text-headline-md">
						{items.length}
					</p>
					<div className="mt-4 flex h-8 items-end gap-1">
						<div className="h-4 w-2 bg-secondary-fixed/20" />
						<div className="h-6 w-2 bg-secondary-fixed/40" />
						<div className="h-5 w-2 bg-secondary-fixed/60" />
						<div className="h-8 w-2 bg-secondary-fixed/80" />
						<div className="h-3 w-2 bg-secondary-fixed" />
					</div>
				</div>
				<div className="glass-panel p-lg">
					<p className="mb-2 font-label-mono-sm text-label-mono-sm text-tertiary-fixed opacity-60">
						当前页码
					</p>
					<p className="font-bold font-headline-md text-headline-md text-tertiary-fixed">
						{page} / {totalPages}
					</p>
					<div className="mt-4 flex items-center gap-2">
						<span className="material-symbols-outlined text-sm text-tertiary-fixed">
							verified_user
						</span>
						<span className="font-label-mono-sm text-label-mono-sm">
							分页就绪
						</span>
					</div>
				</div>
				<div className="glass-panel flex flex-col items-center justify-center border-primary-container/20 bg-primary-container/5 p-lg">
					<span className="material-symbols-outlined mb-1 text-lg text-primary-fixed">
						add_circle
					</span>
					<p className="font-bold font-label-mono text-label-mono text-primary-fixed">
						去记录流
					</p>
				</div>
			</div>

			{/* 记录表格 */}
			<div className="glass-panel overflow-hidden">
				<div className="cockpit-header grid grid-cols-12 items-center p-md font-label-mono text-label-mono text-primary-fixed tracking-widest">
					<div className="col-span-1">ID</div>
					<div className="col-span-4">内容</div>
					<div className="col-span-2">时间戳</div>
					<div className="col-span-2">分类</div>
					<div className="col-span-2">状态</div>
					<div className="col-span-1 text-right">指令</div>
				</div>

				{list.isLoading ? (
					<div className="flex justify-center p-10">
						<span className="material-symbols-outlined animate-spin text-primary-fixed">
							progress_activity
						</span>
					</div>
				) : null}

				{!list.isLoading && items.length === 0 ? (
					<div className="p-10 text-center font-label-mono text-label-mono text-on-surface-variant">
						没有匹配的记录
					</div>
				) : null}

				<div className="divide-y divide-outline-variant/10">
					{items.map((item) => {
						const cat = categoryStyle(item.category);
						const st = statusStyle(item.status);
						return (
							<div
								className="glow-row group grid grid-cols-12 items-center p-md transition-all duration-300"
								key={item.id}
							>
								<div className="col-span-1 font-label-mono text-label-mono-sm text-on-surface-variant">
									#{item.id.slice(0, 4)}
								</div>
								<div className="col-span-4 flex items-center gap-3">
									<div
										className={`flex h-8 w-8 items-center justify-center rounded-full ${cat.iconWrap} ${cat.text}`}
									>
										<span className="material-symbols-outlined text-sm">
											{cat.icon}
										</span>
									</div>
									<p className="line-clamp-1 font-body-md text-on-surface transition-colors group-hover:text-primary-fixed">
										{item.content}
									</p>
								</div>
								<div className="col-span-2 font-label-mono text-label-mono-sm">
									{formatTimestamp(item.createdAt)}
								</div>
								<div className="col-span-2">
									<span
										className={`inline-flex items-center rounded-full px-2 py-0.5 font-label-mono-sm ${cat.text}`}
									>
										{item.category}
									</span>
								</div>
								<div className="col-span-2">
									<span
										className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold text-[10px] ${st.badge}`}
									>
										{st.label}
									</span>
								</div>
								<div className="col-span-1 text-right">
									<button
										aria-label="删除记录"
										className="text-on-surface-variant transition-colors hover:text-error disabled:opacity-50"
										disabled={removeMutation.isPending}
										onClick={() => removeMutation.mutate({ id: item.id })}
										type="button"
									>
										<span className="material-symbols-outlined">delete</span>
									</button>
								</div>
							</div>
						);
					})}
				</div>

				{/* 分页 */}
				<div className="flex items-center justify-between border-outline-variant/10 border-t bg-surface-container-low/50 p-md font-label-mono text-label-mono-sm">
					<p className="text-on-surface-variant">
						显示 {from}-{to} / 共 {total.toLocaleString()} 条记录
					</p>
					<div className="flex items-center gap-2">
						<button
							className="flex h-8 w-8 items-center justify-center border border-outline-variant/20 text-on-surface-variant transition-all hover:bg-[#e1fdff]/10 hover:text-primary-fixed disabled:opacity-30"
							disabled={page <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							type="button"
						>
							<span className="material-symbols-outlined text-sm">
								chevron_left
							</span>
						</button>
						<span className="flex h-8 min-w-8 items-center justify-center border border-primary-fixed bg-primary-container/10 px-2 font-bold text-primary-fixed">
							{page}
						</span>
						<button
							className="flex h-8 w-8 items-center justify-center border border-outline-variant/20 text-on-surface-variant transition-all hover:bg-[#e1fdff]/10 hover:text-primary-fixed disabled:opacity-30"
							disabled={page >= totalPages}
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							type="button"
						>
							<span className="material-symbols-outlined text-sm">
								chevron_right
							</span>
						</button>
					</div>
				</div>
			</div>
		</NeuralAdminShell>
	);
}
