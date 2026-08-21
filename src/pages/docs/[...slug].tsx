import type { LoaderArgs, RouteProps } from "@thexjs/core";
import { Island } from "@thexjs/core";
import CommandReference from "@/islands/command-reference";
import { DOCS } from "@/generated/docs-data";

export const islands = { "command-reference": CommandReference };

interface DocPageProps extends RouteProps {
  loaderData?: { doc?: (typeof DOCS)[number] | null };
}

export async function loader({ params }: LoaderArgs) {
  const slug = params.slug ?? "";
  return { doc: DOCS.find((d) => d.slug === slug) ?? null };
}

export default function DocsPage({ loaderData }: DocPageProps) {
  const doc = loaderData?.doc;
  if (!doc) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-serif)] text-5xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">That page doesn't exist.</p>
        <a href="/docs" className="mt-6 inline-block text-accent underline">
          All documentation
        </a>
      </div>
    );
  }
  return (
    <article className="prose-katex min-w-0">
      <h1>{doc.title}</h1>
      {doc.slug === "writing/commands" && <Island name="command-reference" client="load">
          <CommandReference />
        </Island>}
      <div dangerouslySetInnerHTML={{ __html: doc.html }} />
      <a
        href={`https://github.com/abdelkabirouadoukou/xtype/edit/main/content-docs/${doc.slug}.md`}
        className="mt-16 inline-block border-t border-border pt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        ✎ Edit this page
      </a>
    </article>
  );
}
