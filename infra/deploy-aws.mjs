import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const TRAILING_SLASH_REGEX = /\/$/;
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appName = process.env.APP_NAME ?? "personal-lift";
const functionName = process.env.LAMBDA_FUNCTION_NAME ?? `${appName}-api`;
const roleName = process.env.LAMBDA_ROLE_NAME ?? `${appName}-lambda-role`;
const distributionComment = `${appName} web`;
const buildZipPath = resolve(rootDir, "apps/server/dist-lambda/function.zip");
const deployStatePath = resolve(rootDir, "infra/.deploy.json");

const run = (command, args, options = {}) => {
	const result = spawnSync(command, args, {
		cwd: rootDir,
		env: { ...process.env, ...(options.env ?? {}) },
		encoding: "utf8",
		stdio: options.capture ? "pipe" : "inherit",
	});

	if (result.status !== 0) {
		const stderr = result.stderr ? `\n${result.stderr}` : "";
		throw new Error(`${command} ${args.join(" ")} failed${stderr}`);
	}

	return result.stdout?.trim() ?? "";
};

const aws = (args, options = {}) =>
	run("aws", args, { ...options, capture: options.capture ?? true });

const awsJson = (args) => {
	const output = aws([...args, "--output", "json"]);
	return output ? JSON.parse(output) : null;
};

const awsMaybeJson = (args) => {
	const result = spawnSync("aws", [...args, "--output", "json"], {
		cwd: rootDir,
		encoding: "utf8",
		stdio: "pipe",
	});

	if (result.status !== 0) {
		return null;
	}

	return result.stdout ? JSON.parse(result.stdout) : null;
};

const getRegion = () =>
	process.env.AWS_REGION ??
	process.env.AWS_DEFAULT_REGION ??
	run("aws", ["configure", "get", "region"], { capture: true }) ??
	"us-west-2";

const readEnv = () => {
	const localEnvPath = resolve(rootDir, "apps/server/.env");
	const localEnv = existsSync(localEnvPath)
		? dotenv.parse(readFileSync(localEnvPath))
		: {};

	return {
		...localEnv,
		...process.env,
	};
};

const requiredEnv = (env, key) => {
	const value = env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
};

const jsonArg = (value) => JSON.stringify(value);

const ensureLambdaRole = async () => {
	const existing = awsMaybeJson(["iam", "get-role", "--role-name", roleName]);
	if (existing?.Role?.Arn) {
		return existing.Role.Arn;
	}

	console.log(`Creating IAM role: ${roleName}`);
	awsJson([
		"iam",
		"create-role",
		"--role-name",
		roleName,
		"--assume-role-policy-document",
		jsonArg({
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Principal: { Service: "lambda.amazonaws.com" },
					Action: "sts:AssumeRole",
				},
			],
		}),
	]);

	aws([
		"iam",
		"attach-role-policy",
		"--role-name",
		roleName,
		"--policy-arn",
		"arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
	]);

	const role = awsJson(["iam", "get-role", "--role-name", roleName]);
	console.log("Waiting for IAM role propagation...");
	await new Promise((resolveWait) => setTimeout(resolveWait, 12_000));
	return role.Role.Arn;
};

const buildLambdaBundle = () => {
	console.log("Building Lambda bundle...");
	run("pnpm", ["--filter", "server", "build:lambda"]);
	run("zip", [
		"-j",
		"-q",
		buildZipPath,
		resolve(rootDir, "apps/server/dist-lambda/index.js"),
		resolve(rootDir, "apps/server/dist-lambda/package.json"),
	]);
};

const lambdaEnvironment = ({ env, apiUrl, webUrl }) => ({
	Variables: {
		DATABASE_URL: requiredEnv(env, "DATABASE_URL"),
		BETTER_AUTH_SECRET: requiredEnv(env, "BETTER_AUTH_SECRET"),
		BETTER_AUTH_URL: apiUrl,
		CORS_ORIGIN: webUrl,
		NODE_ENV: "production",
	},
});

const upsertLambda = ({ roleArn, env, apiUrl, webUrl }) => {
	const environment = lambdaEnvironment({ env, apiUrl, webUrl });
	const existing = awsMaybeJson([
		"lambda",
		"get-function",
		"--function-name",
		functionName,
	]);

	if (existing?.Configuration?.FunctionArn) {
		console.log(`Updating Lambda function: ${functionName}`);
		aws([
			"lambda",
			"update-function-code",
			"--function-name",
			functionName,
			"--zip-file",
			`fileb://${buildZipPath}`,
		]);
		aws([
			"lambda",
			"wait",
			"function-updated",
			"--function-name",
			functionName,
		]);
		aws([
			"lambda",
			"update-function-configuration",
			"--function-name",
			functionName,
			"--runtime",
			"nodejs20.x",
			"--handler",
			"index.handler",
			"--timeout",
			"30",
			"--memory-size",
			"512",
			"--environment",
			jsonArg(environment),
		]);
		aws([
			"lambda",
			"wait",
			"function-updated",
			"--function-name",
			functionName,
		]);
		return;
	}

	console.log(`Creating Lambda function: ${functionName}`);
	aws([
		"lambda",
		"create-function",
		"--function-name",
		functionName,
		"--runtime",
		"nodejs20.x",
		"--role",
		roleArn,
		"--handler",
		"index.handler",
		"--timeout",
		"30",
		"--memory-size",
		"512",
		"--zip-file",
		`fileb://${buildZipPath}`,
		"--environment",
		jsonArg(environment),
	]);
	aws(["lambda", "wait", "function-active", "--function-name", functionName]);
};

const ensureFunctionUrl = () => {
	const existing = awsMaybeJson([
		"lambda",
		"get-function-url-config",
		"--function-name",
		functionName,
	]);

	const urlConfig =
		existing ??
		awsJson([
			"lambda",
			"create-function-url-config",
			"--function-name",
			functionName,
			"--auth-type",
			"NONE",
		]);

	const permission = spawnSync(
		"aws",
		[
			"lambda",
			"add-permission",
			"--function-name",
			functionName,
			"--statement-id",
			"FunctionUrlAllowPublicAccess",
			"--action",
			"lambda:InvokeFunctionUrl",
			"--principal",
			"*",
			"--function-url-auth-type",
			"NONE",
		],
		{ cwd: rootDir, encoding: "utf8", stdio: "pipe" }
	);

	if (
		permission.status !== 0 &&
		!permission.stderr.includes("ResourceConflictException")
	) {
		throw new Error(permission.stderr);
	}

	return urlConfig.FunctionUrl.replace(TRAILING_SLASH_REGEX, "");
};

const ensureBucket = ({ bucketName, region }) => {
	if (!awsMaybeJson(["s3api", "head-bucket", "--bucket", bucketName])) {
		console.log(`Creating S3 bucket: ${bucketName}`);
		const args = [
			"s3api",
			"create-bucket",
			"--bucket",
			bucketName,
			"--region",
			region,
		];
		if (region !== "us-east-1") {
			args.push(
				"--create-bucket-configuration",
				`LocationConstraint=${region}`
			);
		}
		aws(args);
	}

	aws([
		"s3api",
		"put-public-access-block",
		"--bucket",
		bucketName,
		"--public-access-block-configuration",
		"BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false",
	]);
	aws([
		"s3api",
		"put-bucket-website",
		"--bucket",
		bucketName,
		"--website-configuration",
		jsonArg({
			IndexDocument: { Suffix: "index.html" },
			ErrorDocument: { Key: "index.html" },
		}),
	]);
	aws([
		"s3api",
		"put-bucket-policy",
		"--bucket",
		bucketName,
		"--policy",
		jsonArg({
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "PublicReadGetObject",
					Effect: "Allow",
					Principal: "*",
					Action: "s3:GetObject",
					Resource: `arn:aws:s3:::${bucketName}/*`,
				},
			],
		}),
	]);
};

const websiteEndpoint = ({ bucketName, region }) =>
	region === "us-east-1"
		? `${bucketName}.s3-website-us-east-1.amazonaws.com`
		: `${bucketName}.s3-website-${region}.amazonaws.com`;

const findDistribution = () => {
	const distributions = awsJson(["cloudfront", "list-distributions"]);
	const items = distributions.DistributionList?.Items ?? [];
	return items.find((item) => item.Comment === distributionComment) ?? null;
};

const createDistribution = ({ originDomain }) => {
	console.log("Creating CloudFront distribution...");
	const distribution = awsJson([
		"cloudfront",
		"create-distribution",
		"--distribution-config",
		jsonArg({
			CallerReference: `${appName}-${Date.now()}`,
			Comment: distributionComment,
			Enabled: true,
			DefaultRootObject: "index.html",
			Origins: {
				Quantity: 1,
				Items: [
					{
						Id: "s3-website-origin",
						DomainName: originDomain,
						CustomOriginConfig: {
							HTTPPort: 80,
							HTTPSPort: 443,
							OriginProtocolPolicy: "http-only",
							OriginSslProtocols: {
								Quantity: 1,
								Items: ["TLSv1.2"],
							},
						},
					},
				],
			},
			DefaultCacheBehavior: {
				TargetOriginId: "s3-website-origin",
				ViewerProtocolPolicy: "redirect-to-https",
				AllowedMethods: {
					Quantity: 2,
					Items: ["GET", "HEAD"],
					CachedMethods: {
						Quantity: 2,
						Items: ["GET", "HEAD"],
					},
				},
				ForwardedValues: {
					QueryString: false,
					Cookies: { Forward: "none" },
				},
				Compress: true,
				MinTTL: 0,
				DefaultTTL: 3600,
				MaxTTL: 86_400,
			},
			CustomErrorResponses: {
				Quantity: 2,
				Items: [
					{
						ErrorCode: 403,
						ResponsePagePath: "/index.html",
						ResponseCode: "200",
						ErrorCachingMinTTL: 0,
					},
					{
						ErrorCode: 404,
						ResponsePagePath: "/index.html",
						ResponseCode: "200",
						ErrorCachingMinTTL: 0,
					},
				],
			},
			PriceClass: "PriceClass_100",
		}),
	]);
	return distribution.Distribution;
};

const ensureDistribution = ({ originDomain }) => {
	const existing = findDistribution();
	if (existing) {
		return existing;
	}
	return createDistribution({ originDomain });
};

const deployWeb = ({ apiUrl, bucketName, distributionId }) => {
	console.log("Building web app...");
	run("pnpm", ["--filter", "web", "build"], {
		env: { VITE_SERVER_URL: apiUrl },
	});

	console.log(`Syncing web assets to s3://${bucketName}`);
	aws(
		[
			"s3",
			"sync",
			resolve(rootDir, "apps/web/dist"),
			`s3://${bucketName}`,
			"--delete",
		],
		{
			capture: false,
		}
	);

	console.log("Creating CloudFront invalidation...");
	aws([
		"cloudfront",
		"create-invalidation",
		"--distribution-id",
		distributionId,
		"--paths",
		"/*",
	]);
};

const main = async () => {
	const env = readEnv();
	const region = getRegion();
	const identity = awsJson(["sts", "get-caller-identity"]);
	const accountId = identity.Account;
	const bucketName =
		process.env.WEB_BUCKET_NAME ?? `${appName}-web-${accountId}-${region}`;
	const roleArn = await ensureLambdaRole();

	buildLambdaBundle();

	upsertLambda({
		roleArn,
		env,
		apiUrl: "https://example.com",
		webUrl: "https://example.com",
	});

	const apiUrl = ensureFunctionUrl();
	ensureBucket({ bucketName, region });

	const originDomain = websiteEndpoint({ bucketName, region });
	const distribution = ensureDistribution({ originDomain });
	const webUrl = `https://${distribution.DomainName}`;

	upsertLambda({ roleArn, env, apiUrl, webUrl });
	deployWeb({ apiUrl, bucketName, distributionId: distribution.Id });

	const state = {
		region,
		accountId,
		functionName,
		apiUrl,
		bucketName,
		distributionId: distribution.Id,
		webUrl,
	};

	mkdirSync(dirname(deployStatePath), { recursive: true });
	writeFileSync(deployStatePath, `${JSON.stringify(state, null, 2)}\n`);

	console.log("\nDeploy complete");
	console.log(`API URL: ${apiUrl}`);
	console.log(`Web URL: ${webUrl}`);
	console.log(`State: ${deployStatePath}`);
};

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
