"use client";

import { motion } from "motion/react";
import { Activity, Clock, Layers } from "lucide-react";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import { formatGrams, formatMinutes, type UserUsageRow } from "@/lib/usage";

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

export function AdminUsage({ rows }: { rows: UserUsageRow[] }) {
  const totalGrams = rows.reduce((sum, r) => sum + r.lifetime.grams, 0);
  const totalMinutes = rows.reduce((sum, r) => sum + r.lifetime.minutes, 0);
  const totalCount = rows.reduce((sum, r) => sum + r.lifetime.count, 0);
  const maxGrams = Math.max(1, ...rows.map((r) => r.lifetime.grams));

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
              const widthPct = (row.lifetime.grams / maxGrams) * 100;
              return (
                <motion.div
                  key={row.userId}
                  variants={fadeUp}
                  className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4"
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: widthPct / 100 }}
                    transition={transitions.smooth}
                    className="absolute inset-y-0 left-0 origin-left bg-bambu-500/[0.06]"
                    style={{ width: "100%" }}
                  />
                  <div className="relative flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bambu-500/15 text-xs font-semibold text-bambu-700 dark:text-bambu-300">
                      {initialsOf(row.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {row.name}
                        {row.role === "admin" && (
                          <span className="ml-2 rounded-full bg-bambu-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-bambu-700 dark:text-bambu-300">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">{row.email}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-right">
                      <Stat
                        label="This week"
                        value={formatGrams(row.thisWeek.grams)}
                      />
                      <Stat
                        label="Total"
                        value={formatGrams(row.lifetime.grams)}
                      />
                      <Stat
                        label="Prints"
                        value={String(row.lifetime.count)}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
