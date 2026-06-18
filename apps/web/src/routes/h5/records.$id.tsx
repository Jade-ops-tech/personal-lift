import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

import { categoryStyle } from "@/lib/neural";
import { trpc } from "@/utils/trpc";

// NEURAL_OS · 记录详情/编辑 —— 赛博视觉 + 真实 tRPC 数据（record.getById / update）。
export const Route = createFileRoute("/h5/records/$id")({
	component: RecordDetailScreen,
});

const CATEGORIES = ["学习", "工作", "生活", "想法", "待办", "其他"] as const;
type Category = (typeof CATEGORIES)[number];

const STATUSES = [
	{ value: "normal", label: "普通" },
	{ value: "pending", label: "待跟进" },
	{ value: "done", label: "已完成" },
	{ value: "archived", label: "已归档" },
] as const;
type Status = (typeof STATUSES)[number]["value"];

const FIELD_CLASS =
	"w-full rounded-[2px] border border-outline-variant/30 bg-surface-container px-3 py-2 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-fixed focus:ring-0";

function toLocalInput(iso: string | null): string {
	if (!iso) {
		return "";
	}
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | null {
	return local ? new Date(local).toISOString() : null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="space-y-1.5">
			<span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
				{label}
			</span>
			{children}
		</div>
	);
}

function DetailHeader() {
	return (
		<header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-outline-variant/10 border-b bg-surface/10 px-margin-mobile shadow-[0_0_15px_rgba(0,242,255,0.1)] backdrop-blur-xl md:px-margin-desktop">
			<Link
				className="flex items-center gap-2 text-on-surface-variant transition-colors hover:text-primary-fixed"
				to="/h5"
			>
				<span className="material-symbols-outlined">arrow_back</span>
				<span className="font-label-mono text-label-mono">返回记录流</span>
			</Link>
			<span className="font-bold font-headline-md text-headline-md text-primary-fixed tracking-tighter drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">
				NEURAL_OS
			</span>
		</header>
	);
}

function RecordDetailScreen() {
	const { id } = Route.useParams();
	const detail = useQuery(trpc.record.getById.queryOptions({ id }));
	const updateMutation = useMutation(
		trpc.record.update.mutationOptions({
			onSuccess: () => detail.refetch(),
		})
	);

	const [category, setCategory] = useState<Category>("其他");
	const [status, setStatus] = useState<Status>("normal");
	const [isTodo, setIsTodo] = useState(false);
	const [tagsText, setTagsText] = useState("");
	const [plannedTime, setPlannedTime] = useState("");
	const [deadline, setDeadline] = useState("");

	const data = detail.data;
	useEffect(() => {
		if (!data) {
			return;
		}
		setCategory(data.category);
		setStatus(data.status);
		setIsTodo(data.isTodo);
		setTagsText(data.recordTags.map((rt) => rt.tag.name).join(", "));
		setPlannedTime(toLocalInput(data.plannedTime));
		setDeadline(toLocalInput(data.deadline));
	}, [data]);

	const handleSave = () => {
		updateMutation.mutate({
			id,
			category,
			status,
			isTodo,
			tags: tagsText
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
			plannedTime: toIso(plannedTime),
			deadline: toIso(deadline),
		});
	};

	const style = categoryStyle(category);

	return (
		<div className="min-h-screen font-body-md text-on-surface">
			<DetailHeader />
			<main className="mx-auto max-w-2xl px-margin-mobile pt-24 pb-16">
				{detail.isLoading ? (
					<div className="flex justify-center py-20">
						<span className="material-symbols-outlined animate-spin text-primary-fixed">
							progress_activity
						</span>
					</div>
				) : null}

				{detail.isLoading || data ? null : (
					<div className="glass-panel rounded-[8px] p-10 text-center font-label-mono text-label-mono text-on-surface-variant">
						记录不存在
					</div>
				)}

				{data ? (
					<div className="space-y-6">
						{/* 内容卡 */}
						<div className={`${style.neon} glass-panel rounded-[8px] p-5`}>
							<div className="mb-3 flex items-center gap-2">
								<span
									className={`material-symbols-outlined text-[18px] ${style.text}`}
								>
									{style.icon}
								</span>
								<span
									className={`font-label-mono text-label-mono ${style.text}`}
								>
									{category}
								</span>
							</div>
							<p className="text-body-lg text-on-surface leading-relaxed">
								{data.content}
							</p>
						</div>

						{/* 编辑表单 */}
						<div className="glass-panel space-y-5 rounded-[8px] p-5">
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<Field label="分类">
									<select
										aria-label="分类"
										className={FIELD_CLASS}
										onChange={(e) => setCategory(e.target.value as Category)}
										value={category}
									>
										{CATEGORIES.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
								</Field>
								<Field label="状态">
									<select
										aria-label="状态"
										className={FIELD_CLASS}
										onChange={(e) => setStatus(e.target.value as Status)}
										value={status}
									>
										{STATUSES.map((s) => (
											<option key={s.value} value={s.value}>
												{s.label}
											</option>
										))}
									</select>
								</Field>
							</div>

							<label className="flex items-center gap-2 font-label-mono text-label-mono text-on-surface">
								<input
									checked={isTodo}
									className="h-4 w-4 rounded border-outline-variant/30 bg-surface text-primary-fixed focus:ring-primary-fixed"
									onChange={(e) => setIsTodo(e.target.checked)}
									type="checkbox"
								/>
								标记为待办
							</label>

							<Field label="标签（逗号分隔）">
								<input
									aria-label="标签"
									className={FIELD_CLASS}
									onChange={(e) => setTagsText(e.target.value)}
									value={tagsText}
								/>
							</Field>

							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<Field label="计划时间">
									<input
										aria-label="计划时间"
										className={FIELD_CLASS}
										onChange={(e) => setPlannedTime(e.target.value)}
										type="datetime-local"
										value={plannedTime}
									/>
								</Field>
								<Field label="截止时间">
									<input
										aria-label="截止时间"
										className={FIELD_CLASS}
										onChange={(e) => setDeadline(e.target.value)}
										type="datetime-local"
										value={deadline}
									/>
								</Field>
							</div>

							{data.aiResult ? (
								<Field label="AI 识别结果">
									<p className="rounded-[2px] border border-outline-variant/20 bg-surface-container-low p-3 font-label-mono text-label-mono text-on-surface-variant">
										情绪 {data.aiResult.emotion ?? "—"} · 概括{" "}
										{data.aiResult.summary}
									</p>
								</Field>
							) : null}

							<button
								className="w-full rounded-[4px] bg-primary-container py-3 font-bold font-label-mono text-label-mono text-on-primary-fixed shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-transform active:scale-95 disabled:opacity-50"
								disabled={updateMutation.isPending}
								onClick={handleSave}
								type="button"
							>
								{updateMutation.isPending ? "保存中…" : "保存"}
							</button>
						</div>
					</div>
				) : null}
			</main>
		</div>
	);
}
