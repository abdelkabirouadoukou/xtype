import { Island } from "@thexjs/core";
import DashboardIsland from "@/islands/dashboard-island";

export const islands = { "dashboard-island": DashboardIsland };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold">
          Projects
        </h1>
        <a
          href="/project/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          New project
        </a>
      </div>
      <Island name="dashboard-island" client="load">
        <DashboardIsland />
      </Island>
    </div>
  );
}
