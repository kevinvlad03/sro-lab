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

// --------------------------------------------------------------------
// submitJob — receives metadata only. The browser uploaded any file
// directly to the prints bucket before calling this, and only the
// resulting path is passed in.
// --------------------------------------------------------------------

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
  const filePathRaw = String(formData.get("file_path") ?? "").trim();
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

  // Belt-and-braces check that the client uploaded into its own folder.
  // RLS on the prints bucket already enforces this; we just refuse to
  // record someone else's path on a job.
  const filePath = filePathRaw || null;
  if (filePath && !filePath.startsWith(`${profile.id}/`)) {
    return { error: "Invalid file path." };
  }

  if (!filePath && !sourceUrl) {
    return { error: "Upload a file or paste a link." };
  }

  let thumbnailUrl: string | null = null;
  if (sourceUrl) {
    thumbnailUrl = await fetchThumbnail(sourceUrl);
  }

  const supabase = await createClient();
  const jobId = randomUUID();

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
    // Best-effort cleanup if we orphaned the upload.
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

function ownerFrom(row: JobOwnerRow | null): { email: string; name: string } | null {
  if (!row) return null;
  if (!row.owner) return null;
  if (Array.isArray(row.owner)) return row.owner[0] ?? null;
  return row.owner;
}

function actingOnOwnJob(job: JobOwnerRow | null, adminId: string): boolean {
  return !!job && job.owner_id === adminId;
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

  const { error: updateErr } = await supabase
    .from("jobs")
    .update(patch)
    .eq("id", jobId);
  if (updateErr) {
    console.error("[advanceJobStatus] update failed:", updateErr);
    throw new Error(`Status update failed: ${updateErr.message}`);
  }

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

  const { error: rejectErr } = await supabase
    .from("jobs")
    .update({
      status: "rejected",
      rejection_reason: reasonOrDefault,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  if (rejectErr) {
    console.error("[rejectJob] update failed:", rejectErr);
    throw new Error(`Reject failed: ${rejectErr.message}`);
  }

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

// completeJob now expects an optional photo_path string from the
// client; the browser already uploaded the file to the photos bucket.
export async function completeJob(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const supabase = await createClient();
  const job = await fetchJobForEmail(jobId);
  const photoPathRaw = String(formData.get("photo_path") ?? "").trim();
  const photoPath = photoPathRaw && photoPathRaw.startsWith(`${jobId}/`)
    ? photoPathRaw
    : null;

  const printMinutes = clampInt(formData.get("print_minutes"), 0, 100000);
  const filamentGrams = clampInt(formData.get("filament_grams"), 0, 100000);

  if (photoPath) {
    const { error: photoErr } = await supabase.from("job_photos").insert({
      job_id: jobId,
      photo_path: photoPath,
      uploaded_by: admin.id,
    });
    if (photoErr) {
      console.error("[completeJob] job_photos insert failed:", photoErr);
      // Photo insert failure shouldn't block marking the job done.
    }
  }

  const { error: updateErr } = await supabase
    .from("jobs")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      print_minutes: printMinutes,
      filament_grams: filamentGrams,
    })
    .eq("id", jobId);
  if (updateErr) {
    console.error("[completeJob] jobs update failed:", updateErr);
    throw new Error(`Could not mark done: ${updateErr.message}`);
  }

  const owner = ownerFrom(job);
  if (job && owner && !actingOnOwnJob(job, admin.id)) {
    const photoUrlForEmail = photoPath ? photoUrl(photoPath) : undefined;
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

// --------------------------------------------------------------------
// Owner actions — edit + delete on your own queued jobs
// --------------------------------------------------------------------

export async function editJob(formData: FormData): Promise<void> {
  const profile = await getProfile();
  if (!profile) throw new Error("Not signed in.");

  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const supabase = await createClient();
  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("owner_id, status")
    .eq("id", jobId)
    .single();

  if (fetchErr || !job) {
    throw new Error("Job not found.");
  }
  if (job.owner_id !== profile.id) {
    throw new Error("Only the owner can edit this print.");
  }
  if (job.status !== "queued") {
    throw new Error("Once a print starts, it can't be edited.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const settingsMode =
    formData.get("settings_mode") === "custom" ? "custom" : "creator";
  const color = String(formData.get("color") ?? "").trim() || null;
  const material =
    settingsMode === "custom"
      ? String(formData.get("material") ?? "").trim() || null
      : null;
  const infill =
    settingsMode === "custom" ? clampInt(formData.get("infill"), 0, 100) : null;
  const quantity = clampInt(formData.get("quantity"), 1, 100) ?? 1;
  const visibility =
    formData.get("visibility") === "private" ? "private" : "team";

  if (!title) throw new Error("Title can't be empty.");
  if (title.length > 120) throw new Error("Title is too long (max 120 chars).");
  if (description.length > 1000) {
    throw new Error("Description is too long (max 1000 chars).");
  }

  const { error: updateErr } = await supabase
    .from("jobs")
    .update({
      title,
      description,
      color,
      material,
      infill,
      quantity,
      visibility,
      settings_mode: settingsMode,
    })
    .eq("id", jobId);

  if (updateErr) {
    console.error("[editJob] update failed:", updateErr);
    throw new Error(`Could not save changes: ${updateErr.message}`);
  }

  revalidatePath("/");
  revalidatePath("/me");
}

export async function deleteJob(formData: FormData): Promise<void> {
  const profile = await getProfile();
  if (!profile) throw new Error("Not signed in.");

  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const supabase = await createClient();
  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("owner_id, status, file_path")
    .eq("id", jobId)
    .single();

  if (fetchErr || !job) return;
  if (job.owner_id !== profile.id) {
    throw new Error("Only the owner can delete this print.");
  }
  if (job.status !== "queued") {
    throw new Error("Once a print starts, it can't be deleted.");
  }

  const { error: delErr } = await supabase.from("jobs").delete().eq("id", jobId);
  if (delErr) {
    console.error("[deleteJob] delete failed:", delErr);
    throw new Error(`Could not delete: ${delErr.message}`);
  }

  if (job.file_path) {
    await supabase.storage.from("prints").remove([job.file_path as string]);
  }

  revalidatePath("/");
  revalidatePath("/me");
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

// --------------------------------------------------------------------
// Download — owner or admin only. Generates a short-lived signed URL
// with download=true so the browser saves the file instead of trying
// to render it. Submitted as a form, redirects straight to the URL.
// --------------------------------------------------------------------

export async function getJobDownloadUrl(formData: FormData): Promise<void> {
  const profile = await getProfile();
  if (!profile) return;

  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("owner_id, file_path, title")
    .eq("id", jobId)
    .single();

  if (!job?.file_path) return;
  const isOwner = job.owner_id === profile.id;
  const isAdmin = profile.role === "admin";
  if (!isOwner && !isAdmin) return;

  const downloadName = job.title
    ? `${(job.title as string).replace(/[^a-zA-Z0-9._-]/g, "_")}_${(job.file_path as string).split("/").pop()}`
    : (job.file_path as string).split("/").pop()!;

  const { data } = await supabase.storage
    .from("prints")
    .createSignedUrl(job.file_path as string, 300, { download: downloadName });

  if (data?.signedUrl) {
    redirect(data.signedUrl);
  }
}
