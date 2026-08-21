export {};

const outdir = "public/workers";
const entries = new Bun.Glob("src/workers/*.worker.ts");

await Bun.$`mkdir -p ${outdir}`.quiet();

for (const path of ["src/workers/compiler.worker.ts"]) {
  const name = path.split("/").pop()!.replace(/\.worker\.ts$/, "");
  const result = await Bun.build({
    entrypoints: [path],
    target: "browser",
    format: "iife",
    minify: process.env.WORKERS_DEBUG ? false : true,
    naming: `${name}.js`,
    outdir,
  });
  if (!result.success) {
    console.error(`worker build failed: ${name}`);
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
  console.log(`built public/workers/${name}.js`);
}
