import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MeHistory, type MeJob } from "@/components/me-history";
import { UsageStats } from "@/components/usage-stats";
import { getUserUsage } from "@/lib/usage-server";
import { photoUrl } from "@/lib/photos";
import type { JobStatus, JobVisibility, SettingsMode } from "@/lib/types";

type JobRow = {
  id: string;
  title: string;
  status: JobStatus;
  visibility: JobVisibility;
  settings_mode: SettingsMode;
  color: string | null;
  material: string | null;
  infill: number | null;
  quantity: number;
  source_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  completed_at: string | null;
  photos: { id: string; photo_path: string; created_at: string }[] | null;
};

function toMe(job: JobRow): MeJob {
  const photoUrls = (job.photos ?? [])
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((p) => photoUrl(p.photo_path));

  return {
    id: job.id,
    title: job.title,
    status: job.status,
    visibility: job.visibility,
    settingsMode: job.settings_mode,
    color: job.color,
    material: job.material,
    infill: job.infill,
    quantity: job.quantity,
    sourceUrl: job.source_url,
    rejectionReason: job.rejection_reason,
    createdAt: job.created_at,
    completedAt: job.completed_at,
    photoUrls,
  };
}

export default async function MePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const usage = await getUserUsage(profile.id);

  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select(
      `
      id, title, status, visibility, settings_mode, color, material, infill,
      quantity, source_url, rejection_reason, created_at, completed_at,
      photos:job_photos!job_id(id, photo_path, created_at)
    `,
    )
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as JobRow[];

  const active = rows
    .filter((r) => r.status === "queued" || r.status === "printing")
    .map(toMe);

  const completed = rows
    .filter((r) => r.status === "done")
    .sort((a, b) =>
      (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at),
    )
    .map(toMe);

  const other = rows
    .filter(
      (r) =>
        r.status === "failed" ||
        r.status === "cancelled" ||
        r.status === "rejected",
    )
    .sort((a, b) =>
      (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at),
    )
    .map(toMe);

  return (
    <MeHistory
      active={active}
      completed={completed}
      other={other}
      usage={usage}
    />
  );
}
