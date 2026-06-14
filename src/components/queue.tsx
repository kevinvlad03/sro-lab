"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Inbox } from "lucide-react";
import { JobCard, type JobCardProps } from "@/components/job-card";
import { fadeUp, stagger, transitions } from "@/lib/motion";

export function Queue({
  printing,
  queued,
}: {
  printing: JobCardProps[];
  queued: JobCardProps[];
}) {
  const empty = printing.length === 0 && queued.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="mb-8 flex items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Queue</h1>
          <p className="mt-1 text-sm text-muted">
            What the printer is working on and what's next.
          </p>
        </div>
        <Link
          href="/submit"
          className="group inline-flex h-10 items-center gap-2 rounded-full bg-bambu-500 px-5 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-out hover:bg-bambu-600 hover:shadow-md hover:gap-3"
        >
          Submit
          <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      {empty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.smooth}
          className="rounded-3xl border border-border bg-surface p-10 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
            <Inbox className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            The queue is empty
          </h2>
          <p className="mt-1 text-sm text-muted">
            Be the first to drop in a print job.
          </p>
        </motion.div>
      )}

      {printing.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            In progress
          </h2>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col gap-2.5"
          >
            {printing.map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <JobCard {...job} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {queued.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Up next ({queued.length})
          </h2>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col gap-2.5"
          >
            {queued.map((job) => (
              <motion.div key={job.id} variants={fadeUp}>
                <JobCard {...job} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}
    </div>
  );
}
