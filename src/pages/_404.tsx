export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-muted-foreground">
        This page doesn't exist.
      </p>
      <a href="/" className="mt-8 inline-block text-accent underline">
        Back home
      </a>
    </div>
  );
}
