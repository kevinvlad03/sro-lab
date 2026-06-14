import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Landing } from "@/components/landing";
import { Queue } from "@/components/queue";
import type { JobCardProps } from "@/components/job-card";
import type { JobStatus, JobVisibility } from "@/lib/types";

type JobRow = {
  id: string;
  title: string;
  owner_id: string;
  color: string | null;
  material: string | null;
  infill: number | null;
  quantity: number;
  visibility: JobVisibility;
  status: JobStatus;
  priority: number;
  created_at: string;
  file_path: string | null;
  source_url: string | null;
  owner: { name: string } | { name: string }[] | null;
};

function ownerNameOf(owner: JobRow["owner"]): string {
  if (!owner) return "Unknown";
  if (Array.isArray(owner)) return owner[0]?.name ?? "Unknown";
  return owner.name;
}

function toCardProps(job: JobRow, selfId: string, position?: number): JobCardProps {
  return {
    id: job.id,
    title: job.title,
    ownerName: ownerNameOf(job.owner),
    status: job.status,
    visibility: job.visibility,
    color: job.color,
    material: job.material,
    infill: job.infill,
    quantity: job.quantity,
    hasFile: !!job.file_path,
    hasLink: !!job.source_url,
    createdAt: job.created_at,
    position,
    isOwn: job.owner_id === selfId,
  };
}

export default async function Home() {
  const profile = await getProfile();

  if (!profile) {
    return <Landing />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select(
      `
      id, title, owner_id, color, material, infill, quantity,
      visibility, status, priority, created_at, file_path, source_url,
      owner:profiles!jobs_owner_id_fkey(name)
    `,
    )
    .in("status", ["queued", "printing"])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  const jobs = (data ?? []) as JobRow[];

  const printing = jobs
    .filter((j) => j.status === "printing")
    .map((j) => toCardProps(j, profile.id));

  const queued = jobs
    .filter((j) => j.status === "queued")
    .map((j, i) => toCardProps(j, profile.id, i + 1));

  return <Queue printing={printing} queued={queued} />;
}
