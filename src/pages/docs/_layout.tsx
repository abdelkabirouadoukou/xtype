import type { ReactNode } from "react";
import { Island } from "@thexjs/core";
import DocsSidebar from "@/islands/docs-sidebar";
import TocRail from "@/islands/toc-rail";
import DocsSearch from "@/islands/docs-search";

export const islands = {
  "docs-sidebar": DocsSidebar,
  "toc-rail": TocRail,
  "docs-search": DocsSearch,
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Island name="docs-search" client="load">
        <DocsSearch />
      </Island>
      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-8">
        <Island name="docs-sidebar" client="load">
          <DocsSidebar />
        </Island>
        <div className="min-w-0 flex-1">{children}</div>
        <Island name="toc-rail" client="load">
          <TocRail />
        </Island>
      </div>
    </>
  );
}
