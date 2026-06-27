import { Button } from "@personal-lift/ui/components/button";
import { Input } from "@personal-lift/ui/components/input";
import { Label } from "@personal-lift/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
						toast.success("登录成功");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("请输入有效的邮箱地址"),
				password: z.string().min(8, "密码至少需要 8 个字符"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="w-full rounded-[8px] border border-border bg-card/95 p-6 shadow-black/20 shadow-xl backdrop-blur md:p-8">
			<div className="mb-8 text-center">
				<h1 className="font-bold text-2xl text-card-foreground">欢迎回来</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					使用你的邮箱和密码登录
				</p>
			</div>

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>邮箱</Label>
								<Input
									className="h-11 rounded-[6px] px-3 text-sm"
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
									className="h-11 rounded-[6px] px-3 text-sm"
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
							className="h-11 w-full rounded-[6px] font-medium text-sm"
							disabled={!canSubmit || isSubmitting}
							type="submit"
						>
							{isSubmitting ? "登录中..." : "登录"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-6 text-center">
				<Button
					className="h-auto text-muted-foreground text-sm hover:text-foreground"
					onClick={onSwitchToSignUp}
					type="button"
					variant="link"
				>
					还没有账号？去注册
				</Button>
			</div>
		</div>
	);
}
