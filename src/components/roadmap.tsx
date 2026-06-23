"use client";

import { motion } from "motion/react";
import { Check, Lightbulb, Mail, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "ready" | "next" | "ideas";

type Item = {
  status: Status;
  title: string;
  description: string;
};

// Friendly contact for the "got an idea?" card. Change this to whatever
// you'd like colleagues to reach.
const CONTACT_EMAIL = "vladutoid@gmail.com";
const CONTACT_NAME = "Vlad";
const CONTACT_INITIAL = "V";

const SUGGESTION_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "SRO Lab — a suggestion",
)}&body=${encodeURIComponent("Hi Vlad,\n\n")}`;

const ITEMS: Item[] = [
  // Ready (things they can use today)
  {
    status: "ready",
    title: "Send a print to the queue",
    description:
      "Upload an STL or paste a Printables link, write a quick description, pick a color. That's it — the queue takes care of the rest.",
  },
  {
    status: "ready",
    title: "See where you are in line",
    description:
      "The queue shows what's printing now and what's up next, with your spot in line clearly marked.",
  },
  {
    status: "ready",
    title: "Get an email when your print is ready",
    description:
      "When your print starts, finishes, or doesn't work out, you get an email so you know what's going on.",
  },
  {
    status: "ready",
    title: "Photos of every finished print",
    description:
      "When the print comes off the bed, a photo gets attached. You see it on your history page and the team sees it in the gallery.",
  },
  {
    status: "ready",
    title: "Your own print history",
    description:
      "Everything you've ever sent to the queue, all in one place under History.",
  },
  {
    status: "ready",
    title: "Browse what the team has made",
    description:
      "The Gallery is a grid of every completed print the team has shared. Good for inspiration.",
  },

  // Coming soon (close on the to-do list)
  {
    status: "next",
    title: "A queue that updates itself",
    description:
      "Right now the page only refreshes when you reload it. Soon you'll see things move live as they happen.",
  },
  {
    status: "next",
    title: "Emails for everyone, not just me",
    description:
      "Right now only I get emails (boring email setup detail). Once that's sorted, the rest of the team gets them too.",
  },
  {
    status: "next",
    title: "Drag jobs around to reorder",
    description:
      "Rearrange the queue by dragging prints into the order you want, instead of bumping them to the top or bottom.",
  },
  {
    status: "next",
    title: "Click a print to see more",
    description:
      "A dedicated page for each print with the description, every photo, and a place for the team to chime in.",
  },

  // Ideas (would be cool, not committed yet)
  {
    status: "ideas",
    title: "A gentle reminder to pick up your print",
    description:
      "If your print has been ready for a while and you haven't come by, a small nudge to come grab it.",
  },
  {
    status: "ideas",
    title: "Updates in Slack or Teams",
    description:
      "Instead of email, get a ping in our shared channel when something changes.",
  },
  {
    status: "ideas",
    title: "Pop-up notifications in your browser",
    description:
      "If you keep the app open in a tab, get a soft notification when something happens.",
  },
  {
    status: "ideas",
    title: "More than one printer",
    description:
      "If SRO ever has more than one printer running, each gets its own queue.",
  },
];

const STATUS_META: Record<
  Status,
  { label: string; tint: string; ring: string; icon: typeof Check }
> = {
  ready: {
    label: "Ready",
    tint: "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300",
    ring: "ring-bambu-500/30",
    icon: Check,
  },
  next: {
    label: "Coming soon",
    tint: "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300",
    ring: "ring-bambu-500/30",
    icon: Play,
  },
  ideas: {
    label: "An idea",
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/30",
    icon: Lightbulb,
  },
};

const SECTION_LABELS: Record<Status, string> = {
  ready: "Ready to use",
  next: "Coming soon",
  ideas: "Ideas brewing",
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
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-1.5 flex-col bg-bambu-500/5">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="flex-1 border-b border-bambu-500/20" />
        ))}
      </div>

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
      <rect x="8" y="0" width="16" height="26" rx="2" fill="currentColor" />
      <rect x="11" y="6" width="10" height="1" fill="currentColor" opacity="0.6" />
      <rect x="11" y="10" width="10" height="1" fill="currentColor" opacity="0.6" />
      <rect x="11" y="14" width="10" height="1" fill="currentColor" opacity="0.6" />
      <path d="M7 26 L25 26 L20 40 L12 40 Z" fill="currentColor" />
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

function Section({ status, items }: { status: Status; items: Item[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-12">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {SECTION_LABELS[status]}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            status === "ideas"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300",
          )}
        >
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

function SuggestionCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative mt-6 overflow-hidden rounded-3xl border border-bambu-500/30 bg-gradient-to-br from-bambu-500/10 via-bambu-500/[0.04] to-transparent p-8 sm:p-10"
    >
      {/* Decorative pulsing dot */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-bambu-500/20 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-bambu-500/15 text-xl font-semibold text-bambu-700 ring-1 ring-bambu-500/30 dark:text-bambu-300">
          {CONTACT_INITIAL}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bambu-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-bambu-700 dark:text-bambu-300">
              From the maker
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Got an idea? Tell me about it.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Hey — I&apos;m {CONTACT_NAME}, I built SRO Lab for our team. If
            there&apos;s something you&apos;d love to see, or something annoying
            you&apos;d like gone, drop me a quick note. I read every one and
            most of them end up on this page.
          </p>

          <a
            href={SUGGESTION_MAILTO}
            className="group mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-bambu-500 px-5 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-out hover:bg-bambu-600 hover:shadow-md hover:gap-3"
          >
            <Mail className="h-4 w-4" />
            Send {CONTACT_NAME} a suggestion
          </a>

          <p className="mt-4 text-[11px] text-muted">
            Or just walk over and say hi. That works too.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

export function Roadmap() {
  const ready = ITEMS.filter((i) => i.status === "ready");
  const next = ITEMS.filter((i) => i.status === "next");
  const ideas = ITEMS.filter((i) => i.status === "ideas");

  return (
    <div className="relative flex-1">
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
              Everything SRO Lab can do today, what&apos;s coming next, and the
              ideas still floating around. If something here would make your
              life easier, scroll to the bottom and tell me.
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

        <Section status="ready" items={ready} />
        <Section status="next" items={next} />
        <Section status="ideas" items={ideas} />

        <SuggestionCard />
      </div>
    </div>
  );
}
