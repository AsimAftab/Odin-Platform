import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { DeviceCode } from "@/models/DeviceCode";
import { normalizeUserCode } from "@/lib/user-code";
import { ActivateClient } from "./activate-client";

// Resolves the device label/status for display. Kept as a module-scope helper
// (not the component) so runtime clock access is outside render-purity rules.
async function resolveDevice(
  code: string
): Promise<{ label: string | null; status: string }> {
  await connectDB();
  const record = (await DeviceCode.findOne({
    userCode: normalizeUserCode(code),
    expiresAt: { $gt: new Date() },
  }).lean()) as { label?: string; status?: string } | null;

  if (!record) return { label: null, status: "not_found" };
  return { label: record.label ?? null, status: record.status ?? "pending" };
}

// Device-authorization approval page (RFC 8628 verification_uri). The Odin CLI
// opens this in the browser; the signed-in user approves the device here.
// Self-guarded: proxy.ts only force-guards /dashboard, so we redirect to
// /sign-in ourselves and come back with the code preserved.
export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const { userId } = await getSession();

  if (!userId) {
    const target = code
      ? `/activate?code=${encodeURIComponent(code)}`
      : "/activate";
    redirect(`/sign-in?redirect=${encodeURIComponent(target)}`);
  }

  const { label, status } = code
    ? await resolveDevice(code)
    : { label: null, status: null };

  return (
    <ActivateClient
      initialCode={code ?? ""}
      label={label}
      initialStatus={status}
    />
  );
}
