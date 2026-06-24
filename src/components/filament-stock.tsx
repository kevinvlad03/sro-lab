"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { SpoolVisual } from "@/components/spool-visual";
import { StockForm } from "@/components/stock-form";
import {
  adjustSpoolGrams,
  deleteSpool,
} from "@/lib/stock-actions";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import { formatGrams } from "@/lib/usage";
import { cn } from "@/lib/utils";
import type { FilamentSpool } from "@/lib/stock";

function fillTint(pct: number) {
  if (pct >= 60)
    return { bar: "bg-bambu-500", text: "text-bambu-700 dark:text-bambu-300" };
  if (pct >= 25)
    return {
      bar: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
    };
  return { bar: "bg-red-500", text: "text-red-700 dark:text-red-300" };
}

function SpoolCard({
  spool,
  isAdmin,
  onEdit,
}: {
  spool: FilamentSpool;
  isAdmin: boolean;
  onEdit: (spool: FilamentSpool) => void;
}) {
  const pct = spool.grams_total > 0
    ? (spool.grams_remaining / spool.grams_total) * 100
    : 0;
  const tint = fillTint(pct);
  const fillFraction = pct / 100;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, transition: transitions.smooth }}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors duration-300 hover:border-bambu-500/40"
    >
      <SpoolVisual color={spool.color_hex} fillPct={fillFraction} size={108} />

      <div className="w-full text-center">
        <p className="truncate text-sm font-semibold tracking-tight">
          {spool.color_name}
        </p>
        <p className="text-[11px] text-muted">
          {spool.material}
          {spool.brand ? ` · ${spool.brand}` : ""}
        </p>
      </div>

      <div className="w-full">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className={cn("font-medium tabular-nums", tint.text)}>
            {formatGrams(spool.grams_remaining)}
          </span>
          <span className="text-muted tabular-nums">
            of {formatGrams(spool.grams_total)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bambu-500/5">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: fillFraction }}
            transition={transitions.smooth}
            className={cn("h-full origin-left rounded-full", tint.bar)}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="flex w-full items-center gap-1 pt-1">
          <form action={adjustSpoolGrams} className="flex-1">
            <input type="hidden" name="id" value={spool.id} />
            <input type="hidden" name="delta" value="-50" />
            <button
              type="submit"
              className="h-7 w-full rounded-lg border border-border bg-background text-[11px] font-medium text-muted transition-colors hover:border-bambu-500/40 hover:text-foreground"
            >
              −50g
            </button>
          </form>
          <form action={adjustSpoolGrams} className="flex-1">
            <input type="hidden" name="id" value={spool.id} />
            <input type="hidden" name="delta" value="-100" />
            <button
              type="submit"
              className="h-7 w-full rounded-lg border border-border bg-background text-[11px] font-medium text-muted transition-colors hover:border-bambu-500/40 hover:text-foreground"
            >
              −100g
            </button>
          </form>
          <button
            type="button"
            onClick={() => onEdit(spool)}
            title="Edit"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted transition-colors hover:border-bambu-500/40 hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <form action={deleteSpool}>
            <input type="hidden" name="id" value={spool.id} />
            <button
              type="submit"
              title="Remove this spool"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5 text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-300"
              onClick={(e) => {
                if (!confirm(`Remove the ${spool.color_name} ${spool.material} spool?`)) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}

function Section({
  material,
  spools,
  isAdmin,
  onEdit,
}: {
  material: string;
  spools: FilamentSpool[];
  isAdmin: boolean;
  onEdit: (spool: FilamentSpool) => void;
}) {
  if (spools.length === 0) return null;
  const sectionGrams = spools.reduce((sum, s) => sum + s.grams_remaining, 0);
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {material}
        </h2>
        <span className="rounded-full bg-bambu-500/10 px-2 py-0.5 text-[11px] font-medium text-bambu-700 dark:text-bambu-300">
          {spools.length} {spools.length === 1 ? "spool" : "spools"}
        </span>
        <span className="text-[11px] text-muted">
          {formatGrams(sectionGrams)} on hand
        </span>
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {spools.map((spool) => (
          <SpoolCard
            key={spool.id}
            spool={spool}
            isAdmin={isAdmin}
            onEdit={onEdit}
          />
        ))}
      </motion.div>
    </section>
  );
}

export function FilamentStock({
  spools,
  isAdmin,
}: {
  spools: FilamentSpool[];
  isAdmin: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FilamentSpool | null>(null);

  const grouped = spools.reduce<Record<string, FilamentSpool[]>>((acc, spool) => {
    (acc[spool.material] ||= []).push(spool);
    return acc;
  }, {});
  const materials = Object.keys(grouped).sort();
  const totalGrams = spools.reduce((s, x) => s + x.grams_remaining, 0);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(spool: FilamentSpool) {
    setEditing(spool);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="mb-8 flex items-end justify-between gap-3"
      >
        <div className="flex items-end gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Filament stock</h1>
            <p className="mt-1 text-sm text-muted">
              {spools.length === 0
                ? "Nothing in stock yet."
                : `${spools.length} ${spools.length === 1 ? "spool" : "spools"} · ${formatGrams(totalGrams)} on hand`}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAdd}
            className="group inline-flex h-10 items-center gap-2 rounded-full bg-bambu-500 px-4 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-out hover:bg-bambu-600 hover:shadow-md hover:gap-3"
          >
            <Plus className="h-4 w-4" />
            Add spool
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {formOpen && isAdmin && (
          <motion.div
            key="stock-form-wrap"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={transitions.smooth}
            className="mb-8 overflow-hidden"
          >
            <StockForm spool={editing} onDone={closeForm} />
          </motion.div>
        )}
      </AnimatePresence>

      {spools.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.smooth}
          className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bambu-500/10 text-bambu-600 dark:text-bambu-400">
            <Boxes className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            No filament yet
          </h2>
          <p className="mt-1 text-sm text-muted">
            {isAdmin
              ? "Add the first spool so the team can see what's available."
              : "An admin will add what's available soon."}
          </p>
        </motion.div>
      ) : (
        materials.map((material) => (
          <Section
            key={material}
            material={material}
            spools={grouped[material]}
            isAdmin={isAdmin}
            onEdit={openEdit}
          />
        ))
      )}
    </div>
  );
}
