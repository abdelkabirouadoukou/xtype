import { createTypstCompiler } from "typst-wasm";

interface WorkerHost {
  listen: (onMessage: (data: unknown) => void, onError: (err: unknown) => void) => void;
  postMessage: (data: unknown) => void;
  terminate: () => void;
}

function createClassicWorker(workerUrl: string): WorkerHost {
  const src = `importScripts("${new URL(workerUrl, location.origin).href}");`;
  const url = URL.createObjectURL(new Blob([src], { type: "application/javascript" }));
  const worker = new Worker(url);
  return {
    listen: (onMessage, onError) => {
      worker.onmessage = (event) => onMessage(event.data);
      worker.onerror = (event) =>
        onError((event as ErrorEvent).error ?? (event as ErrorEvent).message);
    },
    postMessage: (data) => worker.postMessage(data),
    terminate: () => worker.terminate(),
  };
}

const FONTS = [
  "/fonts/LibertinusSerif-Regular.otf",
  "/fonts/LibertinusSerif-Bold.otf",
  "/fonts/LibertinusSerif-Italic.otf",
  "/fonts/NewCMMath-Regular.otf",
  "/fonts/NewCMMath-Book.otf",
  "/fonts/DejaVuSansMono.ttf",
].map((p) => new URL(p, location.origin).href);

let latestGen = 0;
let compilerPromise: Promise<Awaited<ReturnType<typeof createTypstCompiler>>> | null =
  null;

async function getCompiler() {
  compilerPromise ??= (async () => {
    const compiler = await createTypstCompiler({
      backend: "auto",
      worker: () => createClassicWorker("/workers/typst-engine.js"),
      coreModules: {
        "engine.core.wasm": WebAssembly.compileStreaming(
          fetch(new URL("/wasm/engine.core.wasm", location.origin).href),
        ),
        "engine.core2.wasm": WebAssembly.compileStreaming(
          fetch(new URL("/wasm/engine.core2.wasm", location.origin).href),
        ),
        "engine.core3.wasm": WebAssembly.compileStreaming(
          fetch(new URL("/wasm/engine.core3.wasm", location.origin).href),
        ),
      },
    });
    const fonts = await Promise.all(
      FONTS.map(async (url) => new Uint8Array(await (await fetch(url)).arrayBuffer())),
    );
    await compiler.addFonts(...fonts);
    await compiler.setMain("main.typ");
    return compiler;
  })();
  return compilerPromise;
}

function formatDiagnostics(diagnostics: Array<{ message: string }>): string {
  return diagnostics
    .map((d) => d.message)
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);
}

self.onmessage = async (e: MessageEvent) => {
  const { type, source, files, gen } = e.data as {
    type: string;
    source: string;
    files: Record<string, string>;
    gen: number;
  };
  if (type !== "compile") return;

  latestGen = gen;
  try {
    const compiler = await getCompiler();
    if (gen !== latestGen) return;
    await compiler.addSource("main.typ", source);
    for (const [name, content] of Object.entries(files ?? {})) {
      const target = /\.[a-z]+$/.test(name) ? name : `${name}.typ`;
      try {
        await compiler.addSource(target, content);
      } catch {
        // non-source assets (e.g. .bib) may be unsupported by addSource
      }
    }
    const result = await compiler.compile({ format: "pdf" });
    if (gen !== latestGen) return;

    if (!result.output?.length && result.diagnostics.length > 0) {
      (self as unknown as Worker).postMessage({
        type: "error",
        gen,
        message: formatDiagnostics(result.diagnostics),
      });
      return;
    }
    const pdf = result.output;
    (self as unknown as Worker).postMessage(
      { type: "result", gen, pdf: pdf.buffer },
      [pdf.buffer],
    );
  } catch (err) {
    if (gen !== latestGen) return;
    const diags = (err as { diagnostics?: Array<{ message?: string; rendered?: string }> })
      ?.diagnostics;
    const detail =
      Array.isArray(diags) && diags.length > 0
        ? diags
            .map((d) => d.rendered ?? d.message ?? String(d))
            .join("\n")
            .slice(0, 2000)
        : err instanceof Error
          ? `${err.message}\n${err.stack ?? ""}`
          : String(err);
    (self as unknown as Worker).postMessage({
      type: "error",
      gen,
      message: detail.slice(0, 2000),
    });
  }
};
