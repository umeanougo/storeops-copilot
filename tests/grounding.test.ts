import { describe, expect, it } from "vitest";
import { createDemoSnapshot } from "@/lib/demo/seed";
import { detectAlerts } from "@/lib/domain/alerts";
import { calculateMetrics } from "@/lib/domain/metrics";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { buildGroundingContext, classifyIntent, createFallbackAnswer, validateGroundedAnswer } from "@/lib/grounding/ask-store";

const setup = (question: string) => {
  const snapshot = createDemoSnapshot();
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
  const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
  const context = buildGroundingContext(question, snapshot, alerts, metrics);
  return { snapshot, alerts, metrics, context, answer: createFallbackAnswer(context, snapshot, alerts, metrics) };
};

describe("grounded Ask Store", () => {
  it.each([
    ["Which orders have been waiting the longest?", "overdue_orders"],
    ["Which products are running low?", "low_stock"],
    ["Which products have too much inventory?", "excess_inventory"],
    ["Which customers have the highest lifetime value?", "vip_customers"],
    ["Did refunds increase recently?", "refunds"],
  ] as const)("maps %s to %s", (question, intent) => expect(classifyIntent(question)).toBe(intent));

  it("retrieves only the records relevant to an inventory question", () => {
    const { context } = setup("Which products are running low?");
    expect(context.allowedRecordIds).toContain("low-stock-var_knit_l");
    expect(context.allowedRecordIds).not.toContain("overdue-ord_1052");
  });

  it("references visible evidence in a supported answer", () => {
    const { answer, context } = setup("Which orders have been waiting the longest?");
    const candidate = { ...answer, generatedBy: "openai" as const };
    expect(answer.supported).toBe(true);
    expect(answer.evidence[0].href).toContain("/issues/");
    expect(validateGroundedAnswer(candidate, context, answer)).toBe(true);
  });

  it("declines an unsupported profit question without evidence", () => {
    const { answer } = setup("What is my gross margin by channel?");
    expect(answer.supported).toBe(false);
    expect(answer.evidence).toEqual([]);
    expect(answer.heading).toContain("Not enough information");
  });

  it("rejects an answer that cites an unknown record", () => {
    const { answer, context } = setup("Which orders have been waiting the longest?");
    const tampered = { ...answer, generatedBy: "openai" as const, evidence: [{ recordId: "invented-order", recordType: "order" as const, label: "Invented", value: "$999", href: "/orders/invented" }] };
    expect(validateGroundedAnswer(tampered, context, answer)).toBe(false);
  });

  it.each(["label", "value", "href"] as const)("rejects altered %s copy even when the record ID is allowed", field => {
    const { answer, context } = setup("Which orders have been waiting the longest?");
    const evidence = answer.evidence.map((item, index) => index === 0 ? { ...item, [field]: `${item[field]} invented` } : item);
    const tampered = { ...answer, generatedBy: "openai" as const, evidence };
    expect(validateGroundedAnswer(tampered, context, answer)).toBe(false);
  });

  it("rejects invented narrative copy even when every evidence object is valid", () => {
    const { answer, context } = setup("Which orders have been waiting the longest?");
    const tampered = { ...answer, generatedBy: "openai" as const, answer: `${answer.answer} Sales fell because of this delay.` };
    expect(validateGroundedAnswer(tampered, context, answer)).toBe(false);
  });

  it("explains the exact seeded order when named", () => {
    const { answer } = setup("Why was order #1052 flagged?");
    expect(answer.heading).toContain("#1052");
    expect(answer.answer).toContain("48-hour");
  });

  it("does not substitute another order when the requested order is unavailable", () => {
    const { answer } = setup("Why was order #9999 flagged?");
    expect(answer.heading).toContain("No matching overdue order");
    expect(answer.evidence).toEqual([]);
  });

  it.each([
    "Which customers have the highest lifetime value?",
    "Which products generate the most revenue?",
    "Which three issues should I address first?",
  ])("returns a no-finding answer instead of crashing on empty data for: %s", question => {
    const snapshot = createDemoSnapshot();
    snapshot.orders = [];
    snapshot.customers = [];
    snapshot.products = [];
    snapshot.refunds = [];
    const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
    const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
    const context = buildGroundingContext(question, snapshot, alerts, metrics);
    const answer = createFallbackAnswer(context, snapshot, alerts, metrics);
    expect(answer.supported).toBe(true);
    expect(answer.evidence).toEqual([]);
    expect(answer.heading).toMatch(/^No /);
  });

  it("caps no-sales evidence at the context allowlist", () => {
    const snapshot = createDemoSnapshot();
    snapshot.products.flatMap(product => product.variants).forEach(variant => { variant.unitsSold30d = 0; });
    const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
    const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
    const context = buildGroundingContext("Which products had no sales?", snapshot, alerts, metrics);
    const answer = createFallbackAnswer(context, snapshot, alerts, metrics);
    const candidate = { ...answer, generatedBy: "openai" as const };
    expect(answer.evidence).toHaveLength(5);
    expect(validateGroundedAnswer(candidate, context, answer)).toBe(true);
  });

  it("caps refund evidence while retaining source-derived window totals", () => {
    const snapshot = createDemoSnapshot();
    const template = snapshot.refunds[0];
    snapshot.refunds = Array.from({ length: 8 }, (_, index) => ({
      ...template,
      id: `ref_recent_${index}`,
      createdAt: new Date(new Date(snapshot.generatedAt).getTime() - (index + 1) * 3_600_000).toISOString(),
    }));
    const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
    const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
    const context = buildGroundingContext("Did refunds increase recently?", snapshot, alerts, metrics);
    const answer = createFallbackAnswer(context, snapshot, alerts, metrics);
    const candidate = { ...answer, generatedBy: "openai" as const };
    expect(answer.answer).toContain("8 refunds");
    expect(answer.evidence).toHaveLength(5);
    expect(validateGroundedAnswer(candidate, context, answer)).toBe(true);
  });

  it("describes top products as recorded order-line value and links to a concrete variant", () => {
    const { answer } = setup("Which products generate the most revenue?");
    expect(answer.heading).toContain("recorded 30-day order-line value");
    expect(answer.answer).toContain("not net product revenue");
    expect(answer.caveat).toContain("refunds, discounts, or payment-state adjustments");
    expect(answer.evidence[0].href).toMatch(/^\/inventory\/var_/);
    expect(answer.evidence[0].href).not.toContain("?");
  });
});
