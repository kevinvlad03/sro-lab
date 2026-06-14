import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/types";

const styles: Record<JobStatus, { label: string; classes: string; dot: string }> = {
  queued: {
    label: "Queued",
    classes: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 ring-zinc-500/20",
    dot: "bg-zinc-400",
  },
  printing: {
    label: "Printing",
    classes: "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300 ring-bambu-500/30",
    dot: "bg-bambu-500 animate-pulse",
  },
  done: {
    label: "Done",
    classes: "bg-bambu-600/10 text-bambu-700 dark:text-bambu-300 ring-bambu-500/20",
    dot: "bg-bambu-600",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 ring-zinc-500/20",
    dot: "bg-zinc-400",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20",
    dot: "bg-amber-500",
  },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.classes,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
