export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function exportSingleFileHtml(
  projectId: string,
  name: string,
): Promise<void> {
  const { db } = await import("@/lib/storage/db");
  const nodes = await db.nodes.where("projectId").equals(projectId).toArray();
  const { renderFastPreview } = await import("@/lib/preview/fast-render");
  const body = nodes
    .filter((n) => n.type === "file")
    .map((n) => renderFastPreview(n.content ?? ""))
    .join('\n<hr />\n');
  const katexCss = await fetch("/katex/katex.min.css").then((r) => r.text());
  const fontUrlBase = new URL("/katex/fonts/", window.location.origin).toString();
  const css = katexCss.replaceAll("url(fonts/", `url(${fontUrlBase}fonts/`);
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${name}</title>
<style>${css}</style>
<style>body{max-width:760px;margin:3rem auto;padding:0 1.5rem;font-family:Georgia,serif;line-height:1.6;color:#222}</style>
</head><body>${body}</body></html>`;
  downloadBlob(html, `${name}.html`, "text/html");
}

export async function exportTypSource(projectId: string, name: string): Promise<void> {
  const { db } = await import("@/lib/storage/db");
  const nodes = await db.nodes.where("projectId").equals(projectId).toArray();
  const src = nodes
    .filter((n) => n.type === "file")
    .map((n) => `// ==== ${n.name} ====\n${n.content ?? ""}`)
    .join("\n\n");
  downloadBlob(src, `${name}.typ`, "text/plain");
}
