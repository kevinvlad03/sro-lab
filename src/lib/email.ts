import "server-only";
import { Resend } from "resend";
import {
  PrintStatusEmail,
  type PrintEmailStatus,
} from "@/emails/print-status-email";
import { AccountApprovedEmail } from "@/emails/account-approved-email";

const SUBJECTS: Record<PrintEmailStatus, (title: string) => string> = {
  printing: (t) => `Your print started — ${t}`,
  done: (t) => `Your print is ready — ${t}`,
  failed: (t) => `Your print failed — ${t}`,
  cancelled: (t) => `Your print was cancelled — ${t}`,
  rejected: (t) => `Your print wasn't accepted — ${t}`,
};

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "SRO Lab <onboarding@resend.dev>";
}

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendPrintStatusEmail(args: {
  to: string;
  recipientName: string;
  jobTitle: string;
  status: PrintEmailStatus;
  rejectionReason?: string;
  photoUrl?: string;
}) {
  const resend = client();
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[email] RESEND_API_KEY not set — skipping print-status email",
      );
    }
    return;
  }
  try {
    await resend.emails.send({
      from: fromAddress(),
      to: args.to,
      subject: SUBJECTS[args.status](args.jobTitle),
      react: PrintStatusEmail({
        recipientName: args.recipientName,
        jobTitle: args.jobTitle,
        status: args.status,
        rejectionReason: args.rejectionReason,
        photoUrl: args.photoUrl,
        appUrl: appUrl(),
      }),
    });
  } catch (err) {
    console.error("[email] sendPrintStatusEmail failed:", err);
  }
}

export async function sendAccountApprovedEmail(args: {
  to: string;
  recipientName: string;
}) {
  const resend = client();
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[email] RESEND_API_KEY not set — skipping account-approved email",
      );
    }
    return;
  }
  try {
    await resend.emails.send({
      from: fromAddress(),
      to: args.to,
      subject: "Your SRO Lab account is approved",
      react: AccountApprovedEmail({
        recipientName: args.recipientName,
        appUrl: appUrl(),
      }),
    });
  } catch (err) {
    console.error("[email] sendAccountApprovedEmail failed:", err);
  }
}
