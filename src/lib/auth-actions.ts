"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string } | null;
export type OAuthProvider = "google" | "apple";

function normalizeEmail(input: FormDataEntryValue | null) {
  return String(input ?? "").trim().toLowerCase();
}

async function originFromHeaders() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
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

  if (!email) {
    return { error: "Please enter your email." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!name) {
    return { error: "Please enter your name." };
  }

  const origin = await originFromHeaders();

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

export async function signInWithOAuthForm(formData: FormData) {
  const provider = String(formData.get("provider") ?? "") as OAuthProvider;
  if (provider !== "google" && provider !== "apple") {
    redirect("/login?error=invalid_provider");
  }

  const origin = await originFromHeaders();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`,
    );
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
