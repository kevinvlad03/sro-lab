"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export async function markAllNotificationsRead(): Promise<void> {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", profile.id)
    .eq("read", false);

  revalidatePath("/", "layout");
}
