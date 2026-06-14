"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { signOut } from "@/lib/auth-actions";
import { transitions } from "@/lib/motion";
import type { Profile } from "@/lib/types";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isAdmin = profile.role === "admin";
  const isPending = !profile.approved && !isAdmin;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface pl-1 pr-3 text-sm font-medium transition-colors duration-300 hover:border-bambu-500/40"
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-bambu-500/15 text-xs font-semibold text-bambu-700 dark:text-bambu-300">
          {initialsOf(profile.name) || <UserIcon className="h-3.5 w-3.5" />}
          {isPending && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-amber-500" />
          )}
        </span>
        <span className="hidden sm:inline max-w-[10ch] truncate">
          {profile.name}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={transitions.smooth}
            className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-surface p-1.5 shadow-lg shadow-black/5 dark:shadow-black/30"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-medium leading-tight">{profile.name}</p>
              <p className="mt-0.5 text-xs text-muted truncate">{profile.email}</p>
              {isAdmin && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-bambu-500/10 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              )}
              {isPending && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  <Clock className="h-3 w-3" />
                  Pending approval
                </span>
              )}
            </div>

            {isPending && (
              <p className="mx-3 mb-2 rounded-lg bg-amber-500/5 px-2.5 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                An admin needs to approve your account before you can submit prints.
              </p>
            )}

            <div className="mx-1 my-1 h-px bg-border" />

            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-bambu-500/10 hover:text-bambu-700 dark:hover:text-bambu-300"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
