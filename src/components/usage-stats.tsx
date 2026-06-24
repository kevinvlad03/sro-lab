"use client";

import { motion } from "motion/react";
import { Activity, Clock, Layers, Package } from "lucide-react";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import {
  FILAMENT_QUOTA_GRAMS,
  formatGrams,
  formatMinutes,
  type UsageTotals,
  type WeeklyRow,
} from "@/lib/usage";
import { cn } from "@/lib/utils";

function formatWeekStart(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function StatTile({
  label,
  value,
  sub,
  Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: typeof Layers;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex items-center gap-2 text-xs text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </motion.div>
  );
}

function quotaTint(pct: number) {
  if (pct >= 100) return { bar: "bg-red-500", text: "text-red-700 dark:text-red-300" };
  if (pct >= 80) return { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" };
  return { bar: "bg-bambu-500", text: "text-bambu-700 dark:text-bambu-300" };
}

export function UsageStats({
  thisWeek,
  lifetime,
  weeks,
}: {
  thisWeek: UsageTotals;
  lifetime: UsageTotals;
  weeks: WeeklyRow[];
}) {
  const hasAnyHistory = lifetime.count > 0 || weeks.length > 0;
  const quotaPct = Math.min(
    (lifetime.grams / FILAMENT_QUOTA_GRAMS) * 100,
    999,
  );
  const tint = quotaTint(quotaPct);
  const remaining = Math.max(0, FILAMENT_QUOTA_GRAMS - lifetime.grams);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <Activity className="h-3.5 w-3.5" />
        Filament usage
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <StatTile
          label="This week"
          value={formatGrams(thisWeek.grams)}
          sub={`${formatMinutes(thisWeek.minutes)} · ${thisWeek.count} ${thisWeek.count === 1 ? "print" : "prints"}`}
          Icon={Layers}
        />
        <StatTile
          label="All time"
          value={formatGrams(lifetime.grams)}
          sub={`${lifetime.count} ${lifetime.count === 1 ? "print" : "prints"}`}
          Icon={Package}
        />
        <StatTile
          label="Print time"
          value={formatMinutes(lifetime.minutes)}
          sub={`${formatMinutes(thisWeek.minutes)} this week`}
          Icon={Clock}
        />
        <StatTile
          label="Last 8 weeks"
          value={
            weeks.length > 0
              ? formatGrams(weeks.reduce((sum, w) => sum + w.grams, 0))
              : "0g"
          }
          sub={
            weeks.length > 0
              ? `peaked at ${formatGrams(Math.max(...weeks.map((w) => w.grams)))}`
              : "no data yet"
          }
          Icon={Activity}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="mt-3 rounded-2xl border border-border bg-surface p-4"
      >
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-xs font-medium text-muted">
            Filament budget
          </span>
          <span className={cn("text-xs font-medium tabular-nums", tint.text)}>
            {formatGrams(lifetime.grams)} of {formatGrams(FILAMENT_QUOTA_GRAMS)}
            {quotaPct < 100 ? (
              <span className="text-muted">
                {" "}
                · {formatGrams(remaining)} left
              </span>
            ) : (
              <span> · over budget</span>
            )}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-bambu-500/5">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.min(quotaPct, 100) / 100 }}
            transition={transitions.smooth}
            className={cn("h-full origin-left rounded-full", tint.bar)}
            style={{ width: "100%" }}
          />
        </div>
      </motion.div>

      {hasAnyHistory && weeks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.smooth}
          className="mt-3 rounded-2xl border border-border bg-surface p-4"
        >
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Last 8 weeks
          </div>
          <div className="flex items-end justify-between gap-1.5">
            {weeks
              .slice()
              .reverse()
              .map((w) => {
                const max = Math.max(...weeks.map((x) => x.grams), 1);
                const heightPct = Math.max(4, (w.grams / max) * 100);
                return (
                  <div
                    key={w.weekStart}
                    className="group flex flex-1 flex-col items-center gap-1.5"
                    title={`${formatWeekStart(w.weekStart)}: ${formatGrams(w.grams)} · ${formatMinutes(w.minutes)} · ${w.count} ${w.count === 1 ? "print" : "prints"}`}
                  >
                    <div className="relative flex h-24 w-full items-end overflow-hidden rounded-md bg-bambu-500/5">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={transitions.smooth}
                        style={{ height: `${heightPct}%` }}
                        className="w-full origin-bottom rounded-md bg-bambu-500/40 transition-colors duration-300 group-hover:bg-bambu-500/70"
                      />
                    </div>
                    <span className="text-[10px] text-muted">
                      {formatWeekStart(w.weekStart)}
                    </span>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}
    </section>
  );
}
