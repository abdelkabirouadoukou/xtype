import { Island } from "@thexjs/core";
import EditorIsland from "../../islands/EditorIsland";

export const islands = { EditorIsland };

export default function ProjectPage() {
  return (
    <Island name="EditorIsland" client="load">
      <EditorIsland />
    </Island>
  );
}
