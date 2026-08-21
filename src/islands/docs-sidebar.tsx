import { useEffect, useState } from "react";
import { buildNavTree } from "@/lib/docs/nav-tree";

export default function DocsSidebar() {
  const [path, setPath] = useState("");
  const sections = buildNavTree();

  useEffect(() => {
    setPath(window.location.pathname.replace(/^\/docs\/?/, "").replace(/\/$/, ""));
    const onScroll = () => {
      const headings = document.querySelectorAll("article h2[id], article h3[id]");
      let current = "";
      for (const h of headings) {
        if (h.getBoundingClientRect().top < 120) current = h.id;
      }
      document.querySelectorAll("[data-toc-link]").forEach((a) => {
        const active = a.getAttribute("href") === `#${current}`;
        a.classList.toggle("text-accent", active);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="sticky top-8 hidden w-56 shrink-0 flex-col gap-6 text-sm md:flex">
      {sections.map((s) => (
        <div key={s.key}>
          <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {s.label}
          </p>
          <ul className="flex flex-col gap-1 border-l border-border">
            {s.pages.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/docs/${p.slug}`}
                  className={`-ml-px block border-l-2 py-1 pl-3 transition-colors ${
                    path === p.slug
                      ? "border-accent font-medium text-accent"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
