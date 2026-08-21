import { useEffect, useState } from "react";

type ClerkUser = { firstName: string | null; imageUrl: string } | undefined;

interface ClerkWindow {
  Clerk?: {
    loaded?: boolean;
    addListener: (cb: () => void) => void;
    user?: ClerkUser;
    signOut: () => Promise<void>;
  };
}

export default function AuthBar() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<ClerkUser>(undefined);

  useEffect(() => {
    const w = window as unknown as ClerkWindow;
    if (!w.Clerk) return;
    const sync = () => {
      if (w.Clerk?.loaded) {
        setUser(w.Clerk.user);
        setReady(true);
      }
    };
    w.Clerk.addListener(sync);
    sync();
  }, []);

  if (!ready) return null;
  if (!user) {
    return (
      <a href="/sign-in" className="ml-auto text-sm font-medium text-accent hover:underline">
        Sign in
      </a>
    );
  }
  return (
    <div className="ml-auto flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {user.firstName ?? "Account"}
      </span>
      <button
        onClick={() => (window as unknown as ClerkWindow).Clerk?.signOut()}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
