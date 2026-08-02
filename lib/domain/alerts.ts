import type { AlertThresholds, IssueType, OperationalAlert, Order, Severity, StoreSnapshot, SupportingDatum } from "./types";
import { ageLabel, formatMoney, hoursBetween } from "./format";
import { calculateMerchantBacklogs, calculateOrderPriority, isOpenOrder, isPaymentConfirmed } from "./metrics";

const severityFor = (score: number): Severity => score >= 85 ? "critical" : score >= 65 ? "high" : score >= 40 ? "medium" : "low";

export function detectAlerts(snapshot: StoreSnapshot, thresholds: AlertThresholds): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  const merchantById = new Map(snapshot.merchants.map(merchant => [merchant.id, merchant]));
  const storeById = new Map(snapshot.stores.map(store => [store.id, store]));
  const customerById = new Map(snapshot.customers.map(customer => [customer.id, customer]));
  const variants = snapshot.products.flatMap(product => product.variants);

  const contextData = (order: Order): SupportingDatum[] => {
    const merchant = merchantById.get(order.merchantId)!;
    const store = storeById.get(order.storeId)!;
    return [
      { label: "Merchant", value: merchant.name, recordType: "merchant", recordId: merchant.id },
      { label: "Client store", value: store.name, recordType: "store", recordId: store.id },
      { label: "Order", value: order.name, recordType: "order", recordId: order.id },
    ];
  };

  const addOrderAlert = (order: Order, input: {
    suffix: string; issueType: IssueType; title: string; detected: string; why: string; rule: string; threshold: string; recommendedAction: string; score?: number; supportingData?: SupportingDatum[];
  }) => {
    const priority = calculateOrderPriority(snapshot, order, thresholds);
    const score = Math.min(100, input.score ?? priority.score);
    alerts.push({
      id: `${input.suffix}-${order.id}`,
      merchantId: order.merchantId,
      storeId: order.storeId,
      title: input.title,
      severity: severityFor(score),
      issueType: input.issueType,
      detectedAt: snapshot.generatedAt,
      detected: input.detected,
      why: input.why,
      supportingData: [...contextData(order), ...(input.supportingData ?? [])],
      rule: input.rule,
      threshold: input.threshold,
      recommendedAction: input.recommendedAction,
      recordLink: `/orders/${order.id}`,
      recordType: "order",
      recordId: order.id,
      priorityScore: score,
      findingSource: "deterministic_rule",
    });
  };

  for (const order of snapshot.orders.filter(isOpenOrder)) {
    const merchant = merchantById.get(order.merchantId)!;
    const store = storeById.get(order.storeId)!;
    const age = hoursBetween(snapshot.generatedAt, order.createdAt);
    const priority = calculateOrderPriority(snapshot, order, thresholds);
    const customer = order.customerId ? customerById.get(order.customerId) : undefined;
    const baseFacts: SupportingDatum[] = [
      { label: "Order age", value: ageLabel(age), recordType: "order", recordId: order.id },
      { label: "Payment", value: order.financialStatus.replaceAll("_", " "), recordType: "order", recordId: order.id },
      { label: "Fulfilment", value: order.fulfillmentStatus.replaceAll("_", " "), recordType: "order", recordId: order.id },
      { label: "Order value", value: formatMoney(order.total.amount, order.total.currencyCode), recordType: "order", recordId: order.id },
    ];

    if (order.financialStatus === "PAID") addOrderAlert(order, {
      suffix: "paid-unfulfilled", issueType: "paid_unfulfilled", title: `${merchant.name} · ${order.name} is ready for fulfilment`,
      detected: `${store.name} order ${order.name} is paid and remains ${order.fulfillmentStatus.toLowerCase().replaceAll("_", " ")}.`,
      why: "Payment is confirmed and the order still has fulfilment work remaining.", rule: "Flag every paid order that is not fully fulfilled.", threshold: "Payment = PAID and fulfilment ≠ FULFILLED",
      recommendedAction: priority.recommendedAction, supportingData: baseFacts,
    });

    if (age > thresholds.overdueHours) addOrderAlert(order, {
      suffix: "age-48", issueType: "order_age_48", title: `${merchant.name} · ${order.name} is beyond 48 hours`,
      detected: `${store.name} order ${order.name} has waited ${ageLabel(age)} without full fulfilment.`,
      why: `The order exceeded the ${thresholds.overdueHours}-hour operational threshold and ${merchant.name}'s ${merchant.serviceLevelTargetHours}-hour service-level target is visible for review.`,
      rule: "Flag an open order once its age is greater than 48 hours.", threshold: `More than ${thresholds.overdueHours} hours open`, recommendedAction: priority.recommendedAction, score: Math.max(75, priority.score), supportingData: baseFacts,
    });
    else if (age > thresholds.ageingWarningHours) addOrderAlert(order, {
      suffix: "age-24", issueType: "order_age_24", title: `${merchant.name} · ${order.name} is beyond 24 hours`,
      detected: `${store.name} order ${order.name} has waited ${ageLabel(age)} without full fulfilment.`,
      why: `The order exceeded the ${thresholds.ageingWarningHours}-hour ageing threshold.`, rule: "Flag an open order once its age is greater than 24 hours.", threshold: `More than ${thresholds.ageingWarningHours} hours open`, recommendedAction: priority.recommendedAction, score: Math.max(55, priority.score), supportingData: baseFacts,
    });

    if (order.total.amount >= thresholds.highValueOrderAmount && order.financialStatus === "PAID") addOrderAlert(order, {
      suffix: "high-value", issueType: "high_value_order", title: `${merchant.name} · ${order.name} is a high-value order awaiting fulfilment`,
      detected: `${store.name} order ${order.name} is worth ${formatMoney(order.total.amount, order.total.currencyCode)} and is not fully fulfilled.`,
      why: "The order crosses the review threshold and remains operationally open.", rule: "Flag a paid, open order whose total crosses the configured value threshold.", threshold: `${formatMoney(thresholds.highValueOrderAmount, order.total.currencyCode)} or more`, recommendedAction: priority.recommendedAction, score: Math.max(70, priority.score), supportingData: baseFacts,
    });

    if (customer && customer.merchantId === order.merchantId && customer.storeId === order.storeId && customer.lifetimeValue.amount >= thresholds.highValueCustomerAmount && age > thresholds.ageingWarningHours) addOrderAlert(order, {
      suffix: "customer-risk", issueType: "customer_risk", title: `${merchant.name} · delayed order for a high-value customer`,
      detected: `${customer.name} has ${formatMoney(customer.lifetimeValue.amount, customer.lifetimeValue.currencyCode)} in recorded value within ${store.name}; order ${order.name} is ${ageLabel(age)} old.`,
      why: "Customer value is evaluated only inside the same merchant and store boundary as the delayed order.", rule: "Flag a delayed order when the same-store customer crosses the value threshold.", threshold: `${formatMoney(thresholds.highValueCustomerAmount, customer.lifetimeValue.currencyCode)} customer value + order older than ${thresholds.ageingWarningHours} hours`, recommendedAction: "Prioritize the fulfilment review and give the merchant an accurate order status for customer follow-up.", score: Math.max(78, priority.score), supportingData: [{ label: "Customer", value: customer.name, recordType: "customer", recordId: customer.id }, ...baseFacts],
    });

    if (order.fulfillmentStatus === "PARTIALLY_FULFILLED") addOrderAlert(order, {
      suffix: "partial", issueType: "partial_fulfillment", title: `${merchant.name} · ${order.name} is partially fulfilled`,
      detected: `${store.name} order ${order.name} has remaining fulfilment work after a partial shipment.`,
      why: "A partially fulfilled order can be missed when operators focus only on unfulfilled status.", rule: "Flag every order whose display fulfilment status is PARTIALLY_FULFILLED.", threshold: "Fulfilment = PARTIALLY_FULFILLED", recommendedAction: priority.recommendedAction, score: Math.max(64, priority.score), supportingData: baseFacts,
    });

    if (["UNKNOWN", "REQUEST_DECLINED", "ON_HOLD"].includes(order.fulfillmentStatus)) addOrderAlert(order, {
      suffix: "status-review", issueType: "unusual_status", title: `${merchant.name} · ${order.name} needs status review`,
      detected: `${store.name} order ${order.name} has fulfilment status ${order.fulfillmentStatus.replaceAll("_", " ")}.`,
      why: "The current status does not represent a normal ready-to-pick or completed state.", rule: "Flag open orders with unknown, declined, or on-hold fulfilment status.", threshold: "Fulfilment ∈ UNKNOWN, REQUEST_DECLINED, ON_HOLD", recommendedAction: "Inspect the source order and document the blocker before allocating fulfilment capacity.", score: Math.max(58, priority.score), supportingData: baseFacts,
    });

    if (!isPaymentConfirmed(order)) addOrderAlert(order, {
      suffix: "payment-blocked", issueType: "payment_blocked", title: `${merchant.name} · ${order.name} is blocked by payment`,
      detected: `${store.name} order ${order.name} cannot be treated as fulfilment-ready because payment is ${order.financialStatus.replaceAll("_", " ")}.`,
      why: "Picking before payment confirmation can create avoidable inventory and cancellation risk.", rule: "Block fulfilment readiness when payment is neither PAID nor AUTHORIZED.", threshold: "Payment not confirmed", recommendedAction: "Confirm payment status with the merchant before releasing inventory.", score: Math.max(50, priority.score), supportingData: baseFacts,
    });

    const shortages = order.lineItems.flatMap(item => {
      const variant = variants.find(candidate => candidate.id === item.variantId && candidate.merchantId === order.merchantId && candidate.storeId === order.storeId);
      return variant && variant.available < item.quantity ? [{ item, variant }] : [];
    });
    if (shortages.length) addOrderAlert(order, {
      suffix: "inventory-blocked", issueType: "inventory_constraint", title: `${merchant.name} · inventory may block ${order.name}`,
      detected: `${shortages[0].variant.productTitle} has ${shortages[0].variant.available} available for an order requiring ${shortages[0].item.quantity}.`,
      why: "The variant and order share the same merchant and store, and available inventory is below the ordered quantity.", rule: "Flag an open order when a referenced same-store variant has fewer available units than the ordered quantity.", threshold: "Available inventory < ordered quantity", recommendedAction: "Confirm physical inventory and allocation before moving the order into picking.", score: Math.max(82, priority.score), supportingData: [{ label: "Variant", value: `${shortages[0].variant.productTitle} · ${shortages[0].variant.title}`, recordType: "variant", recordId: shortages[0].variant.id }, { label: "Available / required", value: `${shortages[0].variant.available} / ${shortages[0].item.quantity}`, recordType: "variant", recordId: shortages[0].variant.id }, ...baseFacts],
    });
  }

  for (const backlog of calculateMerchantBacklogs(snapshot, thresholds)) {
    if (backlog.openOrders < thresholds.backlogOpenOrders || backlog.backlogChange < thresholds.backlogIncreaseOrders) continue;
    const merchant = merchantById.get(backlog.merchantId)!;
    const store = storeById.get(backlog.storeId)!;
    const score = Math.min(92, 65 + backlog.olderThan48h * 6 + backlog.backlogChange * 3);
    alerts.push({
      id: `backlog-${merchant.id}`, merchantId: merchant.id, storeId: store.id, title: `${merchant.name} backlog is increasing`, severity: severityFor(score), issueType: "merchant_backlog", detectedAt: snapshot.generatedAt,
      detected: `${store.name} has ${backlog.openOrders} open orders, up ${backlog.backlogChange} from the prior demo period.`,
      why: "The current open-order count crosses both the backlog size and period-over-period increase thresholds.",
      supportingData: [{ label: "Merchant", value: merchant.name, recordType: "merchant", recordId: merchant.id }, { label: "Client store", value: store.name, recordType: "store", recordId: store.id }, { label: "Open orders", value: String(backlog.openOrders), recordType: "merchant", recordId: merchant.id }, { label: "Backlog change", value: `+${backlog.backlogChange}`, recordType: "merchant", recordId: merchant.id }, { label: "Older than 48h", value: String(backlog.olderThan48h), recordType: "merchant", recordId: merchant.id }],
      rule: "Flag a merchant when open orders and backlog growth both cross configured thresholds.", threshold: `${thresholds.backlogOpenOrders}+ open orders and increase of ${thresholds.backlogIncreaseOrders}+`, recommendedAction: "Review staffing and assign owners to the oldest paid orders for this merchant first.", recordLink: `/merchants/${merchant.id}`, recordType: "merchant", recordId: merchant.id, priorityScore: score, findingSource: "deterministic_rule",
    });
  }

  for (const variant of variants) {
    const merchant = merchantById.get(variant.merchantId)!;
    const store = storeById.get(variant.storeId)!;
    if (variant.available < thresholds.lowInventoryUnits) alerts.push({
      id: `low-stock-${variant.id}`, merchantId: variant.merchantId, storeId: variant.storeId, title: `${merchant.name} · ${variant.productTitle} is running low`, severity: variant.available === 0 ? "critical" : "medium", issueType: "low_inventory", detectedAt: snapshot.generatedAt,
      detected: `${store.name} has ${variant.available} units available; ${variant.unitsSold7d} sold in seven days.`, why: `Availability is below the ${thresholds.lowInventoryUnits}-unit review floor. This is a current inventory fact, not a forecast.`, supportingData: [{ label: "Merchant", value: merchant.name, recordType: "merchant", recordId: merchant.id }, { label: "Client store", value: store.name, recordType: "store", recordId: store.id }, { label: "Available", value: `${variant.available} units`, recordType: "variant", recordId: variant.id }, { label: "Sold · 7 days", value: `${variant.unitsSold7d} units`, recordType: "variant", recordId: variant.id }], rule: "Flag a same-store active variant below the configured inventory floor.", threshold: `Fewer than ${thresholds.lowInventoryUnits} units`, recommendedAction: "Check open-order demand and physical inventory before allocating or escalating replenishment.", recordLink: `/inventory/${variant.id}`, recordType: "product", recordId: variant.id, priorityScore: variant.available === 0 ? 90 : 54, findingSource: "deterministic_rule",
    });
  }

  return alerts.sort((a, b) => b.priorityScore - a.priorityScore || a.title.localeCompare(b.title));
}

export function getAlertById(alerts: OperationalAlert[], id: string) {
  return alerts.find(alert => alert.id === id) ?? null;
}
