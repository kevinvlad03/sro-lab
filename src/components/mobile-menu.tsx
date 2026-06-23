"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors duration-300 hover:border-bambu-500/40 md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={transitions.smooth}
              className="absolute inset-0 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={transitions.smooth}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Menu className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.smooth}
              onClick={() => setOpen(false)}
              className="fixed inset-x-0 bottom-0 top-16 z-30 bg-background/70 backdrop-blur-md md:hidden"
              aria-hidden
            />
            <motion.nav
              key="panel"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={transitions.smooth}
              className="fixed left-3 right-3 top-[68px] z-40 rounded-2xl border border-border bg-surface p-1.5 shadow-lg shadow-black/10 dark:shadow-black/30 md:hidden"
            >
              {links.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-300",
                      active
                        ? "bg-bambu-500/10 text-bambu-700 dark:text-bambu-300"
                        : "text-foreground hover:bg-bambu-500/5",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
