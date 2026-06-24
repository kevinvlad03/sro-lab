"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin only.");
  }
  return profile;
}

function parseGrams(raw: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function validHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

export async function addSpool(formData: FormData): Promise<void> {
  await requireAdmin();

  const material = String(formData.get("material") ?? "").trim();
  const colorName = String(formData.get("color_name") ?? "").trim();
  const colorHex = String(formData.get("color_hex") ?? "").trim().toLowerCase();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const gramsTotal = Math.max(1, parseGrams(formData.get("grams_total"), 1000));
  const rawRemaining = parseGrams(formData.get("grams_remaining"), gramsTotal);
  const gramsRemaining = Math.min(rawRemaining, gramsTotal);

  if (!material || !colorName || !validHex(colorHex)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("filament_stock").insert({
    material,
    color_name: colorName,
    color_hex: colorHex,
    brand,
    notes,
    grams_total: gramsTotal,
    grams_remaining: gramsRemaining,
  });

  if (error) {
    console.error("[addSpool] insert failed:", error);
    throw new Error(`Could not add spool: ${error.message}`);
  }

  revalidatePath("/stock");
}

export async function updateSpool(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const material = String(formData.get("material") ?? "").trim();
  const colorName = String(formData.get("color_name") ?? "").trim();
  const colorHex = String(formData.get("color_hex") ?? "").trim().toLowerCase();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const gramsTotal = Math.max(1, parseGrams(formData.get("grams_total"), 1000));
  const rawRemaining = parseGrams(formData.get("grams_remaining"), gramsTotal);
  const gramsRemaining = Math.min(rawRemaining, gramsTotal);

  if (!material || !colorName || !validHex(colorHex)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("filament_stock")
    .update({
      material,
      color_name: colorName,
      color_hex: colorHex,
      brand,
      notes,
      grams_total: gramsTotal,
      grams_remaining: gramsRemaining,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[updateSpool] update failed:", error);
    throw new Error(`Could not update spool: ${error.message}`);
  }

  revalidatePath("/stock");
}

export async function adjustSpoolGrams(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (!id || !Number.isFinite(delta) || delta === 0) return;

  const supabase = await createClient();
  const { data: current, error: fetchErr } = await supabase
    .from("filament_stock")
    .select("grams_remaining, grams_total")
    .eq("id", id)
    .single();

  if (fetchErr || !current) return;

  const next = Math.max(
    0,
    Math.min(current.grams_total, current.grams_remaining + delta),
  );

  await supabase
    .from("filament_stock")
    .update({ grams_remaining: next, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/stock");
}

export async function deleteSpool(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("filament_stock").delete().eq("id", id);
  revalidatePath("/stock");
}
