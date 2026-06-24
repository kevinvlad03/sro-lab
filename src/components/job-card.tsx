"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Camera,
  Check,
  Download,
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
  completeJob,
  getJobDownloadUrl,
  rejectJob,
} from "@/lib/jobs-actions";
import { createClient } from "@/lib/supabase/client";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { JobStatus, JobVisibility, SettingsMode } from "@/lib/types";

export type JobCardProps = {
  id: string;
  title: string;
  description: string | null;
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

const PHOTO_ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

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

const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors duration-300";
const btnPrimary = "bg-bambu-500 text-white hover:bg-bambu-600 disabled:opacity-60 disabled:cursor-not-allowed";
const btnGhost =
  "border border-border bg-background text-foreground hover:border-bambu-500/40 hover:text-bambu-700 dark:hover:text-bambu-300";
const btnDanger =
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
          {hasFile || hasLink ? <FallbackIcon className="h-5 w-5" /> : null}
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
    description,
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
  const [doneOpen, setDoneOpen] = useState(false);
  const [donePhoto, setDonePhoto] = useState<File | null>(null);
  const [donePending, setDonePending] = useState(false);
  const [doneError, setDoneError] = useState<string | null>(null);

  const VisIcon = visibility === "private" ? EyeOff : Eye;
  const canDownload = hasFile && (isOwn || isAdmin);

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

  async function onConfirmDone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (donePending) return;
    setDoneError(null);

    if (donePhoto) {
      if (donePhoto.size > PHOTO_MAX_BYTES) {
        setDoneError("Photo is too large (max 10 MB).");
        return;
      }
      const ext = donePhoto.name.split(".").pop()?.toLowerCase() ?? "";
      if (!PHOTO_ALLOWED_EXT.includes(ext)) {
        setDoneError("Use a JPEG, PNG, or WebP image.");
        return;
      }
    }

    setDonePending(true);
    const supabase = createClient();
    let uploadedPath: string | null = null;

    try {
      if (donePhoto) {
        const ext = donePhoto.name.split(".").pop()?.toLowerCase() ?? "jpg";
        uploadedPath = `${id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(uploadedPath, donePhoto, {
            contentType: donePhoto.type || "image/jpeg",
            upsert: false,
          });
        if (upErr) {
          setDoneError(`Photo upload failed: ${upErr.message}`);
          setDonePending(false);
          return;
        }
      }

      // Pull values from the form so print_minutes + filament_grams come
      // along, then override the file-bearing fields with our pre-uploaded
      // path (and clear the photo blob so the Server Action body stays
      // tiny — the file is already in Storage).
      const formData = new FormData(e.currentTarget);
      formData.delete("photo");
      formData.set("job_id", id);
      if (uploadedPath) formData.set("photo_path", uploadedPath);
      await completeJob(formData);
      // Server revalidates; the card disappears from the queue on its
      // own. No need to reset state.
    } catch (err) {
      setDoneError(err instanceof Error ? err.message : "Something went wrong.");
      if (uploadedPath) {
        await supabase.storage.from("photos").remove([uploadedPath]);
      }
      setDonePending(false);
    }
  }

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

          {(chips.length > 0 || settingsChip || canDownload) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {canDownload && (
                <form action={getJobDownloadUrl}>
                  <input type="hidden" name="job_id" value={id} />
                  <button
                    type="submit"
                    title="Download the file"
                    className="inline-flex items-center gap-1 rounded-full border border-bambu-500/30 bg-bambu-500/5 px-2 py-0.5 text-[11px] font-medium text-bambu-700 transition-colors hover:bg-bambu-500/10 dark:text-bambu-300"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </form>
              )}
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

          {isAdmin && description && (
            <p className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-xs italic leading-relaxed text-muted">
              &ldquo;{description}&rdquo;
            </p>
          )}

          {showAdminRow && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              {status === "queued" && (
                <>
                  <form action={advanceJobStatus}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="action" value="start" />
                    <button className={cn(btn, btnPrimary)}>
                      <Play className="h-3.5 w-3.5" />
                      Start
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setRejectOpen((v) => !v)}
                    className={cn(btn, btnDanger)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <form action={bumpJobPriority}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="direction" value="top" />
                    <button title="Move to top" className={cn(btn, btnGhost)}>
                      <ArrowUpToLine className="h-3.5 w-3.5" />
                    </button>
                  </form>
                  <form action={bumpJobPriority}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="direction" value="bottom" />
                    <button title="Move to bottom" className={cn(btn, btnGhost)}>
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </>
              )}

              {status === "printing" && (
                <>
                  <button
                    type="button"
                    onClick={() => setDoneOpen((v) => !v)}
                    className={cn(btn, btnPrimary)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark done
                  </button>
                  <form action={advanceJobStatus}>
                    <input type="hidden" name="job_id" value={id} />
                    <input type="hidden" name="action" value="failed" />
                    <button className={cn(btn, btnDanger)}>
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
                      className={cn(btn, btnGhost)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={cn(btn, btnDanger)}>
                      Confirm reject
                    </button>
                  </div>
                </div>
              </motion.form>
            )}

            {doneOpen && status === "printing" && isAdmin && (
              <motion.form
                key="done-form"
                onSubmit={onConfirmDone}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Time (minutes)
                      </span>
                      <input
                        type="number"
                        name="print_minutes"
                        min={0}
                        placeholder="e.g. 120"
                        className="h-9 rounded-lg border border-border bg-surface px-3 text-xs transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Filament (g)
                      </span>
                      <input
                        type="number"
                        name="filament_grams"
                        min={0}
                        placeholder="e.g. 28"
                        className="h-9 rounded-lg border border-border bg-surface px-3 text-xs transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
                      />
                    </label>
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-muted">
                      Finished-print photo (optional)
                    </span>
                    <label className="group mt-1 flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border bg-surface px-3 py-2.5 text-xs text-muted transition-colors hover:border-bambu-500/40 hover:text-foreground">
                      <Camera className="h-4 w-4" />
                      <span className="flex-1 truncate">
                        {donePhoto ? donePhoto.name : "Add a photo (JPEG / PNG / WebP, max 10 MB)"}
                      </span>
                      {donePhoto && (
                        <span className="text-[11px] text-bambu-600 dark:text-bambu-400">
                          ready
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(e) => setDonePhoto(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  {doneError && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-[11px] text-red-700 dark:text-red-300">
                      {doneError}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDoneOpen(false);
                        setDonePhoto(null);
                        setDoneError(null);
                      }}
                      className={cn(btn, btnGhost)}
                      disabled={donePending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={donePending}
                      className={cn(btn, btnPrimary)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {donePending
                        ? donePhoto ? "Uploading..." : "Saving..."
                        : "Confirm done"}
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
