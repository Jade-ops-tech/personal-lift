import { Button } from "@personal-lift/ui/components/button";
import { Input } from "@personal-lift/ui/components/input";
import { Label } from "@personal-lift/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
						toast.success("注册成功");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "名称至少需要 2 个字符"),
				email: z.email("请输入有效的邮箱地址"),
				password: z.string().min(8, "密码至少需要 8 个字符"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="glass-panel w-full rounded-[8px] p-8">
			<h1 className="mb-8 text-center font-bold font-headline-md text-headline-lg text-primary-fixed">
				创建账号
			</h1>

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>名称</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										className="font-label-mono text-error text-label-mono"
										key={error?.message}
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>邮箱</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="email"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										className="font-label-mono text-error text-label-mono"
										key={error?.message}
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>密码</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="password"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										className="font-label-mono text-error text-label-mono"
										key={error?.message}
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							className="w-full bg-primary-container font-bold font-label-mono text-on-primary-fixed shadow-[0_0_15px_rgba(0,242,255,0.3)] hover:brightness-110"
							disabled={!canSubmit || isSubmitting}
							type="submit"
						>
							{isSubmitting ? "注册中..." : "注册"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-6 text-center">
				<Button
					className="font-label-mono text-label-mono text-primary-fixed hover:text-primary-fixed-dim"
					onClick={onSwitchToSignIn}
					variant="link"
				>
					已有账号？去登录
				</Button>
			</div>
		</div>
	);
}
