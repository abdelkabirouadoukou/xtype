import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=JetBrains+Mono:wght@400&display=swap"
      />
      <link rel="stylesheet" href="/katex/katex.min.css" />
      <nav className="flex items-center gap-6 border-b border-border px-6 py-3">
        <a className="text-lg font-semibold tracking-tight">
          x<span className="font-[family-name:var(--font-serif)] italic text-accent">type</span>
        </a>
        <a
          href="/project/new"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Editor
        </a>
        <a
          href="/docs"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Docs
        </a>
        <a
          href="/settings"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Settings
        </a>
      </nav>
      <main>{children}</main>
    </>
  );
}
