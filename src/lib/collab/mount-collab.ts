import { createClient } from "@liveblocks/client";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { xtypeLanguage } from "@/lib/editor/math-syntax";

declare global {
  interface Window {
    XTYPE_COLLAB?: { mountCollab: typeof mountCollab };
  }
}
Window;

interface MountOptions {
  el: HTMLElement;
  chapterId: string;
  projectId: string;
  initialContent: string;
  publicKey: string;
  onError?: (message: string) => void;
}

export interface MountHandle {
  destroy: () => void;
}

export function mountCollab(opts: MountOptions): MountHandle {
  const { el, chapterId, projectId, initialContent, publicKey } = opts;

  let view: EditorView | null = null;
  let provider: LiveblocksYjsProvider | null = null;
  let leave: (() => void) | null = null;
  let destroyed = false;

  void (async () => {
    try {
      const client = createClient({ publicApiKey: publicKey });
      const entered = client.enterRoom(`project-${projectId}`, {
        initialPresence: {},
      });
      leave = entered.leave;
      const room = entered.room;
      const ydoc = new Y.Doc();
      provider = new LiveblocksYjsProvider(room, ydoc);
      await new Promise<void>((resolve, reject) => {
        provider!.on("synced", resolve);
        provider!.on("error", reject);
        setTimeout(resolve, 4000);
      });
      if (destroyed) return;
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
      opts.onError?.(e instanceof Error ? e.message : "collab unavailable");
    }
  })();

  return {
    destroy() {
      destroyed = true;
      view?.destroy();
      provider?.destroy();
      try {
        leave?.();
      } catch {}
    },
  };
}

if (typeof window !== "undefined") {
  window.XTYPE_COLLAB = { mountCollab };
}
