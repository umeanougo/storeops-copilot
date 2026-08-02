import { describe, expect, it } from "vitest";
import { createDemoSnapshot } from "@/lib/demo/seed";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { calculateMetrics, topSellingProducts } from "@/lib/domain/metrics";
import { detectAlerts } from "@/lib/domain/alerts";
import { createFallbackBrief } from "@/lib/domain/brief";
import { hoursBetween } from "@/lib/domain/format";
import { validateGroundedBrief } from "@/lib/ai/synthesis";

describe("metrics and fallback brief", () => {
  it("calculates currency-preserving seven-day metrics", () => {
    const metrics = calculateMetrics(createDemoSnapshot(), DEFAULT_THRESHOLDS);
    expect(metrics.revenue7d.currencyCode).toBe("CAD");
    expect(metrics.orders7d).toBeGreaterThan(0);
    expect(metrics.revenue7d.amount).toBeGreaterThan(0);
  });

  it("does not count an old unpaid order as an overdue fulfilment alert", () => {
    const data = createDemoSnapshot();
    data.orders.find(order => order.id === "ord_1067")!.createdAt = new Date(new Date(data.generatedAt).getTime() - 80 * 3_600_000).toISOString();
    expect(calculateMetrics(data, DEFAULT_THRESHOLDS).overdueOrders).toBe(2);
  });

  it("uses injected snapshot time for date calculations", () => {
    const data = createDemoSnapshot();
    expect(hoursBetween(data.generatedAt, data.orders[0].createdAt)).toBe(76);
  });

  it("ranks product value from recorded 30-day order lines, not catalog price estimates", () => {
    const data = createDemoSnapshot();
    const top = topSellingProducts(data, 1)[0];
    expect(top).toMatchObject({ id: "prod_jacket", unitsSold30d: 3, revenue30d: 673 });
  });

  it("creates the same top-three brief from deterministic alerts", () => {
    const data = createDemoSnapshot();
    const alerts = detectAlerts(data, DEFAULT_THRESHOLDS);
    const metrics = calculateMetrics(data, DEFAULT_THRESHOLDS);
    const first = createFallbackBrief(data, alerts, metrics);
    const second = createFallbackBrief(data, alerts, metrics);
    expect(first).toEqual(second);
    expect(first.priorities).toHaveLength(3);
    expect(first.generatedBy).toBe("deterministic_fallback");
  });

  it("does not falsely reassure when no rules trigger", () => {
    const data = createDemoSnapshot(); data.orders=[]; data.customers=[]; data.products=[]; data.refunds=[];
    const metrics = calculateMetrics(data, DEFAULT_THRESHOLDS);
    const brief = createFallbackBrief(data, [], metrics);
    expect(brief.headline).toContain("available data");
    expect(brief.summary).not.toContain("Everything");
  });

  it("accepts only the exact deterministic brief claim allowlist", () => {
    const data = createDemoSnapshot();
    const alerts = detectAlerts(data, DEFAULT_THRESHOLDS);
    const metrics = calculateMetrics(data, DEFAULT_THRESHOLDS);
    const fallback = createFallbackBrief(data, alerts, metrics);
    const allowed = new Set(alerts.slice(0, 5).map(alert => alert.id));
    const candidate = { ...fallback, generatedBy: "openai" as const };
    expect(validateGroundedBrief(candidate, fallback, allowed)).toBe(true);
    expect(validateGroundedBrief({ ...candidate, summary: `${candidate.summary} Sales fell because of this.` }, fallback, allowed)).toBe(false);
    expect(validateGroundedBrief({ ...candidate, priorities: candidate.priorities.map((priority, index) => index === 0 ? { ...priority, reason: "Invented reason" } : priority) }, fallback, allowed)).toBe(false);
  });
});
