import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardScreen,
});

function DashboardScreen() {
	const { session } = Route.useRouteContext();
	const privateData = useQuery(trpc.privateData.queryOptions());

	return (
		<div className="mx-auto w-full max-w-[1100px] px-margin-mobile py-10 md:px-margin-desktop">
			<span className="font-label-mono text-label-mono text-primary-fixed uppercase tracking-[0.3em]">
				控制台
			</span>
			<h1 className="mt-2 mb-6 font-bold font-headline-md text-headline-lg text-primary-fixed-dim">
				欢迎，{session.data?.user.name}
			</h1>
			<div className="glass-panel rounded-[8px] p-5">
				<p className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
					接口返回
				</p>
				<p className="mt-1 font-headline-md text-headline-md text-on-surface">
					{privateData.data?.message ?? "—"}
				</p>
			</div>
		</div>
	);
}
