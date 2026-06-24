import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminUsers } from "@/components/admin-users";
import { getAllUsersUsage } from "@/lib/usage-server";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  approved: boolean;
  created_at: string;
};

export default async function AdminPage() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, role, approved, created_at")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as ProfileRow[];

  const pending = rows
    .filter((r) => !r.approved && r.role !== "admin")
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      approved: r.approved,
      createdAt: r.created_at,
    }));

  const team = rows
    .filter((r) => r.approved || r.role === "admin")
    .sort((a, b) => {
      // Admins first, then self, then alphabetical by name.
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      approved: r.approved,
      createdAt: r.created_at,
    }));

  const usage = await getAllUsersUsage();

  return (
    <AdminUsers
      pending={pending}
      team={team}
      selfId={profile.id}
      usage={usage}
    />
  );
}
