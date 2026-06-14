// Build the public URL for a path inside the `photos` storage bucket.
// The bucket is public (see migration 0003) so URLs are stable and
// require no per-request signing.
export function photoUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/photos/${path}`;
}
