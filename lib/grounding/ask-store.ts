import { z } from "zod";
import type { OperationalAlert, OperationsMetrics, Order, StoreSnapshot } from "@/lib/domain/types";
import { ageLabel, hoursBetween } from "@/lib/domain/format";
import { calculateMerchantBacklogs, calculateOrderPriority, getPrioritizedOrders, isOpenOrder } from "@/lib/domain/metrics";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

export const evidenceSchema = z.object({
  recordId: z.string(),
  recordType: z.enum(["order", "product", "variant", "customer", "refund", "alert", "merchant", "store"]),
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
export type AskIntent = "merchant_overdue" | "paid_unfulfilled" | "over_48" | "priorities" | "backlog_change" | "oldest_store" | "blocked_orders" | "inventory_blockers" | "workload_summary" | "why_flagged" | "delayed_customers" | "merchant_attention" | "unsupported";

export type GroundingContext = {
  intent: AskIntent;
  question: string;
  scope: { merchantId: string | null; storeId: string | null };
  facts: Record<string, unknown>;
  allowedRecordIds: string[];
};

export function classifyIntent(question: string): AskIntent {
  const q = question.toLowerCase();
  if ((q.includes("why") || q.includes("flag")) && (q.includes("order") || q.includes("#"))) return "why_flagged";
  if (q.includes("paid") && (q.includes("unfulfilled") || q.includes("awaiting"))) return "paid_unfulfilled";
  if (q.includes("48") || q.includes("longer than") || q.includes("older than")) return "over_48";
  if (q.includes("most overdue")) return "merchant_overdue";
  if (q.includes("backlog") && (q.includes("increase") || q.includes("grew") || q.includes("changed"))) return "backlog_change";
  if (q.includes("oldest") && q.includes("store")) return "oldest_store";
  if (q.includes("blocked")) return "blocked_orders";
  if (q.includes("inventory") && (q.includes("prevent") || q.includes("block") || q.includes("fulfill"))) return "inventory_blockers";
  if (q.includes("workload") || q.includes("by merchant")) return "workload_summary";
  if (q.includes("high-value") || q.includes("high value") || q.includes("vip")) return "delayed_customers";
  if (q.includes("process first") || q.includes("address first") || q.includes("priority") || q.includes("priorities")) return "priorities";
  if (q.includes("attention") || q.includes("focus")) return "merchant_attention";
  return "unsupported";
}

function detectScope(question: string, snapshot: StoreSnapshot) {
  const q = question.toLowerCase();
  const merchant = snapshot.merchants.find(item => q.includes(item.name.toLowerCase()));
  const store = snapshot.stores.find(item => q.includes(item.name.toLowerCase()));
  return { merchantId: merchant?.id ?? store?.merchantId ?? null, storeId: store?.id ?? null };
}

function scopedOrders(snapshot: StoreSnapshot, scope: GroundingContext["scope"]) {
  return snapshot.orders.filter(order => (!scope.merchantId || order.merchantId === scope.merchantId) && (!scope.storeId || order.storeId === scope.storeId));
}

export function buildGroundingContext(question: string, snapshot: StoreSnapshot, alerts: OperationalAlert[], metrics: OperationsMetrics): GroundingContext {
  const intent = classifyIntent(question);
  const scope = detectScope(question, snapshot);
  const orders = scopedOrders(snapshot, scope);
  const scopedAlerts = alerts.filter(alert => (!scope.merchantId || alert.merchantId === scope.merchantId) && (!scope.storeId || alert.storeId === scope.storeId));
  const referencedOrder = question.match(/#\d+/)?.[0];
  const facts = {
    metrics,
    scope,
    merchantCount: snapshot.merchants.length,
    storeCount: snapshot.stores.length,
    orders: orders.slice(0, 20),
    alerts: scopedAlerts.slice(0, 20),
    referencedOrder,
    backlogs: calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS),
  };
  const allowedRecordIds = new Set<string>();
  for (const merchant of snapshot.merchants) if (!scope.merchantId || merchant.id === scope.merchantId) allowedRecordIds.add(merchant.id);
  for (const store of snapshot.stores) if ((!scope.merchantId || store.merchantId === scope.merchantId) && (!scope.storeId || store.id === scope.storeId)) allowedRecordIds.add(store.id);
  for (const order of orders) { allowedRecordIds.add(order.id); if (order.customerId) allowedRecordIds.add(order.customerId); for (const item of order.lineItems) { if (item.productId) allowedRecordIds.add(item.productId); if (item.variantId) allowedRecordIds.add(item.variantId); } }
  for (const alert of scopedAlerts) allowedRecordIds.add(alert.id);
  return { intent, question, scope, facts, allowedRecordIds: [...allowedRecordIds] };
}

export function createFallbackAnswer(context: GroundingContext, snapshot: StoreSnapshot, alerts: OperationalAlert[], metrics: OperationsMetrics): AskStoreAnswer {
  const merchantById = new Map(snapshot.merchants.map(merchant => [merchant.id, merchant]));
  const storeById = new Map(snapshot.stores.map(store => [store.id, store]));
  const scoped = scopedOrders(snapshot, context.scope);
  const scopedAlerts = alerts.filter(alert => (!context.scope.merchantId || alert.merchantId === context.scope.merchantId) && (!context.scope.storeId || alert.storeId === context.scope.storeId));
  const backlogs = calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS).filter(item => !context.scope.merchantId || item.merchantId === context.scope.merchantId);
  const base = { caveat: "Based only on available simulated store data. Facts and recommendations are separated, and no Shopify action was performed.", generatedBy: "deterministic_fallback" as const };
  const orderEvidence = (order: Order) => {
    const merchant = merchantById.get(order.merchantId)!;
    const store = storeById.get(order.storeId)!;
    return { recordId: order.id, recordType: "order" as const, label: `${merchant.name} · ${store.name} · ${order.name}`, value: `${ageLabel(hoursBetween(snapshot.generatedAt, order.createdAt))} · ${order.financialStatus.replaceAll("_", " ")} · ${order.fulfillmentStatus.replaceAll("_", " ")}`, href: `/orders/${order.id}` };
  };
  const merchantEvidence = (merchantId: string) => {
    const merchant = merchantById.get(merchantId)!;
    const store = snapshot.stores.find(item => item.merchantId === merchantId)!;
    const backlog = backlogs.find(item => item.merchantId === merchantId) ?? calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS).find(item => item.merchantId === merchantId)!;
    return { recordId: merchant.id, recordType: "merchant" as const, label: `${merchant.name} · ${store.name}`, value: `${backlog.openOrders} open · ${backlog.olderThan48h} older than 48h · change ${backlog.backlogChange >= 0 ? "+" : ""}${backlog.backlogChange}`, href: `/merchants/${merchant.id}` };
  };
  const unsupported = (): AskStoreAnswer => ({ ...base, supported: false, heading: "This question is outside the available operations data", answer: "Ask about merchant backlogs, paid and unfulfilled orders, ageing orders, payment blocks, inventory constraints, workload, priorities, or why a specific order was flagged.", evidence: [], recommendation: "Choose a supported operational question or add the required source data.", caveat: "Insufficient information. No unsupported assumption was made." });
  const noFinding = (heading: string, answer: string): AskStoreAnswer => ({ ...base, supported: true, heading, answer, evidence: [], recommendation: "No action is required from this rule right now." });
  if (context.intent === "unsupported") return unsupported();

  if (context.intent === "why_flagged") {
    const number = context.question.match(/#\d+/)?.[0];
    const order = scoped.find(item => item.name === number);
    if (!order) return noFinding("No matching order is available in this scope", "The requested order was not found inside the selected merchant or store boundary.");
    const priority = calculateOrderPriority(snapshot, order, DEFAULT_THRESHOLDS);
    return { ...base, supported: true, heading: `${merchantById.get(order.merchantId)?.name} · ${order.name} has priority ${priority.score}`, answer: `The rule-based score reflects: ${priority.reasons.join("; ").toLowerCase()}.`, evidence: [orderEvidence(order)], recommendation: priority.recommendedAction };
  }
  if (context.intent === "paid_unfulfilled") {
    const orders = scoped.filter(order => isOpenOrder(order) && order.financialStatus === "PAID").sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
    if (!orders.length) return noFinding("No paid orders are awaiting fulfilment", "No available order in this scope is both paid and still open.");
    return { ...base, supported: true, heading: `${orders.length} paid order${orders.length === 1 ? " is" : "s are"} awaiting fulfilment`, answer: `${merchantById.get(orders[0].merchantId)?.name} · ${orders[0].name} is the oldest at ${ageLabel(hoursBetween(snapshot.generatedAt, orders[0].createdAt))}.`, evidence: orders.slice(0,6).map(orderEvidence), recommendation: "Start with the highest-priority paid order, then preserve merchant and store context through picking." };
  }
  if (context.intent === "over_48") {
    const orders = scoped.filter(order => isOpenOrder(order) && hoursBetween(snapshot.generatedAt, order.createdAt) > DEFAULT_THRESHOLDS.overdueHours).sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
    if (!orders.length) return noFinding("No orders are older than 48 hours", "No open order in the selected scope crossed the 48-hour threshold.");
    return { ...base, supported: true, heading: `${orders.length} order${orders.length === 1 ? " is" : "s are"} older than 48 hours`, answer: `${merchantById.get(orders[0].merchantId)?.name} · ${orders[0].name} is the oldest available order at ${ageLabel(hoursBetween(snapshot.generatedAt, orders[0].createdAt))}.`, evidence: orders.slice(0,6).map(orderEvidence), recommendation: "Assign owners to paid orders first and document payment or inventory blockers separately." };
  }
  if (context.intent === "blocked_orders") {
    const orders = scoped.filter(order => isOpenOrder(order) && !["PAID","AUTHORIZED"].includes(order.financialStatus));
    if (!orders.length) return noFinding("No payment-blocked orders are available", "Every open order in this scope has confirmed payment or authorization.");
    return { ...base, supported: true, heading: `${orders.length} order${orders.length === 1 ? " is" : "s are"} blocked by payment`, answer: "These orders should not be released to picking until the merchant confirms payment readiness.", evidence: orders.slice(0,6).map(orderEvidence), recommendation: "Review payment status by merchant and keep blocked orders outside the ready-to-pick sequence." };
  }
  if (context.intent === "inventory_blockers") {
    const inventoryAlerts = scopedAlerts.filter(alert => alert.issueType === "inventory_constraint");
    if (!inventoryAlerts.length) return noFinding("No current inventory constraint affects an open order", "No same-store variant has availability below the quantity required by an open order.");
    return { ...base, supported: true, heading: `${inventoryAlerts.length} order${inventoryAlerts.length === 1 ? " has" : "s have"} an inventory constraint`, answer: inventoryAlerts[0].detected, evidence: inventoryAlerts.slice(0,6).map(alert => ({ recordId: alert.id, recordType: "alert" as const, label: alert.title, value: alert.detected, href: `/issues/${alert.id}` })), recommendation: "Confirm physical stock and merchant allocation before releasing the affected orders." };
  }
  if (context.intent === "delayed_customers") {
    const risks = scopedAlerts.filter(alert => alert.issueType === "customer_risk");
    if (!risks.length) return noFinding("No high-value customers have delayed orders in this scope", "No same-store customer crossed both the value and delay thresholds.");
    return { ...base, supported: true, heading: `${risks.length} delayed high-value customer order${risks.length === 1 ? "" : "s"}`, answer: risks[0].detected, evidence: risks.slice(0,6).map(alert => ({ recordId: alert.id, recordType: "alert" as const, label: alert.title, value: alert.detected, href: `/issues/${alert.id}` })), recommendation: "Prioritize fulfilment review and give the relevant merchant an accurate status." };
  }
  if (context.intent === "merchant_overdue") {
    const leader = [...backlogs].sort((a,b)=>b.olderThan48h-a.olderThan48h||b.oldestOrderHours-a.oldestOrderHours)[0];
    if (!leader || leader.olderThan48h === 0) return noFinding("No merchant has overdue orders", "No open order crossed the 48-hour threshold.");
    return { ...base, supported: true, heading: `${merchantById.get(leader.merchantId)?.name} has the most overdue orders`, answer: `${leader.olderThan48h} orders are older than 48 hours; the oldest is ${ageLabel(leader.oldestOrderHours)}.`, evidence: [merchantEvidence(leader.merchantId)], recommendation: "Review that merchant’s oldest paid orders and current capacity first." };
  }
  if (context.intent === "backlog_change") {
    const leader = [...backlogs].sort((a,b)=>b.backlogChange-a.backlogChange)[0];
    if (!leader || leader.backlogChange <= 0) return noFinding("No merchant backlog increased", "The available comparison does not show a positive backlog change.");
    return { ...base, supported: true, heading: `${merchantById.get(leader.merchantId)?.name} backlog increased the most`, answer: `Open orders increased by ${leader.backlogChange}, from ${leader.openOrders-leader.backlogChange} to ${leader.openOrders}.`, evidence: [merchantEvidence(leader.merchantId)], recommendation: "Review staffing and assign the oldest ready orders before the backlog ages further." };
  }
  if (context.intent === "oldest_store") {
    const leader = [...backlogs].sort((a,b)=>b.oldestOrderHours-a.oldestOrderHours)[0];
    if (!leader || leader.oldestOrderHours === 0) return noFinding("No open orders are available", "Every store in the selected scope has a clear fulfilment queue.");
    return { ...base, supported: true, heading: `${storeById.get(leader.storeId)?.name} has the oldest unfulfilled order`, answer: `The oldest open order is ${ageLabel(leader.oldestOrderHours)}.`, evidence: [merchantEvidence(leader.merchantId)], recommendation: "Open the merchant queue and review payment, inventory, and assignment status." };
  }
  if (context.intent === "workload_summary") {
    const visible = backlogs.slice(0,6);
    return { ...base, supported: true, heading: `${metrics.totalOpenOrders} open orders across ${snapshot.merchants.length} merchants`, answer: `${metrics.paidUnfulfilledOrders} are paid and awaiting fulfilment, ${metrics.olderThan48h} are older than 48 hours, and ${metrics.paymentBlockedOrders} are blocked by payment.`, evidence: visible.map(item => merchantEvidence(item.merchantId)), recommendation: "Use the unified queue to process the highest-priority ready work while separating blocked orders." };
  }
  const prioritized = getPrioritizedOrders({ ...snapshot, orders: scoped }, DEFAULT_THRESHOLDS).slice(0,3);
  if (!prioritized.length) return noFinding("No current fulfilment priorities are available", "The selected scope contains no open orders.");
  return { ...base, supported: true, heading: `${merchantById.get(prioritized[0].order.merchantId)?.name} · ${prioritized[0].order.name} should be reviewed first`, answer: `Its operational priority is ${prioritized[0].priority.score}/100, based on deterministic order, merchant, payment, age, customer, and inventory facts.`, evidence: prioritized.map(item => orderEvidence(item.order)), recommendation: prioritized[0].priority.recommendedAction };
}

function evidenceMatches(left: AskStoreAnswer["evidence"][number], right: AskStoreAnswer["evidence"][number]) {
  return left.recordId === right.recordId && left.recordType === right.recordType && left.label === right.label && left.value === right.value && left.href === right.href;
}

export function validateGroundedAnswer(answer: AskStoreAnswer, context: GroundingContext, fallback: AskStoreAnswer) {
  if (answer.generatedBy !== "openai" || answer.supported !== fallback.supported) return false;
  if (answer.heading !== fallback.heading || answer.answer !== fallback.answer || answer.recommendation !== fallback.recommendation || answer.caveat !== fallback.caveat) return false;
  if (answer.evidence.length !== fallback.evidence.length || !answer.evidence.every((item, index) => evidenceMatches(item, fallback.evidence[index]))) return false;
  return !answer.supported ? answer.evidence.length === 0 : answer.evidence.every(item => context.allowedRecordIds.includes(item.recordId));
}
