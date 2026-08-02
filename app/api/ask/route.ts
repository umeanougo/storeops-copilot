import { NextResponse } from "next/server";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { calculateMetrics } from "@/lib/domain/metrics";
import { buildGroundingContext, createFallbackAnswer } from "@/lib/grounding/ask-store";
import { synthesizeAnswer } from "@/lib/ai/synthesis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { question?: unknown };
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
    if (!question) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
    const { snapshot } = await getStoreResult();
    const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
    const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
    const context = buildGroundingContext(question, snapshot, alerts, metrics);
    const fallback = createFallbackAnswer(context, snapshot, alerts, metrics);
    return NextResponse.json(await synthesizeAnswer(context, fallback));
  } catch {
    return NextResponse.json({ error: "The question could not be processed. No store data was changed." }, { status: 500 });
  }
}
