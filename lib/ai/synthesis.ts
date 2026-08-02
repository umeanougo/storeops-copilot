import OpenAI from "openai";
import { z } from "zod";
import type { OperationalAlert, OperationsMetrics, StoreSnapshot } from "@/lib/domain/types";
import { askStoreAnswerSchema, type AskStoreAnswer, type GroundingContext, validateGroundedAnswer } from "@/lib/grounding/ask-store";
import { type DailyBrief, createFallbackBrief } from "@/lib/domain/brief";

const briefSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  priorities: z.array(z.object({ alertId: z.string(), label: z.string(), merchantName: z.string(), storeName: z.string(), reason: z.string(), nextStep: z.string() })).max(3),
  merchantBacklogs: z.array(z.object({ merchantId: z.string(), merchantName: z.string(), storeName: z.string(), openOrders: z.number(), change: z.number(), risk: z.string() })).max(4),
  blockedSummary: z.string(),
  inventorySummary: z.string(),
  changeSummary: z.string(),
  caveat: z.string(),
  generatedBy: z.literal("openai"),
});

const askJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["supported", "heading", "answer", "evidence", "recommendation", "caveat", "generatedBy"],
  properties: {
    supported: { type: "boolean" }, heading: { type: "string" }, answer: { type: "string" }, recommendation: { type: "string" }, caveat: { type: "string" }, generatedBy: { type: "string", enum: ["openai"] },
    evidence: { type: "array", maxItems: 6, items: { type: "object", additionalProperties: false, required: ["recordId", "recordType", "label", "value", "href"], properties: { recordId: { type: "string" }, recordType: { type: "string", enum: ["order", "product", "variant", "customer", "refund", "alert", "merchant", "store"] }, label: { type: "string" }, value: { type: "string" }, href: { type: "string" } } } },
  },
} as const;

const briefJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["headline", "summary", "priorities", "merchantBacklogs", "blockedSummary", "inventorySummary", "changeSummary", "caveat", "generatedBy"],
  properties: {
    headline: { type: "string" }, summary: { type: "string" }, blockedSummary: { type: "string" }, inventorySummary: { type: "string" }, changeSummary: { type: "string" }, caveat: { type: "string" }, generatedBy: { type: "string", enum: ["openai"] },
    priorities: { type: "array", maxItems: 3, items: { type: "object", additionalProperties: false, required: ["alertId", "label", "merchantName", "storeName", "reason", "nextStep"], properties: { alertId: { type: "string" }, label: { type: "string" }, merchantName: { type: "string" }, storeName: { type: "string" }, reason: { type: "string" }, nextStep: { type: "string" } } } },
    merchantBacklogs: { type: "array", maxItems: 4, items: { type: "object", additionalProperties: false, required: ["merchantId", "merchantName", "storeName", "openOrders", "change", "risk"], properties: { merchantId: { type: "string" }, merchantName: { type: "string" }, storeName: { type: "string" }, openOrders: { type: "number" }, change: { type: "number" }, risk: { type: "string" } } } },
  },
} as const;

function client() { return process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null; }

export async function synthesizeAnswer(context: GroundingContext, fallback: AskStoreAnswer): Promise<AskStoreAnswer> {
  const openai = client();
  if (!openai || context.intent === "unsupported") return fallback;
  try {
    const allowedAnswer = { ...fallback, generatedBy: "openai" as const };
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      reasoning: { effort: "low" },
      store: false,
      instructions: `You are a constrained multi-merchant fulfilment operations answer layer. Use only the supplied facts and return allowedAnswer exactly. Preserve every merchantId, storeId, merchant name, store name, sentence, number, record, link, and ordering. Never merge customer or order data across merchants, never imply an action was completed, and never add assumptions.`,
      input: JSON.stringify({ question: context.question, intent: context.intent, facts: context.facts, allowedRecordIds: context.allowedRecordIds, allowedAnswer }),
      text: { verbosity: "low", format: { type: "json_schema", name: "ask_store_answer", strict: true, schema: askJsonSchema } },
    });
    const parsed = askStoreAnswerSchema.parse(JSON.parse(response.output_text));
    return validateGroundedAnswer(parsed, context, fallback) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export async function synthesizeBrief(snapshot: StoreSnapshot, alerts: OperationalAlert[], metrics: OperationsMetrics): Promise<DailyBrief> {
  const fallback = createFallbackBrief(snapshot, alerts, metrics);
  const openai = client();
  if (!openai) return fallback;
  const allowed = new Set(fallback.priorities.map(priority => priority.alertId));
  const priorityAlerts = alerts.filter(alert => allowed.has(alert.id));
  const topAlerts = [...priorityAlerts, ...alerts.filter(alert => !allowed.has(alert.id)).slice(0, Math.max(0, 5 - priorityAlerts.length))];
  try {
    const allowedBrief = { ...fallback, generatedBy: "openai" as const };
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      reasoning: { effort: "low" },
      store: false,
      instructions: `You are a constrained multi-merchant fulfilment brief layer. Return allowedBrief exactly, including merchant and store context, every sentence, number, field, and ordering. Do not calculate, paraphrase, merge merchants, imply an action was completed, omit evidence, or add content.`,
      input: JSON.stringify({ asOf: snapshot.generatedAt, source: snapshot.source, metrics, alerts: topAlerts, allowedBrief }),
      text: { verbosity: "low", format: { type: "json_schema", name: "daily_brief", strict: true, schema: briefJsonSchema } },
    });
    const brief = briefSchema.parse(JSON.parse(response.output_text));
    return validateGroundedBrief(brief, fallback, allowed) ? brief : fallback;
  } catch {
    return fallback;
  }
}

export function validateGroundedBrief(brief: DailyBrief, fallback: DailyBrief, allowedAlertIds: ReadonlySet<string>) {
  if (brief.generatedBy !== "openai") return false;
  if (brief.headline !== fallback.headline || brief.summary !== fallback.summary || brief.blockedSummary !== fallback.blockedSummary || brief.inventorySummary !== fallback.inventorySummary || brief.changeSummary !== fallback.changeSummary || brief.caveat !== fallback.caveat) return false;
  if (brief.priorities.length !== fallback.priorities.length) return false;
  if (brief.merchantBacklogs.length !== fallback.merchantBacklogs.length || !brief.merchantBacklogs.every((item,index) => JSON.stringify(item) === JSON.stringify(fallback.merchantBacklogs[index]))) return false;
  return brief.priorities.every((priority, index) => {
    const expected = fallback.priorities[index];
    return allowedAlertIds.has(priority.alertId)
      && priority.alertId === expected.alertId
      && priority.label === expected.label
      && priority.merchantName === expected.merchantName
      && priority.storeName === expected.storeName
      && priority.reason === expected.reason
      && priority.nextStep === expected.nextStep;
  });
}
