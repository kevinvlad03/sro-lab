import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FilamentStock } from "@/components/filament-stock";
import type { FilamentSpool } from "@/lib/stock";

export const metadata = {
  title: "Filament stock — SRO Lab",
};

export default async function StockPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("filament_stock")
    .select("*")
    .order("material", { ascending: true })
    .order("color_name", { ascending: true });

  const spools = (data ?? []) as FilamentSpool[];

  return <FilamentStock spools={spools} isAdmin={profile.role === "admin"} />;
}
