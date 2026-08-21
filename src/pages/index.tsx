export const mode = "static";

const features = [
  {
    title: "0% server compute",
    body: "Your documents never touch a server. Editing, math rendering and PDF compilation all happen in your browser.",
  },
  {
    title: "Instant math preview",
    body: "Inline $LaTeX$, display equations and AsciiMath render as you type — no round-trip, no waiting.",
  },
  {
    title: "Real PDF output",
    body: "The Typst compiler runs in a web worker via WASM, producing properly paginated, publication-grade PDFs.",
  },
  {
    title: "Yours forever",
    body: "Documents live in IndexedDB on your device. Export anytime. No accounts required.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-5xl font-bold tracking-tight">
        Math documents,{" "}
        <span className="text-accent">compiled in your browser</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        xtype is a client-side editor for math-heavy writing. Write Markdown
        with LaTeX and AsciiMath, preview instantly with KaTeX, export real PDFs
        compiled by Typst — all without a single server request.
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/project/new"
          className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          Start writing →
        </a>
        <a
          href="/settings"
          className="rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-card"
        >
          Settings
        </a>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
