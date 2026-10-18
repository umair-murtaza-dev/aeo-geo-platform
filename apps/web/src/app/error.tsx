'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" className="space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">The page could not be displayed. No data was changed by this message.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md border border-border px-4 py-2 text-sm"
      >
        Try again
      </button>
    </section>
  );
}
