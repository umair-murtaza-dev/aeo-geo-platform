import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">That address is not part of the foundation application.</p>
      <Link href="/" className="text-sm underline">
        Back to home
      </Link>
    </section>
  );
}
