import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV_ITEMS = [
	{ icon: "dynamic_feed", label: "动态", title: "记录流", to: "/h5" },
	{ icon: "grid_view", label: "待办", title: "任务矩阵", to: "/h5/todos" },
	{
		icon: "monitoring",
		label: "总结",
		title: "总结回顾",
		to: "/h5/summary",
	},
] as const;

const activeNavClass =
	"flex items-center gap-3 border-primary-fixed border-l-2 bg-primary-container/10 px-6 py-3 text-primary-fixed transition-all duration-300";
const inactiveNavClass =
	"flex items-center gap-3 px-6 py-3 text-on-surface-variant opacity-60 transition-all duration-300 hover:bg-[#e1fdff]/5 hover:opacity-100";

const activeBottomClass =
	"flex flex-col items-center gap-1 font-bold text-primary-fixed";
const inactiveBottomClass =
	"flex flex-col items-center gap-1 text-on-surface-variant opacity-60";

export function H5AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen overflow-x-hidden bg-surface-container-lowest font-body-md text-on-surface selection:bg-primary-container selection:text-on-primary-container">
			<div
				className="pointer-events-none fixed inset-0 opacity-[0.04]"
				style={{
					backgroundImage: "radial-gradient(#00dbe7 0.5px, transparent 0.5px)",
					backgroundSize: "20px 20px",
				}}
			/>

			<header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-outline-variant/10 border-b bg-surface/10 px-margin-mobile shadow-[0_0_15px_rgba(0,242,255,0.1)] backdrop-blur-xl md:px-margin-desktop">
				<Link
					className="font-bold font-headline-md text-headline-md text-primary-fixed tracking-tighter drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]"
					to="/h5"
				>
					NEURAL_OS
				</Link>
				<div className="flex items-center gap-3">
					<Link
						className="rounded-full p-2 text-on-surface-variant transition-colors duration-300 hover:bg-[#e1fdff]/10 hover:text-primary-fixed"
						to="/h5/summary"
					>
						<span className="material-symbols-outlined">analytics</span>
					</Link>
				</div>
			</header>

			<aside className="fixed top-0 left-0 z-40 hidden h-full w-64 flex-col border-outline-variant/10 border-r bg-surface-container-lowest/80 pt-20 pb-8 shadow-[5px_0_15px_rgba(0,242,255,0.05)] backdrop-blur-xl md:flex">
				<div className="mb-8 px-6">
					<div className="font-bold font-headline-md text-headline-md text-primary-fixed">
						智能中心
					</div>
					<div className="font-label-mono text-[10px] text-on-surface-variant opacity-60">
						v4.0 运行中
					</div>
				</div>
				<nav className="flex flex-1 flex-col">
					{NAV_ITEMS.map((item) => (
						<Link
							activeOptions={{ exact: item.to === "/h5" }}
							activeProps={{ className: activeNavClass }}
							className={inactiveNavClass}
							key={item.to}
							to={item.to}
						>
							<span className="material-symbols-outlined">{item.icon}</span>
							<span className="font-label-mono text-label-mono">
								{item.title}
							</span>
						</Link>
					))}
				</nav>
			</aside>

			<main className="min-h-screen px-margin-mobile pt-24 pb-24 md:pr-margin-desktop md:pl-72">
				{children}
			</main>

			<nav className="glass-panel fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t-0 px-4 md:hidden">
				{NAV_ITEMS.map((item) => (
					<Link
						activeOptions={{ exact: item.to === "/h5" }}
						activeProps={{ className: activeBottomClass }}
						className={inactiveBottomClass}
						key={item.to}
						to={item.to}
					>
						<span className="material-symbols-outlined">{item.icon}</span>
						<span className="font-label-mono text-[10px]">{item.label}</span>
					</Link>
				))}
			</nav>
		</div>
	);
}
