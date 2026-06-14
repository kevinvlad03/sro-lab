"use client";

import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { authAction, type AuthState } from "@/lib/auth-actions";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const tabs: { id: Mode; label: string }[] = [
  { id: "signin", label: "Sign in" },
  { id: "signup", label: "Create account" },
];

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    authAction,
    null,
  );

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="w-full max-w-sm"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to <span className="text-bambu-500">SRO Lab</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Sign in with your @sms-group.com email.
          </p>
        </div>

        <div className="relative mb-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300",
                mode === t.id ? "text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {mode === t.id && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-full bg-bambu-500/10 ring-1 ring-bambu-500/30"
                  transition={transitions.spring}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="mode" value={mode} />

          <AnimatePresence initial={false} mode="wait">
            {mode === "signup" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="overflow-hidden"
              >
                <label className="flex flex-col gap-1.5 pb-3">
                  <span className="text-xs font-medium text-muted">Your name</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required={mode === "signup"}
                    placeholder="Jane Doe"
                    className="h-11 rounded-xl border border-border bg-surface px-4 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
                  />
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Work email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@sms-group.com"
              className="h-11 rounded-xl border border-border bg-surface px-4 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Password</span>
            <input
              type="password"
              name="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              placeholder={mode === "signup" ? "At least 8 characters" : ""}
              className="h-11 rounded-xl border border-border bg-surface px-4 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
            />
          </label>

          <AnimatePresence mode="wait">
            {state?.error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transitions.smooth}
                className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300"
              >
                {state.error}
              </motion.p>
            )}
            {state?.success && (
              <motion.p
                key="success"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transitions.smooth}
                className="rounded-xl border border-bambu-500/30 bg-bambu-500/5 px-3 py-2 text-sm text-bambu-700 dark:text-bambu-300"
              >
                {state.success}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-bambu-500 px-6 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-bambu-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? mode === "signin" ? "Signing in..." : "Creating..."
              : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
