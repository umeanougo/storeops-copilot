import { NextResponse } from "next/server";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { calculateMetrics } from "@/lib/domain/metrics";
import { synthesizeBrief } from "@/lib/ai/synthesis";

export const dynamic = "force-dynamic";

export async function POST() {
  const { snapshot } = await getStoreResult();
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
  const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
  return NextResponse.json(await synthesizeBrief(snapshot, alerts, metrics));
}
