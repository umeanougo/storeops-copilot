import { describe, expect, it } from "vitest";
import { createDemoSnapshot } from "@/lib/demo/seed";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

const snapshot = () => createDemoSnapshot();

describe("deterministic alert engine", () => {
  it("detects an order beyond the 48-hour fulfilment threshold", () => {
    const alert = detectAlerts(snapshot(), DEFAULT_THRESHOLDS).find(item => item.id === "overdue-ord_1052");
    expect(alert?.issueType).toBe("overdue_order");
    expect(alert?.threshold).toContain("48 hours");
  });

  it("does not flag an order at exactly 48 hours", () => {
    const data = snapshot();
    const order = data.orders.find(item => item.id === "ord_1052")!;
    order.createdAt = new Date(new Date(data.generatedAt).getTime() - 48 * 3_600_000).toISOString();
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "overdue-ord_1052")).toBe(false);
  });

  it("flags an order immediately beyond 48 hours", () => {
    const data = snapshot();
    const order = data.orders.find(item => item.id === "ord_1052")!;
    order.createdAt = new Date(new Date(data.generatedAt).getTime() - 48 * 3_600_000 - 1).toISOString();
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "overdue-ord_1052")).toBe(true);
  });

  it("never flags a fulfilled order as overdue", () => {
    const data = snapshot();
    data.orders.find(item => item.id === "ord_1052")!.fulfillmentStatus = "FULFILLED";
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "overdue-ord_1052")).toBe(false);
  });

  it("only flags paid orders as overdue", () => {
    const data = snapshot();
    const order = data.orders.find(item => item.id === "ord_1052")!;
    order.financialStatus = "PENDING";
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "overdue-ord_1052")).toBe(false);
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "customer-risk-ord_1052")).toBe(false);
  });

  it("detects inventory below but not equal to the configured floor", () => {
    const data = snapshot();
    const variant = data.products.flatMap(product => product.variants).find(item => item.id === "var_terra_olive")!;
    variant.available = DEFAULT_THRESHOLDS.lowInventoryUnits;
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "low-stock-var_terra_olive")).toBe(false);
    variant.available = DEFAULT_THRESHOLDS.lowInventoryUnits - 1;
    const alert = detectAlerts(data, DEFAULT_THRESHOLDS).find(item => item.id === "low-stock-var_terra_olive");
    expect(alert).toBeDefined();
    expect(alert?.why).toContain("below");
    expect(alert?.rule).toContain("below");
    expect(alert?.why).not.toContain("at or below");
  });

  it("assigns critical severity to zero inventory", () => {
    const alert = detectAlerts(snapshot(), DEFAULT_THRESHOLDS).find(item => item.id === "low-stock-var_knit_l");
    expect(alert?.severity).toBe("critical");
    expect(alert?.priorityScore).toBeGreaterThanOrEqual(90);
  });

  it("detects high inventory combined with low 30-day velocity", () => {
    const alert = detectAlerts(snapshot(), DEFAULT_THRESHOLDS).find(item => item.id === "excess-var_throw_clay");
    expect(alert?.issueType).toBe("excess_inventory");
    expect(alert?.supportingData[0].value).toBe("142 units");
  });

  it("does not flag excess inventory when recent velocity exceeds the threshold", () => {
    const data = snapshot();
    data.products.flatMap(product => product.variants).find(item => item.id === "var_throw_clay")!.unitsSold30d = DEFAULT_THRESHOLDS.lowVelocityUnits30d + 1;
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "excess-var_throw_clay")).toBe(false);
  });

  it("escalates a high-value customer with a delayed order", () => {
    const alert = detectAlerts(snapshot(), DEFAULT_THRESHOLDS).find(item => item.id === "customer-risk-ord_1052");
    expect(alert?.severity).toBe("critical");
    expect(alert?.supportingData.some(item => item.value.includes("$5,680"))).toBe(true);
  });

  it("does not create customer risk below the value threshold", () => {
    const data = snapshot();
    data.customers.find(item => item.id === "cus_maya")!.lifetimeValue.amount = DEFAULT_THRESHOLDS.highValueCustomerAmount - 1;
    expect(detectAlerts(data, DEFAULT_THRESHOLDS).some(item => item.id === "customer-risk-ord_1052")).toBe(false);
  });

  it("detects refund activity above the immediate baseline", () => {
    const alert = detectAlerts(snapshot(), DEFAULT_THRESHOLDS).find(item => item.issueType === "refund_activity");
    expect(alert?.detected).toContain("3 refunds");
    expect(alert?.supportingData).toHaveLength(3);
    expect(alert?.recordLink).toBe("/orders/ord_1048");
  });

  it("returns no alerts for an empty dataset", () => {
    const data = snapshot();
    data.orders = []; data.customers = []; data.products = []; data.refunds = [];
    expect(detectAlerts(data, DEFAULT_THRESHOLDS)).toEqual([]);
  });

  it("sorts alerts by stable descending priority", () => {
    const alerts = detectAlerts(snapshot(), DEFAULT_THRESHOLDS);
    expect(alerts.every((item, index) => index === 0 || alerts[index - 1].priorityScore >= item.priorityScore)).toBe(true);
    expect(Math.max(...alerts.map(item => item.priorityScore))).toBeLessThanOrEqual(100);
  });
});
