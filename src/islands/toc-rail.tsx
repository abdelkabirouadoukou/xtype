import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TocRail() {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const els = [...document.querySelectorAll("article h2[id], article h3[id]")];
    setHeadings(
      els.map((e) => ({
        id: e.id,
        text: e.textContent ?? "",
        level: e.tagName === "H2" ? 2 : 3,
      })),
    );
    const onScroll = () => {
      let current = "";
      for (const e of els) {
        if (e.getBoundingClientRect().top < 120) current = e.id;
      }
      document.querySelectorAll("[data-toc-link]").forEach((a) => {
        const active = a.getAttribute("href") === `#${current}`;
        a.classList.toggle("text-accent", active);
        a.classList.toggle("font-medium", active);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (headings.length === 0) return null;
  return (
    <nav className="sticky top-8 hidden w-48 shrink-0 xl:block">
      <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        On this page
      </p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
            <a
              data-toc-link
              href={`#${h.id}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
