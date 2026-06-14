"use client";

import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { transitions } from "@/lib/motion";

export function PendingGate() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="max-w-md rounded-3xl border border-amber-500/20 bg-amber-500/5 p-10 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Clock className="h-5 w-5" strokeWidth={2} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Pending approval
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Your account is waiting for an admin to approve it. Once approved you
          can submit prints and see the team gallery. You can browse the queue
          in the meantime.
        </p>
      </motion.div>
    </div>
  );
}
