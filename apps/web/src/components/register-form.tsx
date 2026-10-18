'use client';

import { registerAction } from '@/lib/actions';
import { Button } from '@aeo/ui';
import { useActionState } from 'react';

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-1">
        <label htmlFor="register-name">Name</label>
        <input id="register-name" name="name" autoComplete="name" className="h-10 rounded-md border border-border px-3" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 rounded-md border border-border px-3"
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="h-10 rounded-md border border-border px-3"
        />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
