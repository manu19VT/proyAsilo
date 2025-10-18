export function monthsUntil(dateISO: string): number {
  const now = new Date();
  const d = new Date(dateISO);
  const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  return months + (d.getDate() >= now.getDate() ? 0 : -1);
}

export const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString() : "";
