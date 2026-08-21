import { useEffect, useRef, useState } from "react";
import { createClient } from "@liveblocks/client";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { xtypeLanguage } from "@/lib/editor/math-syntax";

interface Props {
  chapterId: string;
  projectId: string;
  initialContent: string;
}

export default function CollabPane({ chapterId, projectId, initialContent }: Props) {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const enteredLeaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    type EnteredRoom = ReturnType<ReturnType<typeof createClient>["enterRoom"]>;

    let provider: LiveblocksYjsProvider | null = null;
    let view: EditorView | null = null;
    let room: EnteredRoom["room"] | null = null;

    void (async () => {
      try {
        const publicKey = (window as unknown as { process?: { env?: Record<string, string> } })
          .process?.env?.THEXJS_PUBLIC_LIVEBLOCKS_KEY;
        if (!publicKey) throw new Error("Collaboration is not configured");

        const client = createClient({ publicApiKey: publicKey });
        const entered: EnteredRoom = client.enterRoom(`project-${projectId}`, {
          initialPresence: {},
        });
        room = entered.room;
        enteredLeaveRef.current = entered.leave;
        const ydoc = new Y.Doc();
        provider = new LiveblocksYjsProvider(room, ydoc);
        await new Promise<void>((resolve, reject) => {
          provider!.on("synced", resolve);
          provider!.on("error", reject);
          setTimeout(resolve, 4000);
        });
        const ytext = ydoc.getText(`chapter-${chapterId}`);
        if (ytext.length === 0 && initialContent) {
          ydoc.transact(() => ytext.insert(0, initialContent));
        }
        const awareness = provider.awareness;
        view = new EditorView({
          parent: el,
          state: EditorState.create({
            doc: ytext.toString(),
            extensions: [
              basicSetup,
              xtypeLanguage,
              keymap.of([indentWithTab]),
              yCollab(ytext, awareness, { undoManager: new Y.UndoManager(ytext) }),
            ],
          }),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "collab unavailable");
      }
    })();

    return () => {
      view?.destroy();
      provider?.destroy();
      try {
      enteredLeaveRef.current?.();
    } catch {}
  };
  }, [chapterId, projectId, initialContent]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }
  return <div ref={containerRef} className="h-full" />;
}
