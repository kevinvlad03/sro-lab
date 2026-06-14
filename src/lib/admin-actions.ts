"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { sendAccountApprovedEmail } from "@/lib/email";

async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin only.");
  }
  return profile;
}

export async function approveUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .update({ approved: true })
    .eq("id", userId)
    .select("email, name")
    .single();

  if (data?.email) {
    await sendAccountApprovedEmail({
      to: data.email as string,
      recipientName: data.name as string,
    });
  }

  revalidatePath("/admin");
}

export async function revokeAccess(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId || userId === me.id) return;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ approved: false, role: "user" })
    .eq("id", userId);
  revalidatePath("/admin");
}

export async function promoteToAdmin(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role: "admin", approved: true })
    .eq("id", userId);
  revalidatePath("/admin");
}

export async function demoteFromAdmin(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId || userId === me.id) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role: "user" }).eq("id", userId);
  revalidatePath("/admin");
}
