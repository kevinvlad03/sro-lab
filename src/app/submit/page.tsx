import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { SubmitForm } from "@/components/submit-form";
import { PendingGate } from "@/components/pending-gate";

export default async function SubmitPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.approved && profile.role !== "admin") {
    return <PendingGate />;
  }

  return <SubmitForm />;
}
