import React from "react";
import { hydrateRoot } from "react-dom/client";
import * as Route from "src/pages/project/[projectId].tsx";
import * as Layout0 from "src/layouts/main.tsx";
import * as Layout1 from "src/pages/project/_layout.tsx";

function resolveIsland(name: string) {
  return Route.islands?.[name] ?? Layout0.islands?.[name] ?? Layout1.islands?.[name];
}

// Islands whose render is non-deterministic (e.g. `useState(() => ...)` with
// Math.random) can't be hydrated against their SSR output. React recovers by
// re-rendering client-side, so the island is still fully interactive. The
// mismatch is NOT silently swallowed: it is reported to the server so real
// rendering bugs are observable in production instead of hidden.
function reportHydrationMismatch(error, name) {
  try {
    console.error("[x] hydration mismatch on island '" + name + "':", error);
  } catch (_) {}
  try {
    var message = error instanceof Error ? error.message : String(error);
    navigator.sendBeacon(
      "/__x/hydration-mismatch",
      new Blob([JSON.stringify({ error: message, island: name, url: location.href })], {
        type: "application/json",
      }),
    );
  } catch (_) {
    // sendBeacon is best-effort; a failing beacon must not break hydration.
  }
}

document.querySelectorAll("[data-island]").forEach((el) => {
  const name = el.getAttribute("data-island");
  if (!name) return;
  const Component = resolveIsland(name);
  if (!Component) return;
  hydrateRoot(el, React.createElement(Component), {
    onRecoverableError(error) {
      reportHydrationMismatch(error, name);
    },
  });
});
