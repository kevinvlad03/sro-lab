"use client";

import { motion } from "motion/react";
import { Check, Lightbulb, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "shipped" | "next" | "considering";

type Item = {
  status: Status;
  title: string;
  description: string;
};

const ITEMS: Item[] = [
  // Shipped
  {
    status: "shipped",
    title: "Print queue with admin controls",
    description:
      "Live queue ordered by priority, with Start, Reject, and Top/Bottom controls on every job.",
  },
  {
    status: "shipped",
    title: "Email notifications",
    description:
      "Resend-powered emails when your print starts, finishes, fails, or gets rejected — with the finished photo embedded.",
  },
  {
    status: "shipped",
    title: "Finished-print photos",
    description:
      "Admin attaches a photo on Mark done. Shows up in your history and the team gallery.",
  },
  {
    status: "shipped",
    title: "Direct uploads and downloads",
    description:
      "STLs upload from your browser straight to storage. Owners and admins can re-download anytime.",
  },
  {
    status: "shipped",
    title: "Team gallery",
    description:
      "Every public completed print in one grid, newest first. A nice scroll when you want inspiration.",
  },
  {
    status: "shipped",
    title: "Admin user approvals",
    description:
      "One-click Approve, Make admin, or Revoke for every signup, all from /admin.",
  },

  // Up next
  {
    status: "next",
    title: "Realtime queue",
    description:
      "Queue, history, gallery, and the notification bell update live without a refresh, via Supabase channels.",
  },
  {
    status: "next",
    title: "Custom email domain",
    description:
      "Verify a domain in Resend so colleagues get the emails too, not just the admin sandbox address.",
  },
  {
    status: "next",
    title: "Drag to reorder the queue",
    description:
      "Replace the Top/Bottom buttons with native drag-and-drop on the queued list.",
  },
  {
    status: "next",
    title: "Job detail pages",
    description:
      "/jobs/[id] with the full description, status timeline, every photo, and a comments thread.",
  },

  // Considering
  {
    status: "considering",
    title: "Pickup reminder emails",
    description:
      "Friendly nudge when a print has been done for more than 24 hours and nobody's claimed it.",
  },
  {
    status: "considering",
    title: "Slack and Teams webhooks",
    description:
      "Post status changes to a shared channel so the whole team sees the queue without opening the app.",
  },
  {
    status: "considering",
    title: "Web push notifications",
    description:
      "Live browser pings while the app is open, for users who keep it pinned.",
  },
  {
    status: "considering",
    title: "Multiple printers",
    description:
      "Per-printer queues once SRO outgrows the single Bambu and adds a second machine.",
  },
];

const STATUS_META: Record<
  Status,
  { label: string; tint: string; ring: string; icon: typeof Check }
> = {
  shipped: {
    label: "Shipped",
    tint: "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300",
    ring: "ring-bambu-500/30",
    icon: Check,
  },
  next: {
    label: "Up next",
    tint: "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300",
    ring: "ring-bambu-500/30",
    icon: Play,
  },
  considering: {
    label: "Considering",
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/30",
    icon: Lightbulb,
  },
};

function StatusPill({ status }: { status: Status }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        m.tint,
        m.ring,
      )}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function PrintCard({ item, index }: { item: Item; index: number }) {
  // Stagger cards within a row so they print one after another instead
  // of all at once.
  const delay = (index % 3) * 0.18;
  const buildDuration = 1.4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-h-[180px] overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {/* Decorative layer lines on the left edge — always visible, evokes
          the side-view of a print as it's being built up. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-1.5 flex-col bg-bambu-500/5">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="flex-1 border-b border-bambu-500/20" />
        ))}
      </div>

      {/* Material being deposited — gradient that reveals from bottom up
          via clip-path. */}
      <motion.div
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        whileInView={{ clipPath: "inset(0% 0 0 0)" }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          duration: buildDuration,
          ease: [0.16, 1, 0.3, 1],
          delay: delay + 0.1,
        }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bambu-500/12 via-bambu-500/4 to-transparent"
      />

      {/* The print head — a thin glowing line that travels from bottom
          to top of the card while the material fills in behind it. */}
      <motion.div
        initial={{ top: "calc(100% - 1px)", opacity: 0 }}
        whileInView={{
          top: ["calc(100% - 1px)", "calc(100% - 1px)", "-1px", "-1px"],
          opacity: [0, 1, 1, 0],
        }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          duration: buildDuration,
          ease: [0.16, 1, 0.3, 1],
          delay: delay + 0.1,
          times: [0, 0.05, 0.92, 1],
        }}
        className="pointer-events-none absolute left-1.5 right-0 h-px bg-bambu-500 shadow-[0_0_12px_2px_rgba(0,174,66,0.65)]"
      />

      {/* Content fades in once the print is mostly done. */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          duration: 0.5,
          delay: delay + buildDuration * 0.75,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative px-5 py-5 pl-7"
      >
        <StatusPill status={item.status} />
        <h3 className="mt-3 text-base font-semibold tracking-tight">
          {item.title}
        </h3>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          {item.description}
        </p>
      </motion.div>
    </motion.div>
  );
}

function Extruder() {
  return (
    <svg
      viewBox="0 0 32 80"
      width="32"
      height="80"
      className="text-zinc-400 dark:text-zinc-500"
      aria-hidden
    >
      {/* Body */}
      <rect x="8" y="0" width="16" height="26" rx="2" fill="currentColor" />
      {/* Cooling vent stripes */}
      <rect x="11" y="6" width="10" height="1" fill="currentColor" opacity="0.6" />
      <rect x="11" y="10" width="10" height="1" fill="currentColor" opacity="0.6" />
      <rect x="11" y="14" width="10" height="1" fill="currentColor" opacity="0.6" />
      {/* Nozzle tip */}
      <path d="M7 26 L25 26 L20 40 L12 40 Z" fill="currentColor" />
      {/* Filament drops, pulsing one after the other */}
      <motion.circle
        cx="16"
        r="2.5"
        fill="#00AE42"
        initial={{ cy: 42, opacity: 0 }}
        animate={{ cy: [42, 72], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeIn",
          times: [0, 0.1, 0.85, 1],
        }}
      />
      <motion.circle
        cx="16"
        r="2"
        fill="#00AE42"
        initial={{ cy: 42, opacity: 0 }}
        animate={{ cy: [42, 72], opacity: [0, 0.8, 0.8, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeIn",
          delay: 0.9,
          times: [0, 0.1, 0.85, 1],
        }}
      />
    </svg>
  );
}

function Section({ title, items }: { title: string; items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-12">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
        <span className="rounded-full bg-bambu-500/10 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
          {items.length}
        </span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <PrintCard key={item.title} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}

export function Roadmap() {
  const shipped = ITEMS.filter((i) => i.status === "shipped");
  const next = ITEMS.filter((i) => i.status === "next");
  const considering = ITEMS.filter((i) => i.status === "considering");

  return (
    <div className="relative flex-1">
      {/* Print bed grid background, dimmed so it doesn't compete with content. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_top,_rgba(0,0,0,0.8),_transparent_70%)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,174,66,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,66,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-semibold tracking-tight"
            >
              What&apos;s <span className="text-bambu-500">next</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-2 max-w-xl text-sm text-muted leading-relaxed"
            >
              Like the queue itself, every feature is a print job. Shipped means
              it&apos;s on the bed. Up next is queued. Considering is still on the
              drawing board.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="hidden sm:block"
          >
            <Extruder />
          </motion.div>
        </div>

        <Section title="Shipped" items={shipped} />
        <Section title="Up next" items={next} />
        <Section title="Considering" items={considering} />
      </div>
    </div>
  );
}
