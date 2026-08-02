import { z } from "zod";
import type { OperationalAlert, StoreSnapshot, SupportingDatum } from "@/lib/domain/types";
import type { OperationsMetrics } from "@/lib/domain/types";
import { formatMoney, hoursBetween } from "@/lib/domain/format";
import { highestValueCustomers, topSellingProducts } from "@/lib/domain/metrics";

export const evidenceSchema = z.object({
  recordId: z.string(),
  recordType: z.enum(["order", "product", "variant", "customer", "refund", "alert"]),
  label: z.string(),
  value: z.string(),
  href: z.string(),
});

export const askStoreAnswerSchema = z.object({
  supported: z.boolean(),
  heading: z.string(),
  answer: z.string(),
  evidence: z.array(evidenceSchema).max(6),
  recommendation: z.string(),
  caveat: z.string(),
  generatedBy: z.enum(["deterministic_fallback", "openai"]),
});

export type AskStoreAnswer = z.infer<typeof askStoreAnswerSchema>;
export type AskIntent = "overdue_orders" | "low_stock" | "excess_inventory" | "vip_customers" | "recent_changes" | "why_flagged" | "priorities" | "refunds" | "delayed_customers" | "no_sales" | "top_products" | "unsupported";

export type GroundingContext = {
  intent: AskIntent;
  question: string;
  facts: Record<string, unknown>;
  allowedRecordIds: string[];
};

export function classifyIntent(question: string): AskIntent {
  const q = question.toLowerCase();
  if ((q.includes("why") || q.includes("flag")) && (q.includes("order") || q.includes("#"))) return "why_flagged";
  if (q.includes("waiting") || q.includes("longest") || q.includes("overdue")) return "overdue_orders";
  if (q.includes("running low") || q.includes("low stock") || q.includes("stockout")) return "low_stock";
  if (q.includes("too much") || q.includes("excess") || q.includes("overstock")) return "excess_inventory";
  if (q.includes("no recent sales") || q.includes("not selling") || q.includes("no sales")) return "no_sales";
  if (q.includes("lifetime value") || q.includes("highest-value") || q.includes("highest value") || q.includes("vip")) return "vip_customers";
  if (q.includes("changed") || q.includes("last seven") || q.includes("last 7") || q.includes("this week")) return "recent_changes";
  if (q.includes("three issues") || q.includes("3 issues") || q.includes("address first") || q.includes("priority") || q.includes("priorities")) return "priorities";
  if (q.includes("refund")) return "refunds";
  if (q.includes("delayed order") && q.includes("customer")) return "delayed_customers";
  if (q.includes("top-selling") || q.includes("top selling") || q.includes("most revenue")) return "top_products";
  return "unsupported";
}

function evidenceFromAlert(alert: OperationalAlert) {
  return { recordId: alert.id, recordType: "alert" as const, label: alert.title, value: alert.detected, href: `/issues/${alert.id}` };
}

export function buildGroundingContext(question: string, snapshot: StoreSnapshot, alerts: OperationalAlert[], metrics: OperationsMetrics): GroundingContext {
  const intent = classifyIntent(question);
  const alertsOf = (types: OperationalAlert["issueType"][]) => alerts.filter(alert => types.includes(alert.issueType)).slice(0, 5);
  let records: unknown[] = [];
  switch (intent) {
    case "overdue_orders": records = alertsOf(["overdue_order"]); break;
    case "low_stock": records = alertsOf(["low_inventory"]); break;
    case "excess_inventory": records = alertsOf(["excess_inventory"]); break;
    case "priorities": records = alerts.slice(0, 3); break;
    case "refunds": records = { metrics, alerts: alertsOf(["refund_activity"]), refunds: snapshot.refunds.slice(0, 5) } as unknown as unknown[]; break;
    case "delayed_customers": records = alertsOf(["customer_risk"]); break;
    case "no_sales": records = snapshot.products.flatMap(product => product.variants).filter(variant => variant.unitsSold30d === 0).slice(0, 5); break;
    case "vip_customers": records = highestValueCustomers(snapshot, 5); break;
    case "top_products": records = topSellingProducts(snapshot, 5).filter(product => product.unitsSold30d > 0); break;
    case "recent_changes": records = [metrics, ...alerts.slice(0, 5)]; break;
    case "why_flagged": {
      const orderNumber = question.match(/#?\d{3,}/)?.[0]?.replace("#", "");
      records = alerts.filter(alert => alert.issueType === "overdue_order" && (!orderNumber || alert.title.includes(orderNumber))).slice(0, 3);
      break;
    }
    default: records = [];
  }
  const serialized = JSON.parse(JSON.stringify(records)) as unknown;
  const ids = collectIds(serialized);
  return { intent, question, facts: { asOf: snapshot.generatedAt, currency: snapshot.shop.currencyCode, records: serialized }, allowedRecordIds: ids };
}

function collectIds(value: unknown): string[] {
  const ids = new Set<string>();
  const visit = (item: unknown) => {
    if (Array.isArray(item)) return item.forEach(visit);
    if (item && typeof item === "object") {
      for (const [key, nested] of Object.entries(item)) {
        if ((key === "id" || key === "recordId" || key === "alertId" || key === "orderId") && typeof nested === "string") ids.add(nested);
        visit(nested);
      }
    }
  };
  visit(value);
  return [...ids];
}

function fromSupportingData(item: SupportingDatum, fallbackId: string) {
  return { recordId: item.recordId ?? fallbackId, recordType: item.recordType ?? "alert" as const, label: item.label, value: item.value, href: item.recordType === "order" && item.recordId ? `/orders/${item.recordId}` : item.recordType === "customer" && item.recordId ? `/customers/${item.recordId}` : `/issues/${fallbackId}` };
}

export function createFallbackAnswer(context: GroundingContext, snapshot: StoreSnapshot, alerts: OperationalAlert[], metrics: OperationsMetrics): AskStoreAnswer {
  const currency = snapshot.shop.currencyCode;
  const byType = (type: OperationalAlert["issueType"]) => alerts.filter(alert => alert.issueType === type);
  const answerBase = { caveat: "Based on available store data. Recommendations should be reviewed before action.", generatedBy: "deterministic_fallback" as const };

  if (context.intent === "unsupported") return { ...answerBase, supported: false, heading: "Not enough information to answer", answer: "The available records cover orders, fulfilment, customers, inventory, product sales, and refunds. They do not contain the information needed for this question.", evidence: [], recommendation: "Ask about operational priorities, delayed orders, inventory, customer value, recent performance, or refunds." };
  if (context.intent === "overdue_orders" || context.intent === "why_flagged") {
    const overdue = byType("overdue_order")
      .filter(alert => context.intent !== "why_flagged" || context.allowedRecordIds.includes(alert.id))
      .slice(0, 3);
    if (!overdue.length) return context.intent === "why_flagged"
      ? noFinding("No matching overdue order was found", "The available records do not contain an overdue order matching that order number.")
      : noFinding("No overdue orders were found", "No available order crossed the configured fulfilment threshold.");
    const lead = overdue[0];
    return { ...answerBase, supported: true, heading: `${lead.title} is the longest current wait`, answer: `${overdue.length} order${overdue.length === 1 ? " has" : "s have"} crossed the 48-hour fulfilment threshold. ${lead.why}`, evidence: overdue.map(evidenceFromAlert), recommendation: lead.recommendedAction };
  }
  if (context.intent === "low_stock") {
    const low = byType("low_inventory").slice(0, 4);
    if (!low.length) return noFinding("No low-stock variants were found", "No available variant crossed the configured inventory floor.");
    return { ...answerBase, supported: true, heading: `${low.length} variants are below the stock floor`, answer: `${low[0].title} is the most urgent current stock signal. This rule identifies current availability risk; it does not forecast a stockout date.`, evidence: low.map(alert => fromSupportingData(alert.supportingData[0], alert.id)), recommendation: low[0].recommendedAction };
  }
  if (context.intent === "excess_inventory" || context.intent === "no_sales") {
    const excess = byType("excess_inventory").slice(0, 4);
    const noSales = snapshot.products.flatMap(product => product.variants).filter(variant => variant.unitsSold30d === 0);
    if (context.intent === "no_sales" && noSales.length) {
      const visible = noSales.slice(0, 5);
      return { ...answerBase, supported: true, heading: `${noSales.length} variant${noSales.length === 1 ? " has" : "s have"} inventory but no 30-day sales`, answer: `${visible[0].productTitle} · ${visible[0].title} has ${visible[0].available} units available and no sales in the last 30 days.`, evidence: visible.map(variant => ({ recordId: variant.id, recordType: "variant" as const, label: `${variant.productTitle} · ${variant.title}`, value: `${variant.available} available · 0 sold`, href: `/inventory/${variant.id}` })), recommendation: "Review placement, seasonality, and margin before pausing replenishment or testing a bundle." };
    }
    if (!excess.length) return noFinding("No excess-inventory signals were found", "No variant crossed both the availability and low-velocity thresholds.");
    return { ...answerBase, supported: true, heading: `${excess[0].title} is the clearest excess signal`, answer: excess[0].detected + " " + excess[0].why, evidence: excess.map(evidenceFromAlert), recommendation: excess[0].recommendedAction };
  }
  if (context.intent === "vip_customers") {
    const customers = highestValueCustomers(snapshot, 3);
    if (!customers.length) return noFinding("No customer value records were found", "The available snapshot does not contain customer lifetime-value records.");
    const customerLabel = customers.length === 1 ? "customer" : `${customers.length} customers`;
    return { ...answerBase, supported: true, heading: `${customers[0].name} has the highest lifetime value`, answer: `The top ${customerLabel} ${customers.length === 1 ? "represents" : "represent"} ${formatMoney(customers.reduce((sum, customer) => sum + customer.lifetimeValue.amount, 0), currency)} in recorded lifetime value across ${customers.reduce((sum, customer) => sum + customer.ordersCount, 0)} orders.`, evidence: customers.map(customer => ({ recordId: customer.id, recordType: "customer" as const, label: customer.name, value: `${formatMoney(customer.lifetimeValue.amount, currency)} · ${customer.ordersCount} orders`, href: `/customers/${customer.id}` })), recommendation: "Review any unresolved order before using lifetime value for a retention outreach decision." };
  }
  if (context.intent === "priorities") {
    const top = alerts.slice(0, 3);
    if (!top.length) return noFinding("No current operational priorities were found", "No available record crossed a configured alert threshold.");
    return { ...answerBase, supported: true, heading: `Address ${top.length === 1 ? "this issue" : `these ${top.length} issues`} first`, answer: "Priority is based on rule severity, elapsed time, and customer risk—not model judgment.", evidence: top.map(evidenceFromAlert), recommendation: top[0]?.recommendedAction ?? "No action is required from the available alerts." };
  }
  if (context.intent === "refunds") {
    const recent = snapshot.refunds.filter(refund => hoursBetween(snapshot.generatedAt, refund.createdAt) <= 7 * 24);
    const prior = snapshot.refunds.filter(refund => { const age = hoursBetween(snapshot.generatedAt, refund.createdAt); return age > 7 * 24 && age <= 14 * 24; });
    const visibleRecent = recent.filter(refund => context.allowedRecordIds.includes(refund.id)).slice(0, 5);
    return { ...answerBase, supported: true, heading: recent.length > prior.length ? "Refund activity increased in the available window" : "Refund activity did not increase", answer: `${recent.length} refunds worth ${formatMoney(recent.reduce((sum, refund) => sum + refund.amount.amount, 0), currency)} were recorded in the last seven days, compared with ${prior.length} in the preceding seven days.`, evidence: visibleRecent.map(refund => ({ recordId: refund.id, recordType: "refund" as const, label: `${refund.orderName} refund`, value: formatMoney(refund.amount.amount, currency), href: `/orders/${refund.orderId}` })), recommendation: "Review affected orders for shared product or fulfilment patterns before changing policy." };
  }
  if (context.intent === "delayed_customers") {
    const risks = byType("customer_risk").slice(0, 5);
    return { ...answerBase, supported: true, heading: risks.length ? `${risks.length} high-value customer${risks.length === 1 ? " has" : "s have"} a delayed order` : "No high-value customers have delayed orders", answer: risks.length ? risks[0].detected : "No available record crossed both the customer-value and overdue-order thresholds.", evidence: risks.map(evidenceFromAlert), recommendation: risks[0]?.recommendedAction ?? "Continue monitoring current orders." };
  }
  if (context.intent === "top_products") {
    const products = topSellingProducts(snapshot, 3).filter(product => product.unitsSold30d > 0);
    if (!products.length) return noFinding("No product sales were found", "The available snapshot does not contain recorded order-line sales in the 30-day window.");
    return { ...answerBase, caveat: "Recorded order-line value does not allocate refunds, discounts, or payment-state adjustments at product level.", supported: true, heading: `${products[0].title} leads recorded 30-day order-line value`, answer: `Its order lines total ${formatMoney(products[0].revenue30d, currency)} across ${products[0].unitsSold30d} units in the available 30-day window. This is a gross order-line measure, not net product revenue.`, evidence: products.map(product => ({ recordId: product.id, recordType: "product" as const, label: product.title, value: `${formatMoney(product.revenue30d, currency)} recorded order-line value · ${product.unitsSold30d} units`, href: productEvidenceHref(snapshot, product.id) })), recommendation: "Protect availability on strong sellers while checking margin before changing merchandising." };
  }
  return { ...answerBase, supported: true, heading: "Seven-day operations snapshot", answer: `${metrics.orders7d} orders totalled ${formatMoney(metrics.revenue7d.amount, currency)} in gross order value. ${metrics.overdueOrders} paid orders are overdue, ${metrics.lowStockVariants} variants are low, and ${metrics.refunds7d} refunds were recorded.`, evidence: alerts.slice(0, 3).map(evidenceFromAlert), recommendation: "Start with the highest-scoring alert, then review the underlying record before action." };
}

function noFinding(heading: string, answer: string): AskStoreAnswer {
  return { supported: true, heading, answer, evidence: [], recommendation: "No action is required from this rule right now.", caveat: "Based on available store data.", generatedBy: "deterministic_fallback" };
}

function productEvidenceHref(snapshot: StoreSnapshot, productId: string) {
  const product = snapshot.products.find(item => item.id === productId);
  if (!product?.variants.length) return "/inventory";
  const revenueByVariant = new Map<string, number>();
  snapshot.orders
    .filter(order => hoursBetween(snapshot.generatedAt, order.createdAt) <= 30 * 24)
    .flatMap(order => order.lineItems)
    .filter(lineItem => lineItem.productId === productId && lineItem.variantId)
    .forEach(lineItem => revenueByVariant.set(lineItem.variantId!, (revenueByVariant.get(lineItem.variantId!) ?? 0) + lineItem.total.amount));
  const leadingVariant = [...product.variants].sort((a, b) => (revenueByVariant.get(b.id) ?? 0) - (revenueByVariant.get(a.id) ?? 0))[0];
  return `/inventory/${leadingVariant.id}`;
}

function evidenceMatches(left: AskStoreAnswer["evidence"][number], right: AskStoreAnswer["evidence"][number]) {
  return left.recordId === right.recordId
    && left.recordType === right.recordType
    && left.label === right.label
    && left.value === right.value
    && left.href === right.href;
}

export function validateGroundedAnswer(answer: AskStoreAnswer, context: GroundingContext, fallback: AskStoreAnswer) {
  if (answer.generatedBy !== "openai" || answer.supported !== fallback.supported) return false;
  if (answer.heading !== fallback.heading || answer.answer !== fallback.answer) return false;
  if (answer.recommendation !== fallback.recommendation || answer.caveat !== fallback.caveat) return false;
  if (answer.evidence.length !== fallback.evidence.length) return false;
  if (!answer.evidence.every((item, index) => evidenceMatches(item, fallback.evidence[index]))) return false;
  if (!answer.supported) return answer.evidence.length === 0;
  return answer.evidence.every(item => context.allowedRecordIds.includes(item.recordId));
}
