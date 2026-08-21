import { DOCS } from "@/generated/docs-data";

export const islands = {};

const bySection = new Map<string, typeof DOCS>();
for (const d of DOCS) {
  if (!d.slug) continue;
  const key = d.section || "";
  const list = bySection.get(key) ?? [];
  list.push(d);
  bySection.set(key, list);
}

export default function DocsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-serif)] text-4xl font-semibold">
        Documentation
      </h1>
      <p className="mt-3 text-muted-foreground">
        Everything about writing math with xtype.
      </p>
      {[...bySection.entries()].map(([section, pages]) => (
        <section key={section} className="mt-10">
          {section && (
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {section}
            </h2>
          )}
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {pages.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/docs/${p.slug}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-background"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-muted-foreground">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
