import { Island } from "@thexjs/core";
import ClerkMount from "@/islands/clerk-mount";

export const islands = { "clerk-mount": ClerkMount };

export default function SignUpPage() {
  return (
    <div className="px-6 py-12">
      <h1 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold">
        Create your account
      </h1>
      <Island name="clerk-mount" client="load">
      <ClerkMount />
    </Island>
    </div>
  );
}
