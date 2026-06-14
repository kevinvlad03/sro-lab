"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export type SubmitJobState = { error?: string } | null;

const ALLOWED_EXTENSIONS = ["stl", "3mf", "obj", "step", "stp"];
const MAX_BYTES = 100 * 1024 * 1024;

function clampInt(raw: FormDataEntryValue | null, min: number, max: number) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function safeUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function submitJob(
  _prev: SubmitJobState,
  formData: FormData,
): Promise<SubmitJobState> {
  const profile = await getProfile();
  if (!profile) {
    return { error: "Please sign in first." };
  }
  if (!profile.approved && profile.role !== "admin") {
    return { error: "Your account is pending approval. An admin needs to approve you before you can submit." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sourceUrlRaw = String(formData.get("source_url") ?? "").trim();
  const file = formData.get("file") as File | null;
  const color = String(formData.get("color") ?? "").trim() || null;
  const material = String(formData.get("material") ?? "").trim() || null;
  const infill = clampInt(formData.get("infill"), 0, 100);
  const quantity = clampInt(formData.get("quantity"), 1, 100) ?? 1;
  const visibility = formData.get("visibility") === "private" ? "private" : "team";

  if (!title) return { error: "Title is required." };
  if (title.length > 120) return { error: "Title is too long (max 120 chars)." };
  if (description.length > 1000) return { error: "Description is too long (max 1000 chars)." };

  const sourceUrl = sourceUrlRaw ? safeUrl(sourceUrlRaw) : null;
  if (sourceUrlRaw && !sourceUrl) return { error: "That link doesn't look valid." };

  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !sourceUrl) {
    return { error: "Upload a file or paste a link." };
  }

  if (hasFile) {
    if (file.size > MAX_BYTES) return { error: "File is too large (max 100 MB)." };
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { error: `Unsupported file type. Use ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.` };
    }
  }

  const supabase = await createClient();
  const jobId = randomUUID();

  let filePath: string | null = null;
  if (hasFile) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "stl";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    filePath = `${profile.id}/${jobId}/${safeName.endsWith(`.${ext}`) ? safeName : `${jobId}.${ext}`}`;

    const { error: uploadError } = await supabase.storage
      .from("prints")
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` };
    }
  }

  const { error: insertError } = await supabase.from("jobs").insert({
    id: jobId,
    owner_id: profile.id,
    title,
    description,
    file_path: filePath,
    source_url: sourceUrl,
    color,
    material,
    infill,
    quantity,
    visibility,
  });

  if (insertError) {
    if (filePath) {
      await supabase.storage.from("prints").remove([filePath]);
    }
    return { error: `Could not create job: ${insertError.message}` };
  }

  revalidatePath("/");
  revalidatePath("/me");
  redirect("/");
}
