import { NextResponse } from "next/server";
import { getProvider } from "@/server/payments";

/**
 * Callbacks from payment providers (Payme JSON-RPC, Click Prepare/Complete,
 * Octo notifications, mock). Each provider verifies its own credentials or
 * signature; there is no session or CSRF check here because the caller is
 * the provider's server.
 */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  const provider = getProvider(id);
  // A provider that isn't configured can't verify anything: refuse.
  if (!provider || !provider.configured()) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    return await provider.handleWebhook(req);
  } catch (e) {
    console.error(`[payments:${id}]`, e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
