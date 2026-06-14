"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Logo } from "@/components/logo";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Queue" },
  { href: "/submit", label: "Submit" },
  { href: "/gallery", label: "Gallery" },
  { href: "/me", label: "History" },
];

export function Navbar() {
  const pathname = usePathname();

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

        <Link
          href="/login"
          className="inline-flex h-9 items-center rounded-full bg-bambu-500 px-4 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-bambu-600 hover:shadow-md"
        >
          Sign in
        </Link>
      </div>
    </motion.header>
  );
}
