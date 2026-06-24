import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  thisWeekStart,
  type UsageTotals,
  type WeeklyRow,
  type UserUsageRow,
} from "@/lib/usage";

export const getUserUsage = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_usage")
    .select("week_start, total_grams, total_minutes, job_count")
    .eq("user_id", userId)
    .order("week_start", { ascending: false });

  const rows = (data ?? []) as {
    week_start: string;
    total_grams: number;
    total_minutes: number;
    job_count: number;
  }[];

  const week = thisWeekStart();
  const thisWeekRow = rows.find((r) => r.week_start === week);

  const lifetime: UsageTotals = rows.reduce(
    (acc, r) => ({
      grams: acc.grams + (r.total_grams ?? 0),
      minutes: acc.minutes + (r.total_minutes ?? 0),
      count: acc.count + (r.job_count ?? 0),
    }),
    { grams: 0, minutes: 0, count: 0 },
  );

  const weeks: WeeklyRow[] = rows.slice(0, 8).map((r) => ({
    weekStart: r.week_start,
    grams: r.total_grams,
    minutes: r.total_minutes,
    count: r.job_count,
  }));

  return {
    thisWeek: thisWeekRow
      ? {
          grams: thisWeekRow.total_grams,
          minutes: thisWeekRow.total_minutes,
          count: thisWeekRow.job_count,
        }
      : { grams: 0, minutes: 0, count: 0 },
    lifetime,
    weeks,
  };
});

type ProfileRel = {
  name: string;
  email: string;
  role: "user" | "admin";
};

type AdminUsageRow = {
  user_id: string;
  week_start: string;
  total_grams: number;
  total_minutes: number;
  job_count: number;
  updated_at: string;
  profile: ProfileRel | ProfileRel[] | null;
};

function unwrap(rel: ProfileRel | ProfileRel[] | null): ProfileRel | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

export const getAllUsersUsage = cache(async (): Promise<UserUsageRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_usage")
    .select(
      `
      user_id, week_start, total_grams, total_minutes, job_count, updated_at,
      profile:profiles!weekly_usage_user_id_fkey(name, email, role)
    `,
    )
    .order("week_start", { ascending: false });

  const rows = (data ?? []) as AdminUsageRow[];
  const week = thisWeekStart();
  const map = new Map<string, UserUsageRow>();

  for (const r of rows) {
    const profile = unwrap(r.profile);
    if (!profile) continue;
    const userId = r.user_id;

    let agg = map.get(userId);
    if (!agg) {
      agg = {
        userId,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        lifetime: { grams: 0, minutes: 0, count: 0 },
        thisWeek: { grams: 0, minutes: 0, count: 0 },
        lastUpdated: r.updated_at,
      };
      map.set(userId, agg);
    }

    agg.lifetime.grams += r.total_grams ?? 0;
    agg.lifetime.minutes += r.total_minutes ?? 0;
    agg.lifetime.count += r.job_count ?? 0;

    if (r.week_start === week) {
      agg.thisWeek.grams += r.total_grams ?? 0;
      agg.thisWeek.minutes += r.total_minutes ?? 0;
      agg.thisWeek.count += r.job_count ?? 0;
    }

    if (!agg.lastUpdated || r.updated_at > agg.lastUpdated) {
      agg.lastUpdated = r.updated_at;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.lifetime.grams - a.lifetime.grams,
  );
});
