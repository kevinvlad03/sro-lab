export type Profile = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  approved: boolean;
  avatar_url: string | null;
};

export type JobStatus =
  | "queued"
  | "printing"
  | "done"
  | "failed"
  | "cancelled"
  | "rejected";

export type JobVisibility = "team" | "private";

export type JobMaterial = "PLA" | "PETG" | "ABS" | "TPU" | "ANY";

export type Job = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  file_path: string | null;
  source_url: string | null;
  color: string | null;
  material: string | null;
  infill: number | null;
  quantity: number;
  visibility: JobVisibility;
  status: JobStatus;
  priority: number;
  rejection_reason: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type JobWithOwner = Job & {
  owner: { name: string } | null;
};
