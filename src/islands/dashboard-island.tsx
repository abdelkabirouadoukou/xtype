import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/storage/db";
import {
  trashProject,
  restoreProject,
  deleteForever,
  duplicateProject,
  renameProject,
  purgeExpiredTrash,
} from "@/lib/project-ops";

export default function DashboardIsland() {
  const projects = useLiveQuery(
    () => db.projects.orderBy("createdAt").reverse().toArray(),
    [],
  );

  useEffect(() => {
    void purgeExpiredTrash();
  }, []);

  if (!projects) return <p className="text-muted-foreground">Loading…</p>;
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground">No projects yet.</p>
        <a href="/project/new" className="mt-3 inline-block text-accent hover:underline">
          Create your first →
        </a>
      </div>
    );
  }

  return (
    <>
    <ImportBar />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} id={p.id} name={p.name} createdAt={p.createdAt} deletedAt={p.deletedAt} />
      ))}
    </div>
    </>
  );
}

function ImportBar() {
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState("");

  const newProject = async () => {
    const id = crypto.randomUUID().slice(0, 8);
    await db.projects.add({ id, name: `Imported ${new Date().toLocaleDateString()}`, createdAt: Date.now() });
    return id;
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm hover:border-accent">
        Import .zip
        <input
          type="file"
          accept=".zip"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setStatus("Importing…");
            const id = await newProject();
            const { importZip } = await import("@/lib/project-ops");
            const n = await importZip(id, f);
            setStatus(`Imported ${n} files`);
            window.location.href = `/project/${id}`;
          }}
        />
      </label>
      <form
        className="flex flex-1 items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!repoUrl.trim()) return;
          setStatus("Fetching repo…");
          try {
            const id = await newProject();
            const { importGitHub } = await import("@/lib/project-ops");
            await importGitHub(id, repoUrl);
            window.location.href = `/project/${id}`;
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "Import failed");
          }
        }}
      >
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button className="rounded-lg border border-border px-3 py-2 text-sm hover:border-accent">
          Import from GitHub
        </button>
      </form>
      {status && <span className="text-xs text-muted-foreground">{status}</span>}
    </div>
  );
}

function ProjectCard({
  id,
  name,
  createdAt,
  deletedAt,
}: {
  id: string;
  name: string;
  createdAt: number;
  deletedAt?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const actions = [
    <a key="open" href={`/project/${id}`} className="text-accent hover:underline">
      open
    </a>,
    <button
      key="dup"
      onClick={() => void duplicateProject(id)}
      className="hover:text-foreground"
    >
      duplicate
    </button>,
    <button
      key="export-html"
      onClick={() => void import("@/lib/export").then(({ exportSingleFileHtml }) => exportSingleFileHtml(id, name))}
      className="hover:text-foreground"
    >
      html
    </button>,
    <button
      key="export-typ"
      onClick={() => void import("@/lib/export").then(({ exportTypSource }) => exportTypSource(id, name))}
      className="hover:text-foreground"
    >
      .typ
    </button>,
    deletedAt ? (
      <button key="restore" onClick={() => void restoreProject(id)} className="hover:text-foreground">
        restore
      </button>
    ) : (
      <button key="trash" onClick={() => void trashProject(id)} className="hover:text-red-500">
        trash
      </button>
    ),
  ];
  if (deletedAt) {
    actions.push(
      <button key="purge" onClick={() => void deleteForever(id)} className="text-red-500 hover:underline">
        delete forever
      </button>,
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${deletedAt ? "border-dashed border-border opacity-70" : "border-border bg-card"}`}>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void renameProject(id, draft || name);
            setEditing(false);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
          />
        </form>
      ) : (
        <h3 className="truncate font-medium" onDoubleClick={() => setEditing(true)} title="Double-click to rename">
          {name}
        </h3>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(createdAt).toLocaleDateString()}
        {deletedAt ? " · in trash" : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">{actions}</div>
    </div>
  );
}
