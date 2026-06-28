import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
	validateSearch: (search): { redirect?: string } => ({
		redirect:
			typeof search.redirect === "string" && search.redirect.startsWith("/")
				? search.redirect
				: undefined,
	}),
	component: LoginScreen,
});

function LoginScreen() {
	const [showSignIn, setShowSignIn] = useState(true);
	const { redirect } = Route.useSearch();
	const redirectTo = redirect ?? "/h5";

	return (
		<div className="relative flex min-h-svh items-center justify-center overflow-hidden px-margin-mobile py-10 text-foreground">
			<div
				className="pointer-events-none absolute inset-0 opacity-40"
				style={{
					background:
						"radial-gradient(circle at top, rgba(116, 245, 255, 0.12), transparent 34rem)",
				}}
			/>
			<div className="relative w-full max-w-[min(440px,calc(100vw-2rem))]">
				<div className="mb-8 text-center">
					<div className="font-bold text-2xl text-foreground">
						Personal Lift
					</div>
					<p className="mt-2 text-muted-foreground text-sm">
						登录后继续整理记录、待办和总结
					</p>
				</div>
				{showSignIn ? (
					<SignInForm
						onSwitchToSignUp={() => setShowSignIn(false)}
						redirectTo={redirectTo}
					/>
				) : (
					<SignUpForm
						onSwitchToSignIn={() => setShowSignIn(true)}
						redirectTo={redirectTo}
					/>
				)}
			</div>
		</div>
	);
}
