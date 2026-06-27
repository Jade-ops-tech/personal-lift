import { Link } from "@tanstack/react-router";

import UserMenu from "./user-menu";

const LINKS = [
	{ to: "/h5", label: "H5" },
	{ to: "/admin/records", label: "后台" },
] as const;

export default function Header() {
	return (
		<header className="flex items-center justify-between border-outline-variant/10 border-b bg-surface/10 px-margin-mobile py-3 shadow-[0_0_15px_rgba(0,242,255,0.08)] backdrop-blur-xl md:px-margin-desktop">
			<div className="flex items-center gap-6">
				<Link
					className="font-bold font-headline-md text-headline-md text-primary-fixed tracking-tighter drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]"
					to="/"
				>
					NEURAL_OS
				</Link>
				<nav className="hidden gap-1 md:flex">
					{LINKS.map(({ to, label }) => (
						<Link
							activeProps={{
								className:
									"rounded-[2px] bg-primary-container/10 px-3 py-1 font-label-mono text-label-mono text-primary-fixed",
							}}
							className="rounded-[2px] px-3 py-1 font-label-mono text-label-mono text-on-surface-variant transition-colors hover:bg-[#e1fdff]/10 hover:text-primary-fixed"
							key={to}
							to={to}
						>
							{label}
						</Link>
					))}
				</nav>
			</div>
			<UserMenu />
		</header>
	);
}
