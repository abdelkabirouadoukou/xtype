import { useEffect, useState } from "react";

const STEPS = [
  { title: "Welcome to xtype", body: "A math document editor that runs entirely in your browser." },
  { title: "Type math inline", body: "Wrap LaTeX in $…$ or $$…$$ for display math. ::asciimath:: works too." },
  { title: "Cmd+P is your hub", body: "Switch chapters, insert tables, toggle equation numbering, export PDF." },
  { title: "Everything saves itself", body: "Autosave to IndexedDB every couple of seconds — even offline." },
];

export default function OnboardingTour() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("xtype:onboarded")) return;
      setStep(0);
      localStorage.setItem("xtype:onboarded", "1");
    } catch {}
  }, []);

  if (step === null) return null;
  const s = STEPS[step];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card p-5 shadow-2xl">
      <p className="text-xs font-semibold tracking-wider text-accent uppercase">
        Step {step + 1} of {STEPS.length}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-serif)] text-lg font-semibold">
        {s.title}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setStep(null)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
        <button
          onClick={() => setStep(step + 1 < STEPS.length ? step + 1 : null)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white"
        >
          {step + 1 < STEPS.length ? "Next" : "Done"}
        </button>
      </div>
    </div>
  );
}
