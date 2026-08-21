import { createTypstCompiler } from "typst-wasm";
import { createWebWorker } from "typst-wasm/worker/browser";

const FONTS = [
  "/fonts/LibertinusSerif-Regular.otf",
  "/fonts/LibertinusSerif-Bold.otf",
  "/fonts/LibertinusSerif-Italic.otf",
  "/fonts/NewCMMath-Regular.otf",
  "/fonts/NewCMMath-Book.otf",
  "/fonts/DejaVuSansMono.ttf",
];

let latestGen = 0;
let compilerPromise: Promise<Awaited<ReturnType<typeof createTypstCompiler>>> | null =
  null;

async function getCompiler() {
  compilerPromise ??= (async () => {
    const compiler = await createTypstCompiler({
      backend: "auto",
      worker: () => createWebWorker("/workers/typst-engine.js"),
      coreModules: {
        "engine.core.wasm": WebAssembly.compileStreaming(
          fetch("/wasm/engine.core.wasm"),
        ),
        "engine.core2.wasm": WebAssembly.compileStreaming(
          fetch("/wasm/engine.core2.wasm"),
        ),
        "engine.core3.wasm": WebAssembly.compileStreaming(
          fetch("/wasm/engine.core3.wasm"),
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
  const { type, source, gen } = e.data as {
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
    (self as unknown as Worker).postMessage({
      type: "error",
      gen,
      message: String(err).slice(0, 2000),
    });
  }
};
