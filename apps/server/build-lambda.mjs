import { writeFileSync } from "node:fs";
import { build } from "esbuild";

// 把 Lambda 入口及其全部依赖（含 workspace 包源码）打成单个自包含 CJS 文件，
// 输出到 dist-lambda/，供 SAM 直接 zip 上传。
const OUT_DIR = "dist-lambda";

await build({
	entryPoints: ["src/lambda.ts"],
	bundle: true,
	platform: "node",
	target: "node20",
	format: "cjs",
	outfile: `${OUT_DIR}/index.js`,
	// pg 的可选原生加速包，运行时 try/catch 引用，打包时排除即可。
	external: ["pg-native"],
	logLevel: "info",
	minify: true,
	sourcemap: false,
});

// 父级 package.json 是 type:module；在产物目录放一份 commonjs 声明，
// 让 Lambda 把 index.js 当作 CJS 加载（handler = index.handler）。
writeFileSync(
	`${OUT_DIR}/package.json`,
	`${JSON.stringify({ type: "commonjs" }, null, 2)}\n`
);

console.log(`✓ Lambda bundle 输出到 ${OUT_DIR}/index.js`);
