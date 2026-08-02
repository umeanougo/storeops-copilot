import type { AlertThresholds, MerchantBacklog, OperationsMetrics, Order, OrderPriority, StoreSnapshot } from "./types";
import { hoursBetween } from "./format";

export const isOpenOrder = (order: Order) => order.fulfillmentStatus !== "FULFILLED";
export const isPaymentConfirmed = (order: Order) => order.financialStatus === "PAID" || order.financialStatus === "AUTHORIZED";

export function calculateMerchantBacklogs(snapshot: StoreSnapshot, thresholds: AlertThresholds): MerchantBacklog[] {
  return snapshot.merchants.map(merchant => {
    const store = snapshot.stores.find(item => item.merchantId === merchant.id)!;
    const openOrders = snapshot.orders.filter(order => order.merchantId === merchant.id && isOpenOrder(order));
    const ages = openOrders.map(order => hoursBetween(snapshot.generatedAt, order.createdAt));
    const backlogChange = openOrders.length - merchant.previousOpenOrders;
    const olderThan48h = ages.filter(age => age > thresholds.overdueHours).length;
    const elevated = olderThan48h > 0 || (openOrders.length >= thresholds.backlogOpenOrders && backlogChange >= thresholds.backlogIncreaseOrders);
    const riskLevel: MerchantBacklog["riskLevel"] = elevated ? "elevated" : openOrders.length > 0 ? "watch" : "clear";
    return {
      merchantId: merchant.id,
      storeId: store.id,
      openOrders: openOrders.length,
      paidUnfulfilled: openOrders.filter(order => order.financialStatus === "PAID").length,
      olderThan24h: ages.filter(age => age > thresholds.ageingWarningHours).length,
      olderThan48h,
      partiallyFulfilled: openOrders.filter(order => order.fulfillmentStatus === "PARTIALLY_FULFILLED").length,
      paymentBlocked: openOrders.filter(order => !isPaymentConfirmed(order)).length,
      averageAgeHours: ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0,
      oldestOrderHours: ages.length ? Math.max(...ages) : 0,
      backlogChange,
      riskLevel,
    };
  }).sort((a, b) => b.olderThan48h - a.olderThan48h || b.openOrders - a.openOrders || b.oldestOrderHours - a.oldestOrderHours);
}

export function calculateOrderPriority(snapshot: StoreSnapshot, order: Order, thresholds: AlertThresholds): OrderPriority {
  if (!isOpenOrder(order)) return { orderId: order.id, score: 0, band: "routine", reasons: ["Order is fulfilled"], recommendedAction: "No fulfilment action is required." };
  const age = hoursBetween(snapshot.generatedAt, order.createdAt);
  const merchant = snapshot.merchants.find(item => item.id === order.merchantId);
  const customer = order.customerId ? snapshot.customers.find(item => item.id === order.customerId && item.merchantId === order.merchantId && item.storeId === order.storeId) : undefined;
  const backlog = calculateMerchantBacklogs(snapshot, thresholds).find(item => item.merchantId === order.merchantId);
  const inventoryBlocked = order.lineItems.some(item => {
    const variant = snapshot.products.flatMap(product => product.variants).find(candidate => candidate.id === item.variantId && candidate.merchantId === order.merchantId && candidate.storeId === order.storeId);
    return variant != null && variant.available < item.quantity;
  });
  const reasons: string[] = [];
  let score = 10;
  if (order.financialStatus === "PAID") { score += 18; reasons.push("Payment confirmed and awaiting fulfilment"); }
  else if (!isPaymentConfirmed(order)) { score += 12; reasons.push("Fulfilment blocked until payment is confirmed"); }
  if (age > thresholds.overdueHours) { score += 34; reasons.push(`Order is older than ${thresholds.overdueHours} hours`); }
  else if (age > thresholds.ageingWarningHours) { score += 22; reasons.push(`Order is older than ${thresholds.ageingWarningHours} hours`); }
  else { score += Math.min(10, Math.floor(age / 3)); }
  if (merchant && age > merchant.serviceLevelTargetHours) { score += 12; reasons.push(`Merchant service-level target is ${merchant.serviceLevelTargetHours} hours`); }
  if (order.fulfillmentStatus === "PARTIALLY_FULFILLED") { score += 14; reasons.push("Order is only partially fulfilled"); }
  if (["UNKNOWN", "REQUEST_DECLINED", "ON_HOLD"].includes(order.fulfillmentStatus)) { score += 12; reasons.push("Fulfilment status needs operator review"); }
  if (order.total.amount >= thresholds.highValueOrderAmount) { score += 8; reasons.push("Order crosses the high-value review threshold"); }
  if (customer && customer.lifetimeValue.amount >= thresholds.highValueCustomerAmount && age > thresholds.ageingWarningHours) { score += 8; reasons.push("High-value customer has a delayed order"); }
  if (inventoryBlocked) { score += 16; reasons.push("Available inventory is below the order quantity"); }
  if (backlog?.riskLevel === "elevated") { score += 5; reasons.push("Merchant backlog is elevated"); }
  if (order.riskSignals.length) { score += 4; reasons.push("The source record includes a manual risk signal"); }
  score = Math.min(100, score);
  const band = score >= 85 ? "critical" : score >= 65 ? "high" : score >= 40 ? "medium" : "routine";
  const recommendedAction = !isPaymentConfirmed(order)
    ? "Confirm payment status before releasing the order to picking."
    : inventoryBlocked
      ? "Confirm inventory allocation and escalate the shortfall before picking."
      : order.fulfillmentStatus === "PARTIALLY_FULFILLED"
        ? "Review remaining quantities and complete or document the outstanding fulfilment."
        : age > thresholds.overdueHours
          ? "Assign an owner and move the order into picking or document the blocking exception."
          : "Review readiness, then move the order into the next fulfilment step.";
  return { orderId: order.id, score, band, reasons, recommendedAction };
}

export function getPrioritizedOrders(snapshot: StoreSnapshot, thresholds: AlertThresholds) {
  return snapshot.orders
    .filter(isOpenOrder)
    .map(order => ({ order, priority: calculateOrderPriority(snapshot, order, thresholds) }))
    .sort((a, b) => b.priority.score - a.priority.score || new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime());
}

export function calculateMetrics(snapshot: StoreSnapshot, thresholds: AlertThresholds): OperationsMetrics {
  const open = snapshot.orders.filter(isOpenOrder);
  const ages = open.map(order => hoursBetween(snapshot.generatedAt, order.createdAt));
  const backlogs = calculateMerchantBacklogs(snapshot, thresholds);
  const inventoryConstraints = open.filter(order => order.lineItems.some(item => {
    const variant = snapshot.products.flatMap(product => product.variants).find(candidate => candidate.id === item.variantId && candidate.merchantId === order.merchantId && candidate.storeId === order.storeId);
    return variant != null && variant.available < item.quantity;
  })).length;
  return {
    totalOpenOrders: open.length,
    paidUnfulfilledOrders: open.filter(order => order.financialStatus === "PAID").length,
    olderThan24h: ages.filter(age => age > thresholds.ageingWarningHours).length,
    olderThan48h: ages.filter(age => age > thresholds.overdueHours).length,
    merchantsAtRisk: backlogs.filter(backlog => backlog.riskLevel === "elevated").length,
    paymentBlockedOrders: open.filter(order => !isPaymentConfirmed(order)).length,
    inventoryConstraints,
    oldestOutstandingHours: ages.length ? Math.max(...ages) : 0,
  };
}
