import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Gallery, type GalleryItem } from "@/components/gallery";
import { photoUrl } from "@/lib/photos";

type JobRow = {
  id: string;
  title: string;
  completed_at: string | null;
  created_at: string;
  owner: { name: string } | { name: string }[] | null;
  photos: { photo_path: string; created_at: string }[] | null;
};

function ownerNameOf(owner: JobRow["owner"]): string {
  if (!owner) return "Unknown";
  if (Array.isArray(owner)) return owner[0]?.name ?? "Unknown";
  return owner.name;
}

export default async function GalleryPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select(
      `
      id, title, completed_at, created_at,
      owner:profiles!jobs_owner_id_fkey(name),
      photos:job_photos!job_id(photo_path, created_at)
    `,
    )
    .eq("status", "done")
    .eq("visibility", "team")
    .order("completed_at", { ascending: false });

  const rows = (data ?? []) as JobRow[];

  const items: GalleryItem[] = rows
    .filter((r) => (r.photos?.length ?? 0) > 0)
    .map((r) => {
      const photos = (r.photos ?? []).slice().sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
      return {
        id: r.id,
        title: r.title,
        ownerName: ownerNameOf(r.owner),
        primaryPhotoUrl: photoUrl(photos[0].photo_path),
        completedAt: r.completed_at ?? r.created_at,
      };
    });

  return <Gallery items={items} />;
}
