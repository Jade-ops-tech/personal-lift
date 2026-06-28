import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCachedSession } from "@/lib/auth-client";

export const Route = createFileRoute("/h5")({
	beforeLoad: async ({ location }) => {
		const session = await getCachedSession();
		if (!session.data) {
			throw redirect({
				search: { redirect: location.href },
				to: "/login",
			});
		}
		return { session };
	},
	component: H5Layout,
});

function H5Layout() {
	return <Outlet />;
}
