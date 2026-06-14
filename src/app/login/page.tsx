import { Suspense } from "react";
import { OAuthButtons } from "@/components/oauth-buttons";
import { EmailAuthForm } from "@/components/email-auth-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to <span className="text-bambu-500">SRO Lab</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Sign in to submit prints and see the queue.
          </p>
        </div>

        <OAuthButtons />

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted">
          <span className="h-px flex-1 bg-border" />
          or with email
          <span className="h-px flex-1 bg-border" />
        </div>

        <Suspense fallback={null}>
          <EmailAuthForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
