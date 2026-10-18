/** Format an instant as an ISO-8601 UTC string. Persistence uses timestamptz; APIs emit this form. */
export function formatUtc(value: Date): string {
  return value.toISOString();
}

export function parseUtc(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid UTC timestamp');
  }
  return date;
}
