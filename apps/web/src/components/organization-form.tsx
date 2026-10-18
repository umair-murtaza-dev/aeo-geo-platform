'use client';

import { createOrganizationAction } from '@/lib/actions';
import { Button } from '@aeo/ui';
import { useActionState } from 'react';

export function OrganizationForm() {
  const [state, action, pending] = useActionState(createOrganizationAction, undefined);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-1">
        <label htmlFor="org-name">Organization name</label>
        <input id="org-name" name="name" required className="h-10 rounded-md border border-border px-3" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="org-slug">Slug</label>
        <input id="org-slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="h-10 rounded-md border border-border px-3" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="org-kind">Type</label>
        <select id="org-kind" name="kind" className="h-10 rounded-md border border-border px-3" defaultValue="AGENCY">
          <option value="AGENCY">Agency</option>
          <option value="BUSINESS">Business</option>
        </select>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create organization'}
      </Button>
    </form>
  );
}
