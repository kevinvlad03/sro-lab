"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  Bell,
  BellOff,
  Check,
  Play,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { markAllNotificationsRead } from "@/lib/notifications-actions";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/lib/notifications";

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
  job_printing: "bg-bambu-500/10 text-bambu-600 dark:text-bambu-300",
  job_done: "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300",
  job_failed: "bg-red-500/10 text-red-600 dark:text-red-300",
  job_cancelled: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  job_rejected: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  account_approved: "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300",
  new_signup: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function NotificationRow({
  item,
  onClose,
}: {
  item: NotificationItem;
  onClose: () => void;
}) {
  const Icon = ICONS[item.type] ?? Bell;
  const tint = TINTS[item.type] ?? "bg-zinc-500/10 text-zinc-600";
  const linkTarget = item.jobId
    ? "/me"
    : item.type === "new_signup"
      ? "/admin"
      : null;

  const inner = (
    <div className="flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-bambu-500/5">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          tint,
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug">{item.message}</p>
        <p className="mt-0.5 text-[11px] text-muted">{timeAgo(item.createdAt)}</p>
      </div>
      {!item.read && (
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bambu-500" />
      )}
    </div>
  );

  if (linkTarget) {
    return (
      <Link href={linkTarget} onClick={onClose}>
        {inner}
      </Link>
    );
  }
  return inner;
}

export function NotificationBell({
  items,
  unread,
}: {
  items: NotificationItem[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const [optimisticUnread, setOptimisticUnread] = useState(unread);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // Keep optimistic state in sync with server when we receive new data.
  useEffect(() => {
    setOptimisticUnread(unread);
  }, [unread]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      // Opening → mark all read.
      if (next && optimisticUnread > 0) {
        setOptimisticUnread(0);
        startTransition(() => {
          markAllNotificationsRead();
        });
      }
      return next;
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors duration-300 hover:border-bambu-500/40"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {optimisticUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={transitions.spring}
            className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-bambu-500 px-1 text-[10px] font-semibold leading-none text-white"
          >
            {optimisticUnread > 9 ? "9+" : optimisticUnread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={transitions.smooth}
            className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-border bg-surface p-1.5 shadow-lg shadow-black/5 dark:shadow-black/30"
          >
            <div className="px-3 py-2 text-sm font-semibold tracking-tight">
              Notifications
            </div>
            <div className="mx-1 mb-1 h-px bg-border" />

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                <BellOff className="h-5 w-5 text-muted" />
                <p className="text-xs text-muted">You&apos;re all caught up.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto pr-0.5">
                {items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onClose={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
