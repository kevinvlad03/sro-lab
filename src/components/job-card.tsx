"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  Eye,
  EyeOff,
  FileBox,
  Link as LinkIcon,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import {
  advanceJobStatus,
  bumpJobPriority,
  rejectJob,
} from "@/lib/jobs-actions";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { JobStatus, JobVisibility, SettingsMode } from "@/lib/types";

export type JobCardProps = {
  id: string;
  title: string;
  ownerName: string;
  status: JobStatus;
  visibility: JobVisibility;
  settingsMode: SettingsMode;
  color: string | null;
  material: string | null;
  infill: number | null;
  quantity: number;
  hasFile: boolean;
  hasLink: boolean;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  position?: number;
  isOwn: boolean;
  isAdmin: boolean;
};

function timeAgo(iso: string) {
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

const adminBtn =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors duration-300";

const adminBtnPrimary =
  "bg-bambu-500 text-white hover:bg-bambu-600";

const adminBtnGhost =
  "border border-border bg-background text-foreground hover:border-bambu-500/40 hover:text-bambu-700 dark:hover:text-bambu-300";

const adminBtnDanger =
  "border border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300 hover:bg-red-500/10";

function Thumb({
  thumbnailUrl,
  hasFile,
  hasLink,
  position,
}: {
  thumbnailUrl: string | null;
  hasFile: boolean;
  hasLink: boolean;
  position?: number;
}) {
  const FallbackIcon = hasFile ? FileBox : LinkIcon;
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-bambu-500/5 text-bambu-500/80">
          {hasFile || hasLink ? (
            <FallbackIcon className="h-5 w-5" />
          ) : null}
        </div>
      )}
      {typeof position === "number" && (
        <span className="absolute -left-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bambu-500 px-1 text-[11px] font-semibold tabular-nums text-white shadow-sm">
          {position}
        </span>
      )}
    </div>
  );
}

export function JobCard(props: JobCardProps) {
  const {
    id,
    title,
    ownerName,
    status,
    visibility,
    settingsMode,
    color,
    material,
    infill,
    quantity,
    hasFile,
    hasLink,
    sourceUrl,
    thumbnailUrl,
    createdAt,
    position,
    isOwn,
    isAdmin,
  } = props;

  const [rejectOpen, setRejectOpen] = useState(false);

  const VisIcon = visibility === "private" ? EyeOff : Eye;

  const chips = [
    color ? color : null,
    material ? material : null,
    typeof infill === "number" ? `${infill}% infill` : null,
    quantity > 1 ? `×${quantity}` : null,
  ].filter(Boolean) as string[];

  const settingsChip =
    settingsMode === "creator"
      ? { label: "Creator preset", Icon: Sparkles }
      : null;

  const showAdminRow = isAdmin && (status === "queued" || status === "printing");

  return (
    <motion.div
      layout
      whileHover={{ y: -2, transition: transitions.smooth }}
      className="group rounded-2xl border border-border bg-surface p-4 transition-colors duration-300 hover:border-bambu-500/40"
    >
      <div className="flex items-start gap-3">
        <Thumb
          thumbnailUrl={thumbnailUrl}
          hasFile={hasFile}
          hasLink={hasLink}
          position={position}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold tracking-tight">
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-bambu-700 dark:hover:text-bambu-300 transition-colors"
                  >
                    {title}
                  </a>
                ) : (
                  title
                )}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {isOwn ? "You" : ownerName} · {timeAgo(createdAt)}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          {(chips.length > 0 || settingsChip) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {settingsChip && (
                <span className="inline-flex items-center gap-1 rounded-full border border-bambu-500/30 bg-bambu-500/5 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
                  <settingsChip.Icon className="h-3 w-3" />
                  {settingsChip.label}
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
                {visibility === "private" ? "Private" : "Team"}
              </span>
            </div>
          )}

          {showAdminRow && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              {status === "queued" && (
                <>
                  <form action={advanceJobStatus}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="action" value="start" />
                    <button className={cn(adminBtn, adminBtnPrimary)}>
                      <Play className="h-3.5 w-3.5" />
                      Start
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setRejectOpen((v) => !v)}
                    className={cn(adminBtn, adminBtnDanger)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <form action={bumpJobPriority}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="direction" value="top" />
                    <button
                      title="Move to top"
                      className={cn(adminBtn, adminBtnGhost)}
                    >
                      <ArrowUpToLine className="h-3.5 w-3.5" />
                    </button>
                  </form>
                  <form action={bumpJobPriority}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="direction" value="bottom" />
                    <button
                      title="Move to bottom"
                      className={cn(adminBtn, adminBtnGhost)}
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </>
              )}

              {status === "printing" && (
                <>
                  <form action={advanceJobStatus}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="action" value="done" />
                    <button className={cn(adminBtn, adminBtnPrimary)}>
                      <Check className="h-3.5 w-3.5" />
                      Mark done
                    </button>
                  </form>
                  <form action={advanceJobStatus}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="action" value="failed" />
                    <button className={cn(adminBtn, adminBtnDanger)}>
                      <X className="h-3.5 w-3.5" />
                      Mark failed
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {rejectOpen && status === "queued" && isAdmin && (
              <motion.form
                key="reject-form"
                action={rejectJob}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="overflow-hidden"
              >
                <input type="hidden" name="job_id" value={id} />
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted">
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    rows={2}
                    maxLength={500}
                    placeholder="Why are you rejecting this print?"
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-xs transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20 resize-none"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRejectOpen(false)}
                      className={cn(adminBtn, adminBtnGhost)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={cn(adminBtn, adminBtnDanger)}>
                      Confirm reject
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
