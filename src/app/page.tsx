"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Layers, Eye, History } from "lucide-react";
import { fadeUp, stagger, transitions } from "@/lib/motion";

const features = [
  {
    icon: Layers,
    title: "One shared queue",
    body: "Drop in an STL or a link. Everyone sees their place in line — no more walking up to ask.",
  },
  {
    icon: Eye,
    title: "Visible or private",
    body: "Share what you're printing with the team, or keep it to yourself. Your call, per job.",
  },
  {
    icon: History,
    title: "A record of every print",
    body: "Browse the team gallery of finished prints, or look back at everything you've shipped.",
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col items-start gap-8 max-w-3xl"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-bambu-500/30 bg-bambu-500/5 px-3 py-1 text-xs font-medium text-bambu-700 dark:text-bambu-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-bambu-500 animate-pulse" />
            Internal tool for the SRO team
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]"
          >
            The print queue
            <br />
            for the <span className="text-bambu-500">SRO printer</span>.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-muted max-w-2xl leading-relaxed"
          >
            Upload your STL, paste a link, or just describe what you need. Watch
            where you are in the queue. See what the rest of the team is making.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/submit"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-bambu-500 px-6 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-out hover:bg-bambu-600 hover:shadow-lg hover:gap-3"
            >
              Submit a print
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full border border-border bg-surface px-6 text-sm font-medium text-foreground transition-colors duration-300 hover:border-bambu-500/40 hover:text-bambu-700 dark:hover:text-bambu-300"
            >
              See the queue
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-4 md:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: transitions.smooth }}
              className="rounded-2xl border border-border bg-surface p-6 transition-colors duration-500 hover:border-bambu-500/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
                <feature.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
