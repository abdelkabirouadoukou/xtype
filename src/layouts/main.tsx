import type { ReactNode } from "react";
import { Island } from "@thexjs/core";
import AuthBar from "@/islands/auth-bar";
import { clerkPublishableKey, liveblocksPublicKey, clerkUiEnabled } from "@/lib/public-env";

export const islands = { "auth-bar": AuthBar };

export default function RootLayout({ children }: { children: ReactNode }) {
  const clerkEnabled = clerkUiEnabled();
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
      {clerkEnabled && (
        <script
          async
          src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
          data-clerk-publishable-key={clerkPublishableKey}
        />
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.process=window.process||{env:{}};Object.assign(window.process.env,${JSON.stringify(
            { THEXJS_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey ?? "", THEXJS_PUBLIC_LIVEBLOCKS_KEY: liveblocksPublicKey ?? "" },
          )});`,
        }}
      />
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
          href="/dashboard"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Projects
        </a>
        <a
          href="/settings"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Settings
        </a>
        <Island name="auth-bar" client="load">
          <AuthBar />
        </Island>
      </nav>
      <main>{children}</main>
    </>
  );
}
