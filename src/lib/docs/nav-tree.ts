import { DOCS } from "@/generated/docs-data";

export interface DocsSection {
  key: string;
  label: string;
  pages: { slug: string; title: string }[];
}

const SECTION_LABELS: Record<string, string> = {
  "": "Overview",
  gettingstarted: "Getting started",
  writing: "Writing",
  architecture: "Architecture",
};

export function buildNavTree(): DocsSection[] {
  const sections = new Map<string, DocsSection>();
  for (const d of DOCS) {
    if (!d.slug) continue;
    const key = d.section;
    if (!sections.has(key)) {
      sections.set(key, {
        key,
        label: SECTION_LABELS[key] ?? key,
        pages: [],
      });
    }
    sections.get(key)!.pages.push({ slug: d.slug, title: d.title });
  }
  return [...sections.values()];
}
