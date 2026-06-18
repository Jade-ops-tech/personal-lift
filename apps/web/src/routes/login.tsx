import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
	component: LoginScreen,
});

function LoginScreen() {
	const [showSignIn, setShowSignIn] = useState(false);

	return (
		<div className="relative flex min-h-svh items-center justify-center overflow-hidden px-margin-mobile py-12 font-body-md text-on-surface">
			{/* 网格点阵背景 */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.05]"
				style={{
					backgroundImage: "radial-gradient(#00dbe7 0.5px, transparent 0.5px)",
					backgroundSize: "20px 20px",
				}}
			/>
			<div className="relative w-full max-w-md">
				<div className="mb-8 text-center">
					<div className="font-bold font-headline-md text-2xl text-primary-fixed tracking-tighter drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">
						NEURAL_OS
					</div>
					<p className="mt-1 font-label-mono text-label-mono text-on-surface-variant uppercase tracking-[0.2em]">
						神经接入认证
					</p>
				</div>
				{showSignIn ? (
					<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
				) : (
					<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
				)}
			</div>
		</div>
	);
}
