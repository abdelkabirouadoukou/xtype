import { useEffect, useRef } from "react";

interface ClerkWindow {
  Clerk?: {
    loaded?: boolean;
    addListener: (cb: () => void) => void;
    mountSignIn: (el: HTMLElement) => void;
    mountSignUp: (el: HTMLElement) => void;
    unmount: (el: HTMLElement) => void;
  };
}

export default function ClerkMount() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window as unknown as ClerkWindow;
    if (!w.Clerk || !ref.current) return;
    const mode = window.location.pathname.startsWith("/sign-up") ? "up" : "in";
    let mounted = false;
    const tryMount = () => {
      if (mounted || !w.Clerk?.loaded || !ref.current) return;
      mounted = true;
      if (mode === "up") w.Clerk.mountSignUp(ref.current);
      else w.Clerk.mountSignIn(ref.current);
    };
    w.Clerk.addListener(tryMount);
    tryMount();
    return () => {
      if (mounted && ref.current) w.Clerk?.unmount(ref.current);
    };
  }, []);

  return <div ref={ref} className="mx-auto mt-16 max-w-md" />;
}
