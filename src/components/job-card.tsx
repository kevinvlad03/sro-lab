"use client";

import { motion } from "motion/react";
import { Eye, EyeOff, FileBox, Link as LinkIcon } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { transitions } from "@/lib/motion";
import type { JobStatus, JobVisibility } from "@/lib/types";

export type JobCardProps = {
  id: string;
  title: string;
  ownerName: string;
  status: JobStatus;
  visibility: JobVisibility;
  color: string | null;
  material: string | null;
  infill: number | null;
  quantity: number;
  hasFile: boolean;
  hasLink: boolean;
  createdAt: string;
  position?: number;
  isOwn: boolean;
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

export function JobCard(props: JobCardProps) {
  const {
    title,
    ownerName,
    status,
    visibility,
    color,
    material,
    infill,
    quantity,
    hasFile,
    hasLink,
    createdAt,
    position,
    isOwn,
  } = props;

  const VisIcon = visibility === "private" ? EyeOff : Eye;
  const SourceIcon = hasFile ? FileBox : hasLink ? LinkIcon : null;

  const chips = [
    color ? color : null,
    material ? material : null,
    typeof infill === "number" ? `${infill}% infill` : null,
    quantity > 1 ? `×${quantity}` : null,
  ].filter(Boolean) as string[];

  return (
    <motion.div
      layout
      whileHover={{ y: -2, transition: transitions.smooth }}
      className="group rounded-2xl border border-border bg-surface p-4 transition-colors duration-300 hover:border-bambu-500/40"
    >
      <div className="flex items-start gap-3">
        {typeof position === "number" && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bambu-500/10 text-sm font-semibold tabular-nums text-bambu-700 dark:text-bambu-300">
            {position}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold tracking-tight">
                {title}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {isOwn ? "You" : ownerName} · {timeAgo(createdAt)}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          {(chips.length > 0 || SourceIcon) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {SourceIcon && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                  <SourceIcon className="h-3 w-3" />
                  {hasFile ? "File" : "Link"}
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
        </div>
      </div>
    </motion.div>
  );
}
