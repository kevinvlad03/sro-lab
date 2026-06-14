"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { sendPrintStatusEmail } from "@/lib/email";
import { photoUrl } from "@/lib/photos";
import type { JobStatus } from "@/lib/types";

export type SubmitJobState = { error?: string } | null;
export type AdminActionState = { error?: string; ok?: boolean } | null;

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

async function fetchThumbnail(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SROLabBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("text/html") && !ctype.includes("application/xhtml")) {
      return null;
    }
    const html = await res.text();
    if (html.length > 500_000) return null;

    const patterns = [
      /<meta\s+[^>]*?property=["']og:image:secure_url["'][^>]*?content=["']([^"']+)["']/i,
      /<meta\s+[^>]*?property=["']og:image["'][^>]*?content=["']([^"']+)["']/i,
      /<meta\s+[^>]*?content=["']([^"']+)["'][^>]*?property=["']og:image["']/i,
      /<meta\s+[^>]*?name=["']twitter:image["'][^>]*?content=["']([^"']+)["']/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) {
        try {
          return new URL(m[1], pageUrl).toString();
        } catch {
          return null;
        }
      }
    }
    return null;
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
    return {
      error:
        "Your account is pending approval. An admin needs to approve you before you can submit.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sourceUrlRaw = String(formData.get("source_url") ?? "").trim();
  const file = formData.get("file") as File | null;
  const settingsMode = formData.get("settings_mode") === "custom" ? "custom" : "creator";
  const color = String(formData.get("color") ?? "").trim() || null;
  const material = settingsMode === "custom"
    ? (String(formData.get("material") ?? "").trim() || null)
    : null;
  const infill = settingsMode === "custom"
    ? clampInt(formData.get("infill"), 0, 100)
    : null;
  const quantity = clampInt(formData.get("quantity"), 1, 100) ?? 1;
  const visibility = formData.get("visibility") === "private" ? "private" : "team";

  if (!title) return { error: "Title is required." };
  if (title.length > 120) return { error: "Title is too long (max 120 chars)." };
  if (description.length > 1000) {
    return { error: "Description is too long (max 1000 chars)." };
  }

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
      return {
        error: `Unsupported file type. Use ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.`,
      };
    }
  }

  const supabase = await createClient();
  const jobId = randomUUID();

  let filePath: string | null = null;
  if (hasFile) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "stl";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    filePath = `${profile.id}/${jobId}/${
      safeName.endsWith(`.${ext}`) ? safeName : `${jobId}.${ext}`
    }`;

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

  let thumbnailUrl: string | null = null;
  if (sourceUrl) {
    thumbnailUrl = await fetchThumbnail(sourceUrl);
  }

  const { error: insertError } = await supabase.from("jobs").insert({
    id: jobId,
    owner_id: profile.id,
    title,
    description,
    file_path: filePath,
    source_url: sourceUrl,
    thumbnail_url: thumbnailUrl,
    color,
    material,
    infill,
    quantity,
    visibility,
    settings_mode: settingsMode,
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

// --------------------------------------------------------------------
// Admin actions
// --------------------------------------------------------------------

async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) throw new Error("Not signed in.");
  if (profile.role !== "admin") throw new Error("Admin only.");
  return profile;
}

type OwnerRel =
  | { email: string; name: string }
  | { email: string; name: string }[]
  | null;
type JobOwnerRow = {
  title: string;
  owner_id: string;
  owner: OwnerRel;
};

// True when the admin acting on a job is the same person who submitted
// it — we skip the email to avoid pinging yourself about your own click.
function actingOnOwnJob(job: JobOwnerRow | null, adminId: string): boolean {
  return !!job && job.owner_id === adminId;
}

function ownerFrom(row: JobOwnerRow | null): { email: string; name: string } | null {
  if (!row) return null;
  if (!row.owner) return null;
  if (Array.isArray(row.owner)) return row.owner[0] ?? null;
  return row.owner;
}

async function fetchJobForEmail(jobId: string): Promise<JobOwnerRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("title, owner_id, owner:profiles!jobs_owner_id_fkey(email, name)")
    .eq("id", jobId)
    .single();
  return (data as JobOwnerRow | null) ?? null;
}

const ADVANCE_TARGETS: Record<string, JobStatus> = {
  start: "printing",
  done: "done",
  failed: "failed",
  cancel: "cancelled",
};

export async function advanceJobStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const jobId = String(formData.get("job_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const next = ADVANCE_TARGETS[action];
  if (!jobId || !next) return;

  const supabase = await createClient();
  const job = await fetchJobForEmail(jobId);

  const patch: Record<string, unknown> = { status: next };
  if (next === "printing") patch.started_at = new Date().toISOString();
  if (next === "done" || next === "failed" || next === "cancelled") {
    patch.completed_at = new Date().toISOString();
  }

  await supabase.from("jobs").update(patch).eq("id", jobId);

  const owner = ownerFrom(job);
  if (job && owner && !actingOnOwnJob(job, admin.id)) {
    after(() =>
      sendPrintStatusEmail({
        to: owner.email,
        recipientName: owner.name,
        jobTitle: job.title,
        status: next as "printing" | "done" | "failed" | "cancelled",
      }),
    );
  }

  revalidatePath("/");
}

export async function rejectJob(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const jobId = String(formData.get("job_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!jobId) return;

  const supabase = await createClient();
  const job = await fetchJobForEmail(jobId);

  const reasonOrDefault = reason || "No reason given.";

  await supabase
    .from("jobs")
    .update({
      status: "rejected",
      rejection_reason: reasonOrDefault,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const owner = ownerFrom(job);
  if (job && owner && !actingOnOwnJob(job, admin.id)) {
    after(() =>
      sendPrintStatusEmail({
        to: owner.email,
        recipientName: owner.name,
        jobTitle: job.title,
        status: "rejected",
        rejectionReason: reasonOrDefault,
      }),
    );
  }

  revalidatePath("/");
}

const PHOTO_ALLOWED = ["jpg", "jpeg", "png", "webp"];
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export async function completeJob(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const supabase = await createClient();
  const job = await fetchJobForEmail(jobId);
  const photo = formData.get("photo") as File | null;
  const hasPhoto = photo instanceof File && photo.size > 0;

  let uploadedPhotoPath: string | null = null;

  if (hasPhoto) {
    if (photo.size > PHOTO_MAX_BYTES) return;
    const ext = photo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!PHOTO_ALLOWED.includes(ext)) return;

    const photoId = randomUUID();
    const path = `${jobId}/${photoId}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("photos")
      .upload(path, photo, {
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });
    if (!uploadErr) {
      uploadedPhotoPath = path;
      const me = await getProfile();
      if (me) {
        await supabase.from("job_photos").insert({
          job_id: jobId,
          photo_path: path,
          uploaded_by: me.id,
        });
      }
    }
  }

  await supabase
    .from("jobs")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const owner = ownerFrom(job);
  if (job && owner && !actingOnOwnJob(job, admin.id)) {
    const photoUrlForEmail = uploadedPhotoPath ? photoUrl(uploadedPhotoPath) : undefined;
    after(() =>
      sendPrintStatusEmail({
        to: owner.email,
        recipientName: owner.name,
        jobTitle: job.title,
        status: "done",
        photoUrl: photoUrlForEmail,
      }),
    );
  }

  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/gallery");
}

export async function bumpJobPriority(formData: FormData): Promise<void> {
  await requireAdmin();
  const jobId = String(formData.get("job_id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!jobId || (direction !== "top" && direction !== "bottom")) return;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("jobs")
    .select("priority")
    .eq("status", "queued");

  const priorities = (rows ?? []).map((r) => r.priority as number);
  const max = priorities.length ? Math.max(...priorities) : 0;
  const min = priorities.length ? Math.min(...priorities) : 0;
  const next = direction === "top" ? max + 1 : min - 1;

  await supabase.from("jobs").update({ priority: next }).eq("id", jobId);
  revalidatePath("/");
}
