"use client";

import { motion } from "motion/react";
import { Activity, Clock, Layers, ShieldCheck } from "lucide-react";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import {
  FILAMENT_QUOTA_GRAMS,
  HEAVY_TIME_MINUTES_PER_WEEK,
  formatGrams,
  formatMinutes,
  type UserUsageRow,
} from "@/lib/usage";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function quotaTint(pct: number) {
  if (pct >= 100) return { bar: "bg-red-500", text: "text-red-700 dark:text-red-300" };
  if (pct >= 80) return { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" };
  return { bar: "bg-bambu-500", text: "text-bambu-700 dark:text-bambu-300" };
}

export function AdminUsage({ rows }: { rows: UserUsageRow[] }) {
  const totalGrams = rows.reduce((sum, r) => sum + r.lifetime.grams, 0);
  const totalMinutes = rows.reduce((sum, r) => sum + r.lifetime.minutes, 0);
  const totalCount = rows.reduce((sum, r) => sum + r.lifetime.count, 0);

  return (
    <section className="mt-10">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <Activity className="h-3.5 w-3.5" />
        Filament usage
      </h2>

      {rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.smooth}
          className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted"
        >
          No completed prints with stats yet. Once you fill in time and filament on
          Mark done, totals will land here.
        </motion.div>
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mb-3 grid grid-cols-3 gap-2.5"
          >
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3.5"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <Layers className="h-3 w-3" />
                Team total
              </div>
              <div className="text-lg font-semibold">{formatGrams(totalGrams)}</div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3.5"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <Clock className="h-3 w-3" />
                Print time
              </div>
              <div className="text-lg font-semibold">
                {formatMinutes(totalMinutes)}
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3.5"
            >
              <div className="text-[11px] text-muted">Prints</div>
              <div className="text-lg font-semibold">{totalCount}</div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col gap-2"
          >
            {rows.map((row) => {
              const quotaPct = Math.min(
                (row.lifetime.grams / FILAMENT_QUOTA_GRAMS) * 100,
                999,
              );
              const tint = quotaTint(quotaPct);
              const heavy = row.thisWeek.minutes >= HEAVY_TIME_MINUTES_PER_WEEK;

              return (
                <motion.div
                  key={row.userId}
                  variants={fadeUp}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bambu-500/15 text-xs font-semibold text-bambu-700 dark:text-bambu-300">
                      {initialsOf(row.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {row.name}
                        </p>
                        {row.role === "admin" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-bambu-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-bambu-700 dark:text-bambu-300">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Admin
                          </span>
                        )}
                        {heavy && (
                          <span
                            title="Lot of print time this week — consider pushing their next submit down the queue"
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300"
                          >
                            <Clock className="h-2.5 w-2.5" />
                            Heavy this week
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted">{row.email}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-right">
                      <span className="text-[10px] uppercase tracking-wider text-muted">
                        Filament
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted">
                        Time
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted">
                        Prints
                      </span>

                      <span className="text-sm font-semibold tabular-nums">
                        {formatGrams(row.thisWeek.grams)}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMinutes(row.thisWeek.minutes)}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {row.thisWeek.count}
                      </span>
                      <span className="text-[10px] text-muted">this week</span>
                      <span className="text-[10px] text-muted">this week</span>
                      <span className="text-[10px] text-muted">this week</span>

                      <span className="mt-1 text-sm font-semibold tabular-nums">
                        {formatGrams(row.lifetime.grams)}
                      </span>
                      <span className="mt-1 text-sm font-semibold tabular-nums">
                        {formatMinutes(row.lifetime.minutes)}
                      </span>
                      <span className="mt-1 text-sm font-semibold tabular-nums">
                        {row.lifetime.count}
                      </span>
                      <span className="text-[10px] text-muted">total</span>
                      <span className="text-[10px] text-muted">total</span>
                      <span className="text-[10px] text-muted">total</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted">
                        Filament budget
                      </span>
                      <span className={cn("font-medium tabular-nums", tint.text)}>
                        {formatGrams(row.lifetime.grams)} of {formatGrams(FILAMENT_QUOTA_GRAMS)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bambu-500/5">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: Math.min(quotaPct, 100) / 100 }}
                        transition={transitions.smooth}
                        className={cn("h-full origin-left rounded-full", tint.bar)}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </section>
  );
}
