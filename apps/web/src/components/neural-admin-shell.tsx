import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

// NEURAL_OS 后台共用外壳：固定顶栏 + 侧边导航（移动端隐藏）。
// 供 admin/tags、admin/summaries 等表单型后台页复用，保持视觉一致。

type AdminNavKey = "records" | "todos" | "tags" | "summaries";

const NAV: { key: AdminNavKey; icon: string; label: string; to: string }[] = [
	{
		key: "records",
		icon: "grid_view",
		label: "记录管理",
		to: "/admin/records",
	},
	{ key: "todos", icon: "checklist", label: "待办管理", to: "/admin/todos" },
	{ key: "tags", icon: "sell", label: "标签管理", to: "/admin/tags" },
	{
		key: "summaries",
		icon: "summarize",
		label: "总结管理",
		to: "/admin/summaries",
	},
];

export function NeuralAdminShell({
	active,
	children,
}: {
	active: AdminNavKey;
	children: ReactNode;
}) {
	return (
		<div className="min-h-screen overflow-x-hidden font-body-md text-on-surface">
			{/* 顶栏 */}
			<header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-outline-variant/10 border-b bg-surface/10 px-margin-desktop shadow-[0_0_15px_rgba(0,242,255,0.1)] backdrop-blur-xl">
				<div className="flex items-center gap-6">
					<span className="font-bold font-headline-md text-headline-md text-primary-fixed tracking-tighter drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">
						NEURAL_OS
					</span>
				</div>
				<button
					className="relative rounded-full p-2 transition-colors duration-300 hover:bg-[#e1fdff]/10"
					type="button"
				>
					<span className="material-symbols-outlined text-primary-fixed">
						notifications
					</span>
					<span className="absolute top-2 right-2 h-2 w-2 animate-pulse rounded-full bg-primary-container" />
				</button>
			</header>

			{/* 侧边导航 */}
			<aside className="fixed top-0 left-0 z-40 hidden h-full w-64 flex-col border-outline-variant/10 border-r bg-surface-container-lowest/80 pt-20 pb-8 shadow-[5px_0_15px_rgba(0,242,255,0.05)] backdrop-blur-xl md:flex">
				<div className="mb-8 px-6">
					<h2 className="font-label-mono text-label-mono text-primary-fixed uppercase tracking-widest opacity-80">
						智能中枢
					</h2>
					<p className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
						V4.0 运行中
					</p>
				</div>
				<nav className="flex-1 space-y-1">
					{NAV.map((item) => (
						<Link
							className={
								item.key === active
									? "flex items-center gap-3 border-primary-fixed border-l-2 bg-primary-container/10 px-6 py-3 text-primary-fixed"
									: "flex items-center gap-3 px-6 py-3 text-on-surface-variant opacity-60 transition-all duration-300 hover:bg-[#e1fdff]/5 hover:opacity-100"
							}
							key={item.key}
							to={item.to}
						>
							<span className="material-symbols-outlined">{item.icon}</span>
							<span className="font-label-mono text-label-mono">
								{item.label}
							</span>
						</Link>
					))}
				</nav>
			</aside>

			{/* 主内容 */}
			<main className="min-h-screen px-margin-mobile pt-24 pb-12 md:pr-margin-desktop md:pl-64">
				<div className="mx-auto max-w-[1100px] space-y-lg">{children}</div>
			</main>

			{/* 环境网格点 */}
			<div
				className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.03]"
				style={{
					backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
					backgroundSize: "20px 20px",
				}}
			/>
		</div>
	);
}
