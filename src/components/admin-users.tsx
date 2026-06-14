"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserMinus,
  Users as UsersIcon,
} from "lucide-react";
import {
  approveUser,
  demoteFromAdmin,
  promoteToAdmin,
  revokeAccess,
} from "@/lib/admin-actions";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  approved: boolean;
  createdAt: string;
};

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

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
const btnPrimary = "bg-bambu-500 text-white hover:bg-bambu-600";
const btnGhost =
  "border border-border bg-background text-foreground hover:border-bambu-500/40 hover:text-bambu-700 dark:hover:text-bambu-300";
const btnDanger =
  "border border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300 hover:bg-red-500/10";

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bambu-500/15 text-sm font-semibold text-bambu-700 dark:text-bambu-300">
      {initialsOf(name)}
    </span>
  );
}

function PendingCard({ row }: { row: Row }) {
  return (
    <motion.div
      layout
      variants={fadeUp}
      exit={{ opacity: 0, x: 12 }}
      transition={transitions.smooth}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <Avatar name={row.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">{row.name}</p>
        <p className="truncate text-xs text-muted">
          {row.email} · signed up {timeAgo(row.createdAt)}
        </p>
      </div>
      <form action={approveUser}>
        <input type="hidden" name="user_id" value={row.id} />
        <button className={cn(btn, btnPrimary)}>
          <Check className="h-3.5 w-3.5" />
          Approve
        </button>
      </form>
    </motion.div>
  );
}

function TeamCard({ row, isSelf }: { row: Row; isSelf: boolean }) {
  const isAdmin = row.role === "admin";

  return (
    <motion.div
      layout
      variants={fadeUp}
      exit={{ opacity: 0, x: 12 }}
      transition={transitions.smooth}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <Avatar name={row.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-tight">
            {row.name}
          </p>
          {isSelf && (
            <span className="rounded-full bg-bambu-500/10 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
              You
            </span>
          )}
          {isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-bambu-500/10 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{row.email}</p>
      </div>

      {!isSelf && (
        <div className="flex items-center gap-1.5">
          {isAdmin ? (
            <form action={demoteFromAdmin}>
              <input type="hidden" name="user_id" value={row.id} />
              <button className={cn(btn, btnGhost)}>
                <ShieldOff className="h-3.5 w-3.5" />
                Step down
              </button>
            </form>
          ) : (
            <form action={promoteToAdmin}>
              <input type="hidden" name="user_id" value={row.id} />
              <button className={cn(btn, btnGhost)}>
                <UserCheck className="h-3.5 w-3.5" />
                Make admin
              </button>
            </form>
          )}
          <form action={revokeAccess}>
            <input type="hidden" name="user_id" value={row.id} />
            <button title="Revoke access" className={cn(btn, btnDanger)}>
              <UserMinus className="h-3.5 w-3.5" />
              Revoke
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}

function EmptyPending() {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center"
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
        <Check className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium">All caught up</p>
      <p className="mt-0.5 text-xs text-muted">No one is waiting for approval.</p>
    </motion.div>
  );
}

export function AdminUsers({
  pending,
  team,
  selfId,
}: {
  pending: Row[];
  team: Row[];
  selfId: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="mb-8 flex items-end gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted">
            Approve new signups and manage who has access.
          </p>
        </div>
      </motion.div>

      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Pending approvals
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              {pending.length}
            </span>
          )}
        </h2>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col gap-2.5"
        >
          <AnimatePresence initial={false}>
            {pending.length === 0 ? (
              <EmptyPending key="empty-pending" />
            ) : (
              pending.map((row) => <PendingCard key={row.id} row={row} />)
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Team ({team.length})
        </h2>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col gap-2.5"
        >
          <AnimatePresence initial={false}>
            {team.map((row) => (
              <TeamCard key={row.id} row={row} isSelf={row.id === selfId} />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
