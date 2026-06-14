"use client";

import { motion } from "motion/react";
import { ImageIcon } from "lucide-react";
import { fadeUp, stagger, transitions } from "@/lib/motion";

export type GalleryItem = {
  id: string;
  title: string;
  ownerName: string;
  primaryPhotoUrl: string;
  completedAt: string;
};

function relativeDate(iso: string) {
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

function GalleryCard({ item }: { item: GalleryItem }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: transitions.smooth }}
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors duration-300 hover:border-bambu-500/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.primaryPhotoUrl}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold tracking-tight">
          {item.title}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {item.ownerName} · {relativeDate(item.completedAt)}
        </p>
      </div>
    </motion.div>
  );
}

export function Gallery({ items }: { items: GalleryItem[] }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Gallery</h1>
        <p className="mt-1 text-sm text-muted">
          Everything the SRO team has printed.
        </p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.smooth}
          className="rounded-3xl border border-border bg-surface p-10 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
            <ImageIcon className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            No prints yet
          </h2>
          <p className="mt-1 text-sm text-muted">
            Finished prints with a photo will show up here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
