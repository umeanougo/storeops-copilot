import { NextResponse } from "next/server";
import { createDemoSnapshot } from "@/lib/demo/seed";

export const dynamic = "force-dynamic";

// This public endpoint is intentionally demo-only. Live Shopify records are
// rendered on the server and must never be serialized through an unauthenticated
// route in this portfolio prototype.
export async function GET() {
  return NextResponse.json(
    { snapshot: createDemoSnapshot(), requestedMode: "demo", liveError: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
