export {};

const outdir = "public/collab";

await Bun.$`mkdir -p ${outdir}`.quiet();

const result = await Bun.build({
  entrypoints: ["src/lib/collab/mount-collab.ts"],
  target: "browser",
  format: "esm",
  minify: true,
  naming: "collab.js",
  outdir,
});

if (!result.success) {
  console.error("collab build failed");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`built ${outdir}/collab.js`);
