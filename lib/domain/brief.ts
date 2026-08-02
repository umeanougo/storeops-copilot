import type { OperationalAlert, OperationsMetrics, StoreSnapshot } from "./types";
import { ageLabel } from "./format";
import { calculateMerchantBacklogs } from "./metrics";
import { DEFAULT_THRESHOLDS } from "./config";

export type DailyBrief = {
  headline: string;
  summary: string;
  priorities: { alertId: string; label: string; merchantName: string; storeName: string; reason: string; nextStep: string }[];
  merchantBacklogs: { merchantId: string; merchantName: string; storeName: string; openOrders: number; change: number; risk: string }[];
  blockedSummary: string;
  inventorySummary: string;
  changeSummary: string;
  caveat: string;
  generatedBy: "deterministic_fallback" | "openai";
};

export function createFallbackBrief(snapshot: StoreSnapshot, alerts: OperationalAlert[], metrics: OperationsMetrics): DailyBrief {
  const merchantById = new Map(snapshot.merchants.map(merchant => [merchant.id, merchant]));
  const storeById = new Map(snapshot.stores.map(store => [store.id, store]));
  const top = alerts.filter(alert => ["inventory_constraint", "order_age_48", "payment_blocked", "partial_fulfillment", "merchant_backlog"].includes(alert.issueType)).slice(0, 3);
  const backlogs = calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS).slice(0, 4);
  const largestIncrease = [...backlogs].sort((a, b) => b.backlogChange - a.backlogChange)[0];
  return {
    headline: top.length === 0 ? "No cross-merchant priorities need escalation" : `${top.length} cross-merchant priorities lead today’s workload`,
    summary: `${metrics.totalOpenOrders} orders are open across ${snapshot.merchants.length} merchant clients. ${metrics.olderThan48h} are older than 48 hours, ${metrics.paymentBlockedOrders} are blocked by payment, and ${metrics.inventoryConstraints} have an inventory constraint.`,
    priorities: top.map(alert => ({
      alertId: alert.id,
      label: alert.title,
      merchantName: merchantById.get(alert.merchantId)?.name ?? "Unknown merchant",
      storeName: storeById.get(alert.storeId)?.name ?? "Unknown store",
      reason: alert.detected,
      nextStep: alert.recommendedAction,
    })),
    merchantBacklogs: backlogs.map(backlog => ({
      merchantId: backlog.merchantId,
      merchantName: merchantById.get(backlog.merchantId)?.name ?? "Unknown merchant",
      storeName: storeById.get(backlog.storeId)?.name ?? "Unknown store",
      openOrders: backlog.openOrders,
      change: backlog.backlogChange,
      risk: backlog.riskLevel,
    })),
    blockedSummary: `${metrics.paymentBlockedOrders} open order${metrics.paymentBlockedOrders === 1 ? " is" : "s are"} waiting for payment confirmation or status review.`,
    inventorySummary: `${metrics.inventoryConstraints} open order${metrics.inventoryConstraints === 1 ? " has" : "s have"} a same-store inventory shortfall in the available data.`,
    changeSummary: largestIncrease && largestIncrease.backlogChange > 0
      ? `${merchantById.get(largestIncrease.merchantId)?.name ?? "A merchant"} has the largest available backlog increase at +${largestIncrease.backlogChange} open orders.`
      : `No merchant backlog increased in the available comparison period. Oldest outstanding order: ${ageLabel(metrics.oldestOutstandingHours)}.`,
    caveat: "All facts are calculated from the available simulated store snapshot. Recommended steps require operator review and do not perform Shopify actions.",
    generatedBy: "deterministic_fallback",
  };
}
