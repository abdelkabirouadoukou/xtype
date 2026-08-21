export const mode = "static";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-4 text-muted-foreground">
        Editor preferences and data management will live here. GitHub sync is
        planned for a future release.
      </p>
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nothing to configure yet — see{" "}
        <a
          className="text-accent underline"
          href="https://github.com/abdelkabirouadoukou/xtype/issues"
        >
          the issue tracker
        </a>{" "}
        for what is coming.
      </div>
    </div>
  );
}
