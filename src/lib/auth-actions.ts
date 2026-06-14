"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string } | null;

const WORK_DOMAIN = "@sms-group.com";

function normalizeEmail(input: FormDataEntryValue | null) {
  return String(input ?? "").trim().toLowerCase();
}

export async function authAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "signin");
  return mode === "signup" ? signUp(formData) : signIn(formData);
}

async function signIn(formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

async function signUp(formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email.endsWith(WORK_DOMAIN)) {
    return { error: `Use your ${WORK_DOMAIN} address.` };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!name) {
    return { error: "Please enter your name." };
  }

  const h = await headers();
  const origin =
    h.get("origin") ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: `Check ${email} for a confirmation link to finish signing up.`,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
