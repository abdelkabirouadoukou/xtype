import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/katex/katex.min.css" />
      <nav className="flex items-center gap-6 border-b border-border px-6 py-3">
        <a href="/" className="text-lg font-bold tracking-tight">
          x<span className="text-accent">type</span>
        </a>
        <a
          href="/project/new"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Editor
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
