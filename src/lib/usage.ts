// Pure types and formatters for filament-usage stats. Safe to import
// from client components — no server-only code here. Server-side
// queries live in src/lib/usage-server.ts.

export type UsageTotals = {
  grams: number;
  minutes: number;
  count: number;
};

export type WeeklyRow = {
  weekStart: string;
  grams: number;
  minutes: number;
  count: number;
};

export type UserUsageRow = {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  lifetime: UsageTotals;
  thisWeek: UsageTotals;
  lastUpdated: string | null;
};

// Monday of the current week (UTC) as YYYY-MM-DD. Matches Postgres's
// `date_trunc('week', ...)` which also pins to Monday.
export function thisWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay() || 7; // Sunday = 0 → treat as 7
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  monday.setUTCDate(monday.getUTCDate() - (dayOfWeek - 1));
  return monday.toISOString().slice(0, 10);
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatGrams(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)}kg`;
  return `${grams}g`;
}
