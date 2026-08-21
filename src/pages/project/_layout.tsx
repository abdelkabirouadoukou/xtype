import type { ReactNode } from "react";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark-shell h-screen w-screen overflow-hidden font-[family-name:var(--font-sans)]">
      {children}
    </div>
  );
}
