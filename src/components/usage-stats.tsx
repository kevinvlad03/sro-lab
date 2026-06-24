"use client";

import { motion } from "motion/react";
import { Activity, Clock, Layers, Package } from "lucide-react";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import type { UsageTotals, WeeklyRow } from "@/lib/usage";
import { formatGrams, formatMinutes } from "@/lib/usage";

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
          sub="cumulative"
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
