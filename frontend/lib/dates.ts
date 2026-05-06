import { isValid, parse } from "date-fns";

/** NASA often returns e.g. `2024-Jan-01 12:30`. */
export function parseNeoApproach(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const patterns = [
    "yyyy-MMM-dd HH:mm",
    "yyyy-MMM-dd HH:mm:ss",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd HH:mm:ss",
  ];
  for (const p of patterns) {
    const d = parse(raw, p, new Date());
    if (isValid(d)) return d;
  }
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) return new Date(t);
  return null;
}
