/** Formats an ISO "YYYY-MM-DD" string as "Mon YYYY" (e.g. "Jun 2021"). Not
 * used for the literal string "Present", which is rendered as-is by the
 * caller. */
export function formatWorkDate(iso: string): string {
  const [year, month] = iso.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
