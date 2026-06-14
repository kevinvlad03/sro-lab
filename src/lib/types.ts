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
