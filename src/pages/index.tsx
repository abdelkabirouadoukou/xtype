import { Island } from "@thexjs/core";
import LandingHero from "../islands/LandingHero";

export const islands = { LandingHero };

export const mode = "static";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-6">
      {/* Hero */}
      <section className="pb-20 pt-20">
        <h1 className="font-[family-name:var(--font-serif)] text-5xl font-semibold leading-tight tracking-tight">
          Write math like you think.
          <br />
          <span className="text-accent">Compiled before you blink.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          xtype is a local-first editor for math-heavy writing. Type LaTeX or
          AsciiMath, watch it render instantly, export publication-grade PDFs —
          your browser does all the work. No accounts. No server. No waiting.
        </p>
        <div className="mt-8">
          <a
            href="/project/new"
            className="inline-block rounded-lg bg-accent px-7 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Start writing — it's instant →
          </a>
        </div>
        <Island name="LandingHero" client="load">
          <LandingHero />
        </Island>
      </section>

      {/* Differentiator */}
      <section className="border-t border-border py-16">
        <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold">
          No compiler timeouts. Ever.
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Online LaTeX editors queue your document behind everyone else's and
          hand back a spinner. xtype flips that: a full Typst compiler runs
          inside <em>your</em> tab via WebAssembly. Preview in milliseconds with
          KaTeX while you type; real paginated PDFs land in the background.
          Your draft never leaves your machine.
        </p>
      </section>

      {/* Feature beats */}
      <section className="grid gap-10 border-t border-border py-16 sm:grid-cols-3">
        <Feature title="Math as fast as thought" body="Type \\fr and pick from live-suggested commands with rendered previews. Tab through placeholders. AsciiMath works too: ::a/b:: becomes a proper fraction." />
        <Feature title="Projects, chapters, folders" body="Structure a thesis the way it deserves. Multi-chapter documents persist in IndexedDB — reload, close the tab, come back tomorrow: everything's still there." />
        <Feature title="Local-first, forever" body="No database. No sync conflicts. No terms of service. Export to PDF anytime, own the files, delete everything with one click." />
      </section>

      {/* Open source */}
      <section className="border-t border-border py-16">
        <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold">
          Open source, built in the open.
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          MIT licensed, self-hostable, and developed one commit at a time. Read
          the architecture notes, file issues, or deploy your own instance —
          the whole stack is a{" "}
          <code className="rounded bg-card px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-sm">
            bun run build
          </code>{" "}
          away.
        </p>
        <div className="mt-6 flex gap-4">
          <a href="/docs" className="text-accent underline underline-offset-4">
            Read the docs
          </a>
          <a
            href="https://github.com/abdelkabirouadoukou/xtype"
            className="text-accent underline underline-offset-4"
          >
            GitHub ↗
          </a>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border py-20 text-center">
        <h2 className="font-[family-name:var(--font-serif)] text-4xl font-semibold">
          Your next paper starts now.
        </h2>
        <a
          href="/project/new"
          className="mt-8 inline-block rounded-lg bg-accent px-7 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          Start writing →
        </a>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
