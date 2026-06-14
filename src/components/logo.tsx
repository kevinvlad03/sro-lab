import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-bambu-500", className)}
      aria-hidden
    >
      <rect x="6" y="22" width="20" height="4" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="6" y="16" width="20" height="4" rx="1" fill="currentColor" opacity="0.65" />
      <rect x="6" y="10" width="20" height="4" rx="1" fill="currentColor" opacity="0.85" />
      <rect x="6" y="4" width="20" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}
