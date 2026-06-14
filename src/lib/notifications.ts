import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type NotificationType =
  | "job_printing"
  | "job_done"
  | "job_failed"
  | "job_cancelled"
  | "job_rejected"
  | "account_approved";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  jobId: string | null;
};

export const getNotifications = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, message, read, created_at, job_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const items: NotificationItem[] = (data ?? []).map((n) => ({
    id: n.id as string,
    type: n.type as NotificationType,
    message: n.message as string,
    read: n.read as boolean,
    createdAt: n.created_at as string,
    jobId: (n.job_id as string | null) ?? null,
  }));

  const unread = items.filter((n) => !n.read).length;

  return { items, unread };
});
