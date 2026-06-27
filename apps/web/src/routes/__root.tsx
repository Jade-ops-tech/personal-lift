import { Toaster } from "@personal-lift/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
	queryClient: QueryClient;
	trpc: typeof trpc;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "Personal Lift",
			},
			{
				name: "description",
				content: "Personal Lift 是个人记录与待办整理工具",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

// NEURAL_OS 还原页（/h5、/admin）自带固定顶栏/侧栏/底栏，需独占整屏，
// 因此跳过全局 Header 与 grid 外壳；其余路由保留原有布局。
const FULL_BLEED_PREFIXES = ["/h5", "/admin", "/login"];

function RootComponent() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isFullBleed = FULL_BLEED_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
	const showDevtools = import.meta.env.DEV && !isFullBleed;

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				{isFullBleed ? (
					<Outlet />
				) : (
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						<Outlet />
					</div>
				)}
				<Toaster richColors />
			</ThemeProvider>
			{showDevtools ? (
				<>
					<TanStackRouterDevtools position="bottom-left" />
					<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
				</>
			) : null}
		</>
	);
}
