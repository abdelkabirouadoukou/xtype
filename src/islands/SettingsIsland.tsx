import { useLocalStorage } from "@thexjs/hooks";
import { db } from "@/lib/storage/db";

export default function SettingsIsland() {
  const [defaultView, setDefaultView] = useLocalStorage(
    "xtype:default-view",
    "fast",
  );
  const [autosaveMs, setAutosaveMs] = useLocalStorage("xtype:autosave-ms", "2000");

  return (
    <div className="mt-8 flex flex-col gap-4">
      <label className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm">
        <span>Default preview mode</span>
        <select
          value={defaultView}
          onChange={(e) => setDefaultView(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1"
        >
          <option value="fast">Fast (KaTeX)</option>
          <option value="pdf">PDF (Typst)</option>
        </select>
      </label>

      <label className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm">
        <span>Autosave delay</span>
        <select
          value={autosaveMs}
          onChange={(e) => setAutosaveMs(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1"
        >
          <option value="1000">1s</option>
          <option value="2000">2s</option>
          <option value="5000">5s</option>
        </select>
      </label>

      <button
        onClick={async () => {
          if (!confirm("Delete ALL local projects and chapters?")) return;
          await db.delete();
          location.href = "/";
        }}
        className="self-start rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 hover:bg-red-950"
      >
        Clear all local data
      </button>
    </div>
  );
}
