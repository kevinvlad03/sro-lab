"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  Bell,
  Check,
  Play,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/notifications";

type Toast = {
  id: string;
  type: NotificationType;
  message: string;
  jobId: string | null;
};

const ICONS: Record<NotificationType, typeof Bell> = {
  job_printing: Play,
  job_done: Check,
  job_failed: X,
  job_cancelled: X,
  job_rejected: AlertCircle,
  account_approved: ShieldCheck,
  new_signup: UserPlus,
};

const TINTS: Record<NotificationType, string> = {
  job_printing: "bg-bambu-500/15 text-bambu-700 dark:text-bambu-300",
  job_done: "bg-bambu-500/15 text-bambu-700 dark:text-bambu-300",
  job_failed: "bg-red-500/15 text-red-700 dark:text-red-300",
  job_cancelled: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  job_rejected: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  account_approved: "bg-bambu-500/15 text-bambu-700 dark:text-bambu-300",
  new_signup: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

function linkTargetFor(type: NotificationType, jobId: string | null) {
  if (jobId) return "/me";
  if (type === "new_signup") return "/admin";
  return null;
}

export function NotificationListener({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            type: NotificationType;
            message: string;
            job_id: string | null;
          };
          setToasts((prev) => [
            ...prev,
            {
              id: row.id,
              type: row.type,
              message: row.message,
              jobId: row.job_id,
            },
          ]);
          // Refresh server-rendered parts (bell badge) so the count stays accurate.
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return (
    <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = ICONS[toast.type] ?? Bell;
  const tint = TINTS[toast.type] ?? "bg-zinc-500/15 text-zinc-700";
  const href = linkTargetFor(toast.type, toast.jobId);

  const body = (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          tint,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        className="-mr-1 -mt-1 flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-bambu-500/10 hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={transitions.smooth}
      className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-3.5 shadow-lg shadow-black/5 dark:shadow-black/30 sm:w-80"
    >
      {href ? (
        <Link href={href} onClick={onDismiss}>
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  );
}
