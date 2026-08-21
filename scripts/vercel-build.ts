import { buildVercelOutput } from "@thexjs/adapter-vercel";

await buildVercelOutput({
  pagesDir: "src/pages",
  layoutsDir: "src/layouts",
  apiDir: "src/api",
  actionsDir: "src/actions",
  contentDir: "content",
});
console.log("vercel output ready -> .vercel/output");
