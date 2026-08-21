import type { ReactNode } from "react";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
