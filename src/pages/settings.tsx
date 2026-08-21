import { Island } from "@thexjs/core";
import SettingsIsland from "../islands/SettingsIsland";

export const islands = { SettingsIsland };

export const mode = "static";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-4 text-muted-foreground">
        Preferences are stored locally in your browser. GitHub sync is planned
        for a future release.
      </p>
      <Island name="SettingsIsland" client="load">
        <SettingsIsland />
      </Island>
    </div>
  );
}
