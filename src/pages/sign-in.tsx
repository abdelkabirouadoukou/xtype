import { Island } from "@thexjs/core";
import ClerkMount from "@/islands/clerk-mount";

export const islands = { "clerk-mount": ClerkMount };

export default function SignInPage() {
  return (
    <div className="px-6 py-12">
      <h1 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold">
        Welcome back
      </h1>
      <Island name="clerk-mount" client="load" />
    </div>
  );
}
