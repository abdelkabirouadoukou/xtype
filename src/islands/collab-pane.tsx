import { useEffect, useRef, useState } from "react";

interface Props {
  chapterId: string;
  projectId: string;
  initialContent: string;
}

interface CollabGlobal {
  mountCollab: (opts: {
    el: HTMLElement;
    chapterId: string;
    projectId: string;
    initialContent: string;
    publicKey: string;
    onError?: (message: string) => void;
  }) => { destroy: () => void };
}

export default function CollabPane({ chapterId, projectId, initialContent }: Props) {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const destroyRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const publicKey = (
      window as unknown as { process?: { env?: Record<string, string> } }
    ).process?.env?.THEXJS_PUBLIC_LIVEBLOCKS_KEY;

    let cancelled = false;

    function cleanup() {
      cancelled = true;
      destroyRef.current?.destroy();
      destroyRef.current = null;
    }

    if (!publicKey) {
      setError("Collaboration is not configured");
      return cleanup;
    }

    const existing = (window as unknown as { XTYPE_COLLAB?: CollabGlobal }).XTYPE_COLLAB;
    const start = (api: CollabGlobal) => {
      if (cancelled) return;
      destroyRef.current = api.mountCollab({
        el,
        chapterId,
        projectId,
        initialContent,
        publicKey,
        onError: (m) => setError(m),
      });
    };

    if (existing) {
      start(existing);
    } else {
      const script = document.createElement("script");
      script.src = "/collab/collab.js";
      script.onload = () => {
        const api = (window as unknown as { XTYPE_COLLAB?: CollabGlobal }).XTYPE_COLLAB;
        if (api) start(api);
        else setError("collab unavailable");
      };
      script.onerror = () => setError("collab unavailable");
      document.head.appendChild(script);
    }

    return cleanup;
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
