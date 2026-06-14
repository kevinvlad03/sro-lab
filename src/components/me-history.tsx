"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Inbox,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import type { JobStatus, JobVisibility, SettingsMode } from "@/lib/types";

export type MeJob = {
  id: string;
  title: string;
  status: JobStatus;
  visibility: JobVisibility;
  settingsMode: SettingsMode;
  color: string | null;
  material: string | null;
  infill: number | null;
  quantity: number;
  sourceUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  completedAt: string | null;
  photoUrls: string[];
};

function relativeDate(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function MeCard({ job }: { job: MeJob }) {
  const VisIcon = job.visibility === "private" ? EyeOff : Eye;
  const chips = [
    job.color ? job.color : null,
    job.material ? job.material : null,
    typeof job.infill === "number" ? `${job.infill}% infill` : null,
    job.quantity > 1 ? `×${job.quantity}` : null,
  ].filter(Boolean) as string[];

  const when =
    job.status === "done" || job.status === "failed" || job.status === "rejected" || job.status === "cancelled"
      ? job.completedAt ?? job.createdAt
      : job.createdAt;

  return (
    <motion.div
      layout
      variants={fadeUp}
      whileHover={{ y: -2, transition: transitions.smooth }}
      className="rounded-2xl border border-border bg-surface p-4 transition-colors duration-300 hover:border-bambu-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight">
            {job.sourceUrl ? (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-bambu-700 dark:hover:text-bambu-300 transition-colors"
              >
                {job.title}
              </a>
            ) : (
              job.title
            )}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{relativeDate(when)}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {(chips.length > 0 || job.settingsMode === "creator") && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {job.settingsMode === "creator" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-bambu-500/30 bg-bambu-500/5 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
              <Sparkles className="h-3 w-3" />
              Creator preset
            </span>
          )}
          {chips.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted"
            >
              {c}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
            <VisIcon className="h-3 w-3" />
            {job.visibility === "private" ? "Private" : "Team"}
          </span>
        </div>
      )}

      {job.status === "rejected" && job.rejectionReason && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{job.rejectionReason}</span>
        </div>
      )}

      {job.photoUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {job.photoUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`${job.title} photo ${i + 1}`}
              className="aspect-square w-full rounded-xl border border-border object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Section({
  label,
  count,
  jobs,
}: {
  label: string;
  count?: number;
  jobs: MeJob[];
}) {
  if (jobs.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
        {typeof count === "number" && (
          <span className="rounded-full bg-bambu-500/10 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
            {count}
          </span>
        )}
      </h2>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="flex flex-col gap-2.5"
      >
        {jobs.map((job) => (
          <MeCard key={job.id} job={job} />
        ))}
      </motion.div>
    </section>
  );
}

export function MeHistory({
  active,
  completed,
  other,
}: {
  active: MeJob[];
  completed: MeJob[];
  other: MeJob[];
}) {
  const empty =
    active.length === 0 && completed.length === 0 && other.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="mb-8 flex items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your history</h1>
          <p className="mt-1 text-sm text-muted">
            Everything you&apos;ve submitted, all in one place.
          </p>
        </div>
        <Link
          href="/submit"
          className="group inline-flex h-10 items-center gap-2 rounded-full bg-bambu-500 px-5 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-out hover:bg-bambu-600 hover:shadow-md hover:gap-3"
        >
          Submit
          <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      {empty ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.smooth}
          className="rounded-3xl border border-border bg-surface p-10 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
            <Inbox className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            Nothing here yet
          </h2>
          <p className="mt-1 text-sm text-muted">
            Submit your first print to start your history.
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-8">
          <Section label="Active" count={active.length} jobs={active} />
          <Section label="Completed" count={completed.length} jobs={completed} />
          <Section label="Other" count={other.length} jobs={other} />
        </div>
      )}
    </div>
  );
}
