import type { NextConfig } from "next";

// File uploads go directly from the browser to Supabase Storage, so the
// server-action body size never exceeds a few KB of metadata. The Next
// default (1MB) is plenty — and importantly, even raising it here
// wouldn't help on Vercel, which caps Server Action request bodies at
// 4.5 MB at the platform level.
const nextConfig: NextConfig = {};

export default nextConfig;
