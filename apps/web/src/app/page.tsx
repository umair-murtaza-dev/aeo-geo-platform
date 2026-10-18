import { foundationCopy } from '@/lib/navigation';
import { Button } from '@aeo/ui';
import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="grid gap-8">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Milestone M01</p>
        <h1 className="text-4xl font-semibold tracking-tight">{foundationCopy.title}</h1>
        <p className="text-lg text-muted-foreground">{foundationCopy.summary}</p>
        <p>{foundationCopy.empty}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </section>
  );
}
