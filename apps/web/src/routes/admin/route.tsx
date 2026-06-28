import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCachedSession } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
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
	component: AdminLayout,
});

// NEURAL_OS 后台页自带固定顶栏/侧栏，此处仅做鉴权守卫与 Outlet 透传。
function AdminLayout() {
	return <Outlet />;
}
