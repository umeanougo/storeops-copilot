import type { OperationalAlert, OperationsMetrics, StoreSnapshot } from "./types";
import { formatMoney } from "./format";

export type DailyBrief = {
  headline: string;
  summary: string;
  priorities: { alertId: string; label: string; reason: string; nextStep: string }[];
  caveat: string;
  generatedBy: "deterministic_fallback" | "openai";
};

export function createFallbackBrief(snapshot: StoreSnapshot, alerts: OperationalAlert[], metrics: OperationsMetrics): DailyBrief {
  const top = alerts.slice(0, 3);
  const headline = top.length === 0 ? "Operations look clear in the available data" : `${top.length} priorities deserve attention today`;
  const summary = top.length === 0
    ? `No configured alert thresholds were crossed. ${metrics.orders7d} orders totalled ${formatMoney(metrics.revenue7d.amount, metrics.revenue7d.currencyCode)} in gross order value during the last seven days.`
    : `${metrics.overdueOrders} overdue order${metrics.overdueOrders === 1 ? "" : "s"}, ${metrics.lowStockVariants} low-stock variant${metrics.lowStockVariants === 1 ? "" : "s"}, and ${metrics.excessInventoryVariants} excess-inventory signal${metrics.excessInventoryVariants === 1 ? "" : "s"} were detected from the current ${snapshot.source} snapshot.`;
  return {
    headline,
    summary,
    priorities: top.map(alert => ({ alertId: alert.id, label: alert.title, reason: alert.detected, nextStep: alert.recommendedAction })),
    caveat: "Recommendations are generated from available store data and should be reviewed before action.",
    generatedBy: "deterministic_fallback",
  };
}
