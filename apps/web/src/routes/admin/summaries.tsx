import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { NeuralAdminShell } from "@/components/neural-admin-shell";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 后台总结管理 —— 赛博视觉 + 真实 tRPC 数据（admin.summaries）。
export const Route = createFileRoute("/admin/summaries")({
	component: AdminSummariesScreen,
});

type Mode = "daily" | "weekly";

function AdminSummariesScreen() {
	const [mode, setMode] = useState<Mode>("daily");
	const [date, setDate] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [parseError, setParseError] = useState("");

	const summaries = useQuery(
		trpc.admin.summaries.list.queryOptions({ type: mode })
	);
	const refetch = () => {
		summaries.refetch();
	};
	const regenerate = useMutation(
		trpc.admin.summaries.regenerate.mutationOptions({ onSuccess: refetch })
	);
	const update = useMutation(
		trpc.admin.summaries.update.mutationOptions({
			onSuccess: () => {
				refetch();
				setSelectedId(null);
			},
		})
	);

	const openEditor = (id: string, content: unknown) => {
		setSelectedId(id);
		setDraft(JSON.stringify(content, null, 2));
		setParseError("");
	};

	const handleSave = () => {
		try {
			const parsed = JSON.parse(draft);
			if (selectedId) {
				update.mutate({ id: selectedId, content: parsed });
			}
		} catch {
			setParseError("内容不是合法 JSON");
		}
	};

	const items = summaries.data ?? [];

	return (
		<NeuralAdminShell active="summaries">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
				<div>
					<h1 className="mb-1 font-headline-lg text-headline-lg text-primary-fixed">
						总结管理
					</h1>
					<p className="font-label-mono text-label-mono text-on-surface-variant">
						{mode === "daily" ? "每日" : "每周"}总结 · 共 {items.length} 条
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="glass-panel flex items-center gap-1 rounded-[4px] p-1">
						<button
							className={
								mode === "daily"
									? "rounded-[2px] bg-primary-container/10 px-4 py-1.5 font-label-mono text-label-mono text-primary-fixed"
									: "rounded-[2px] px-4 py-1.5 font-label-mono text-label-mono text-on-surface-variant hover:bg-surface-variant/50"
							}
							onClick={() => setMode("daily")}
							type="button"
						>
							每日
						</button>
						<button
							className={
								mode === "weekly"
									? "rounded-[2px] bg-primary-container/10 px-4 py-1.5 font-label-mono text-label-mono text-primary-fixed"
									: "rounded-[2px] px-4 py-1.5 font-label-mono text-label-mono text-on-surface-variant hover:bg-surface-variant/50"
							}
							onClick={() => setMode("weekly")}
							type="button"
						>
							每周
						</button>
					</div>
					<input
						aria-label="日期"
						className="rounded-[2px] border border-outline-variant/30 bg-surface-container px-3 py-1.5 font-label-mono text-label-mono text-on-surface focus:border-primary-fixed focus:ring-0"
						onChange={(e) => setDate(e.target.value)}
						type="date"
						value={date}
					/>
					<button
						className="flex items-center gap-2 rounded-[2px] bg-primary-container px-4 py-1.5 font-bold font-label-mono text-label-mono text-on-primary-fixed transition-transform active:scale-95 disabled:opacity-50"
						disabled={regenerate.isPending}
						onClick={() =>
							regenerate.mutate({ type: mode, date: date || undefined })
						}
						type="button"
					>
						<span
							className={`material-symbols-outlined text-sm ${regenerate.isPending ? "animate-spin-slow" : ""}`}
						>
							sync
						</span>
						{regenerate.isPending ? "生成中…" : "重新生成"}
					</button>
				</div>
			</div>

			{/* 列表 */}
			<div className="glass-panel overflow-hidden rounded-[8px]">
				<div className="cockpit-header p-md font-label-mono text-label-mono text-primary-fixed tracking-widest">
					总结存档
				</div>
				{summaries.isLoading ? (
					<div className="flex justify-center p-10">
						<span className="material-symbols-outlined animate-spin text-primary-fixed">
							progress_activity
						</span>
					</div>
				) : null}
				{!summaries.isLoading && items.length === 0 ? (
					<div className="p-10 text-center font-label-mono text-label-mono text-on-surface-variant">
						没有总结
					</div>
				) : null}
				<div className="divide-y divide-outline-variant/10">
					{items.map((s) => (
						<div
							className="glow-row flex items-center justify-between p-md transition-all"
							key={s.id}
						>
							<span className="flex items-center gap-3">
								<span className="font-label-mono text-label-mono text-primary-fixed">
									{s.periodKey}
								</span>
								{s.edited ? (
									<span className="rounded-[2px] bg-tertiary-fixed/10 px-2 py-0.5 font-label-mono-sm text-label-mono-sm text-tertiary-fixed">
										已编辑
									</span>
								) : null}
							</span>
							<button
								className="flex items-center gap-1 font-label-mono text-label-mono text-on-surface-variant transition-colors hover:text-primary-fixed"
								onClick={() => openEditor(s.id, s.content)}
								type="button"
							>
								<span className="material-symbols-outlined text-sm">edit</span>
								编辑
							</button>
						</div>
					))}
				</div>
			</div>

			{/* 编辑器 */}
			{selectedId ? (
				<div className="glass-panel space-y-3 rounded-[8px] p-lg">
					<p className="font-label-mono-sm text-label-mono-sm text-primary-fixed uppercase tracking-widest">
						内容编辑器 (JSON)
					</p>
					<textarea
						aria-label="总结内容"
						className="custom-scrollbar h-64 w-full rounded-[2px] border border-outline-variant/30 bg-surface-container-lowest p-3 font-label-mono text-on-surface text-xs focus:border-primary-fixed focus:ring-0"
						onChange={(e) => setDraft(e.target.value)}
						value={draft}
					/>
					{parseError ? (
						<p className="font-label-mono text-error text-label-mono">
							{parseError}
						</p>
					) : null}
					<div className="flex gap-2">
						<button
							className="rounded-[2px] bg-primary-container px-4 py-2 font-bold font-label-mono text-label-mono text-on-primary-fixed transition-transform active:scale-95 disabled:opacity-50"
							disabled={update.isPending}
							onClick={handleSave}
							type="button"
						>
							保存
						</button>
						<button
							className="rounded-[2px] border border-outline-variant/30 px-4 py-2 font-label-mono text-label-mono text-on-surface transition-colors hover:bg-surface-variant"
							onClick={() => setSelectedId(null)}
							type="button"
						>
							取消
						</button>
					</div>
				</div>
			) : null}
		</NeuralAdminShell>
	);
}
