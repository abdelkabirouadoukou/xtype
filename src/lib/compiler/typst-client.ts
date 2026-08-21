import { useProjectStore } from "@/lib/state/project-store";

export function requestCompile() {
  useProjectStore.getState().setCompileState("compiling");
}
