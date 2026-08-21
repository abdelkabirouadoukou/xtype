import katex from "katex";
import {
  autocompletion,
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { filterCommands } from "./latex-commands";

function mathCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\\[a-zA-Z]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const matches = filterCommands(word.text);
  if (matches.length === 0) return null;

  return {
    from: word.from,
    options: matches.map(
      (c): Completion => ({
        label: c.label,
        detail: c.detail,
        type: "function",
        apply: snippet(c.template),
        info: () => renderPreview(c.previewSource ?? c.trigger),
      }),
    ),
  };
}

function renderPreview(source: string): Node | null {
  const container = document.createElement("div");
  container.className = "xtype-cm-info";
  try {
    container.innerHTML = katex.renderToString(source, {
      throwOnError: false,
    });
  } catch {
    container.textContent = source;
  }
  const detail = document.createElement("div");
  detail.className = "xtype-cm-info-source";
  detail.textContent = source;
  container.appendChild(detail);
  return container;
}

export const mathAutocomplete = autocompletion({
  override: [mathCompletions],
  activateOnTyping: true,
  icons: false,
});
