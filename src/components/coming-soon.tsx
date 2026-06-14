"use client";

import { motion } from "motion/react";
import { Construction } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-md rounded-3xl border border-border bg-surface p-10 text-center"
      >
        <motion.div
          variants={fadeUp}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400"
        >
          <Construction className="h-5 w-5" strokeWidth={2} />
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="mt-5 text-2xl font-semibold tracking-tight"
        >
          {title}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-2 text-sm text-muted leading-relaxed">
          {description}
        </motion.p>
      </motion.div>
    </div>
  );
}
