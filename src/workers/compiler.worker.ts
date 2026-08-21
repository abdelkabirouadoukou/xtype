let latestGen = 0;

self.onmessage = async (e: MessageEvent) => {
  const { type, source, gen } = e.data as {
    type: string;
    source: string;
    files: Record<string, string>;
    gen: number;
  };
  if (type !== "compile") return;

  latestGen = gen;
  const pdf = await compile(source);
  if (gen !== latestGen) return;

  (self as unknown as Worker).postMessage(
    { type: "result", gen, pdf: pdf.buffer },
    [pdf.buffer],
  );
};

async function compile(_source: string): Promise<Uint8Array> {
  const start = Date.now();
  while (Date.now() - start < 40) {}
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  return bytes;
}
