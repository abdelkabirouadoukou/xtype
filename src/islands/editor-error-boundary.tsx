import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export default class EditorErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[xtype] editor crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="font-[family-name:var(--font-serif)] text-2xl font-semibold">
            The editor hit a snag
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error.message}
          </p>
          <p className="text-xs text-muted-foreground">
            Your work is saved locally — reloading is safe.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-accent px-4 py-2 text-sm text-white"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
