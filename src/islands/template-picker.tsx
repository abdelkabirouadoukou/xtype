import { createFile, saveChapterContent } from "@/lib/storage/use-project";
import { useProjectStore } from "@/lib/state/project-store";

interface Template {
  id: string;
  label: string;
  description: string;
  content: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    label: "Blank",
    description: "Empty chapter",
    content: "# Introduction\n\nStart writing…",
  },
  {
    id: "article",
    label: "Article",
    description: "Numbered equations, sections",
    content:
      '# Abstract\n\n$e^{i\\pi} + 1 = 0$\n\n# Introduction\n\nNumbered equations:\n\n$$ E = m c^2 $$\n',
  },
  {
    id: "report",
    label: "Report",
    description: "Title block + table",
    content:
      "# Title\n\n**Author** — _date_\n\n# Methodology\n\nDescribe your method.\n\n# Results\n\n| Group | Mean |\n|---|---|\n| A | 3.14 |\n| B | 2.72 |\n",
  },
  {
    id: "exam",
    label: "Exam",
    description: "Questions with points",
    content:
      '# Exam 1\n\n**Time: 90 minutes** — *100 points*\n\n## Problem 1 (20 points)\n\nSolve $x^2 - 5x + 6 = 0$.\n\n## Problem 2 (30 points)\n\nProve $\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}$.\n',
  },
];

export async function applyTemplate(
  projectId: string,
  parentId: string | null,
  templateId: string,
) {
  const t = TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES[0];
  await createFile(projectId, "chapter1.md", parentId, 0);
  const store = useProjectStore.getState();
  const chapterId = Object.keys(store.chapters)[0];
  if (chapterId) {
    store.setActiveContent(chapterId, t.content);
    await saveChapterContent(chapterId, t.content);
  }
}
