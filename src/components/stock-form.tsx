"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { addSpool, updateSpool } from "@/lib/stock-actions";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  COLOR_PRESETS,
  MATERIAL_OPTIONS,
  type FilamentSpool,
} from "@/lib/stock";

export function StockForm({
  spool,
  onDone,
}: {
  spool: FilamentSpool | null;
  onDone: () => void;
}) {
  const editing = !!spool;
  const [colorHex, setColorHex] = useState<string>(
    spool?.color_hex ?? "#1a1a1a",
  );
  const [colorName, setColorName] = useState<string>(spool?.color_name ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (editing && spool) {
        formData.set("id", spool.id);
        await updateSpool(formData);
      } else {
        await addSpool(formData);
      }
      onDone();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  }

  function applyPreset(p: { name: string; hex: string }) {
    setColorHex(p.hex);
    if (!colorName) setColorName(p.name);
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transitions.smooth}
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">
          {editing ? "Edit spool" : "Add a spool"}
        </h3>
        <button
          type="button"
          onClick={onDone}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted transition-colors hover:border-bambu-500/40 hover:text-foreground"
          aria-label="Close form"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Material
          </span>
          <select
            name="material"
            required
            defaultValue={spool?.material ?? "PLA"}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          >
            {MATERIAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Brand <span className="text-muted/70">(optional)</span>
          </span>
          <input
            type="text"
            name="brand"
            defaultValue={spool?.brand ?? ""}
            placeholder="Bambu, Polymaker, ..."
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Color name
          </span>
          <input
            type="text"
            name="color_name"
            required
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            placeholder="Black, Bambu Green, ..."
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Color
          </span>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-2">
            <input
              type="color"
              name="color_hex"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="h-7 w-12 cursor-pointer rounded-md border border-border bg-transparent"
              aria-label="Pick filament color"
            />
            <input
              type="text"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value.toLowerCase())}
              pattern="^#[0-9a-fA-F]{6}$"
              className="h-7 flex-1 rounded-md border border-transparent bg-transparent px-2 text-xs tabular-nums focus:border-bambu-500 focus:outline-none"
            />
          </div>
        </label>
      </div>

      <div className="mt-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Quick picks
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => applyPreset(p)}
              title={p.name}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-all duration-300 hover:scale-110",
                colorHex === p.hex
                  ? "border-bambu-500 ring-2 ring-bambu-500/30"
                  : "border-border",
              )}
              style={{ background: p.hex }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Spool size (g)
          </span>
          <input
            type="number"
            name="grams_total"
            min={1}
            max={50000}
            required
            defaultValue={spool?.grams_total ?? 1000}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Remaining (g)
          </span>
          <input
            type="number"
            name="grams_remaining"
            min={0}
            max={50000}
            required
            defaultValue={spool?.grams_remaining ?? 1000}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          />
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Notes <span className="text-muted/70">(optional)</span>
        </span>
        <input
          type="text"
          name="notes"
          defaultValue={spool?.notes ?? ""}
          placeholder="Stored on the top shelf, dry box, etc."
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
        />
      </label>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-9 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-bambu-500/40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-bambu-500 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-bambu-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {pending ? "Saving..." : editing ? "Save changes" : "Add spool"}
        </button>
      </div>
    </motion.form>
  );
}
