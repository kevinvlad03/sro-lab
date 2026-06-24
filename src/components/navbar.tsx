"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { MobileMenu } from "@/components/mobile-menu";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import type { NotificationItem } from "@/lib/notifications";

const baseLinks = [
  { href: "/", label: "Queue" },
  { href: "/submit", label: "Submit" },
  { href: "/stock", label: "Stock" },
  { href: "/gallery", label: "Gallery" },
  { href: "/me", label: "History" },
  { href: "/roadmap", label: "Roadmap" },
];

export function Navbar({
  profile,
  notifications,
  unread,
}: {
  profile: Profile | null;
  notifications: NotificationItem[];
  unread: number;
}) {
  const pathname = usePathname();

  const navLinks = profile?.role === "admin"
    ? [...baseLinks, { href: "/admin", label: "Admin" }]
    : baseLinks;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.smooth}
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo className="h-7 w-7 transition-transform duration-500 ease-out group-hover:rotate-3" />
          <span className="text-base font-semibold tracking-tight">
            SRO <span className="text-bambu-500">Lab</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-bambu-500/30 bg-bambu-500/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-bambu-700 dark:text-bambu-300">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-bambu-500/60" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-bambu-500" />
            </span>
            Beta
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300",
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-bambu-500/10 ring-1 ring-bambu-500/30"
                    transition={transitions.spring}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <NotificationBell items={notifications} unread={unread} />
              <UserMenu profile={profile} />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-bambu-500 px-4 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-bambu-600 hover:shadow-md"
            >
              Sign in
            </Link>
          )}
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </motion.header>
  );
}
