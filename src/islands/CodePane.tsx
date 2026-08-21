import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { xtypeLanguage } from "@/lib/editor/math-syntax";
import { mathAutocomplete } from "@/lib/editor/completions/completion-source";
import { onEditorChange, flushSave } from "@/lib/editor/debounce-pipeline";

interface Props {
  chapterId: string;
  initialContent: string;
}

export default function CodePane({ chapterId, initialContent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const chapterRef = useRef(chapterId);

  useEffect(() => {
    if (!containerRef.current) return;
    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: initialContent,
        extensions: [
          basicSetup,
          xtypeLanguage,
          mathAutocomplete,
          highlightSelectionMatches(),
          keymap.of([...searchKeymap, indentWithTab]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onEditorChange(
                chapterRef.current,
                update.state.doc.toString(),
              );
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    const onGoto = (e: Event) => {
      const line = (e as CustomEvent<number>).detail;
      const l = view.state.doc.line(Math.min(line + 1, view.state.doc.lines));
      view.dispatch({
        selection: { anchor: l.from },
        scrollIntoView: true,
      });
      view.focus();
    };
    window.addEventListener("xtype:goto-line", onGoto);
    return () => {
      void flushSave(chapterRef.current);
      window.removeEventListener("xtype:goto-line", onGoto);
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || chapterId === chapterRef.current) return;
    void flushSave(chapterRef.current);
    chapterRef.current = chapterId;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: initialContent },
    });
  }, [chapterId, initialContent]);

  return <div ref={containerRef} className="h-full w-full overflow-auto" />;
}
