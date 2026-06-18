import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { NeuralAdminShell } from "@/components/neural-admin-shell";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 后台标签管理 —— 赛博视觉 + 真实 tRPC 数据（admin.tags）。
export const Route = createFileRoute("/admin/tags")({
	component: AdminTagsScreen,
});

const SELECT_CLASS =
	"rounded-[2px] border border-outline-variant/30 bg-surface-container px-3 py-1.5 font-label-mono text-label-mono text-on-surface focus:border-primary-fixed focus:ring-primary-fixed";

function AdminTagsScreen() {
	const [newTag, setNewTag] = useState("");
	const [source, setSource] = useState("");
	const [target, setTarget] = useState("");

	const tags = useQuery(trpc.admin.tags.list.queryOptions());
	const refetch = () => {
		tags.refetch();
	};
	const createTag = useMutation(
		trpc.admin.tags.create.mutationOptions({
			onSuccess: () => {
				refetch();
				setNewTag("");
			},
		})
	);
	const mergeTag = useMutation(
		trpc.admin.tags.merge.mutationOptions({ onSuccess: refetch })
	);
	const removeTag = useMutation(
		trpc.admin.tags.remove.mutationOptions({ onSuccess: refetch })
	);

	const options = tags.data ?? [];
	const canMerge = Boolean(source && target && source !== target);

	return (
		<NeuralAdminShell active="tags">
			<div>
				<h1 className="mb-1 font-headline-lg text-headline-lg text-primary-fixed">
					标签管理
				</h1>
				<p className="font-label-mono text-label-mono text-on-surface-variant">
					标签总数: {options.length}
				</p>
			</div>

			{/* 新增 + 合并 */}
			<div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
				<div className="glass-panel rounded-[8px] p-lg">
					<p className="mb-4 font-label-mono-sm text-label-mono-sm text-primary-fixed uppercase tracking-widest">
						注入新标签
					</p>
					<div className="flex items-center gap-2">
						<input
							className="flex-1 rounded-[2px] border border-outline-variant/30 bg-surface-container px-3 py-2 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-fixed focus:ring-0"
							onChange={(e) => setNewTag(e.target.value)}
							placeholder="新增标签…"
							value={newTag}
						/>
						<button
							className="rounded-[2px] bg-primary-container px-4 py-2 font-bold font-label-mono text-label-mono text-on-primary-fixed transition-transform active:scale-95 disabled:opacity-50"
							disabled={!newTag.trim() || createTag.isPending}
							onClick={() => createTag.mutate({ name: newTag.trim() })}
							type="button"
						>
							新增
						</button>
					</div>
				</div>

				<div className="glass-panel rounded-[8px] p-lg">
					<p className="mb-4 font-label-mono-sm text-label-mono-sm text-primary-fixed uppercase tracking-widest">
						合并节点
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<select
							aria-label="源标签"
							className={SELECT_CLASS}
							onChange={(e) => setSource(e.target.value)}
							value={source}
						>
							<option value="">源标签</option>
							{options.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
						<span className="material-symbols-outlined text-primary-fixed">
							arrow_forward
						</span>
						<select
							aria-label="目标标签"
							className={SELECT_CLASS}
							onChange={(e) => setTarget(e.target.value)}
							value={target}
						>
							<option value="">目标标签</option>
							{options.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
						<button
							className="rounded-[2px] border border-outline-variant/30 px-4 py-1.5 font-label-mono text-label-mono text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
							disabled={!canMerge || mergeTag.isPending}
							onClick={() =>
								mergeTag.mutate({ sourceId: source, targetId: target })
							}
							type="button"
						>
							合并
						</button>
					</div>
				</div>
			</div>

			{/* 标签列表 */}
			<div className="glass-panel overflow-hidden rounded-[8px]">
				<div className="cockpit-header p-md font-label-mono text-label-mono text-primary-fixed tracking-widest">
					标签矩阵
				</div>
				{tags.isLoading ? (
					<div className="flex justify-center p-10">
						<span className="material-symbols-outlined animate-spin text-primary-fixed">
							progress_activity
						</span>
					</div>
				) : null}
				{!tags.isLoading && options.length === 0 ? (
					<div className="p-10 text-center font-label-mono text-label-mono text-on-surface-variant">
						没有标签
					</div>
				) : null}
				<div className="divide-y divide-outline-variant/10">
					{options.map((t) => (
						<div
							className="glow-row flex items-center justify-between p-md transition-all"
							key={t.id}
						>
							<span className="flex items-center gap-2">
								<span className="font-body-md text-primary-fixed">
									#{t.name}
								</span>
								<span className="font-label-mono text-label-mono-sm text-on-surface-variant">
									{t.count} 次引用
								</span>
							</span>
							<button
								aria-label="删除标签"
								className="text-on-surface-variant transition-colors hover:text-error disabled:opacity-50"
								disabled={removeTag.isPending}
								onClick={() => removeTag.mutate({ id: t.id })}
								type="button"
							>
								<span className="material-symbols-outlined">delete</span>
							</button>
						</div>
					))}
				</div>
			</div>
		</NeuralAdminShell>
	);
}
