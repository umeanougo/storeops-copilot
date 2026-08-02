import type { AlertThresholds, OperationalAlert, Severity, StoreSnapshot } from "./types";
import { ageLabel, formatMoney, hoursBetween } from "./format";

const severityBase: Record<Severity, number> = { critical: 90, high: 70, medium: 50, low: 30 };
const score = (severity: Severity, modifier = 0) => Math.min(100, severityBase[severity] + modifier);

export function detectAlerts(snapshot: StoreSnapshot, thresholds: AlertThresholds): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  const customerById = new Map(snapshot.customers.map(customer => [customer.id, customer]));

  for (const order of snapshot.orders) {
    if (order.financialStatus !== "PAID" || order.fulfillmentStatus === "FULFILLED") continue;
    const ageHours = hoursBetween(snapshot.generatedAt, order.createdAt);
    if (ageHours <= thresholds.overdueHours) continue;
    const severity: Severity = ageHours >= 72 ? "critical" : "high";
    const customer = order.customerId ? customerById.get(order.customerId) : undefined;
    alerts.push({
      id: `overdue-${order.id}`,
      title: `${order.name} has been waiting ${ageLabel(ageHours)}`,
      severity,
      issueType: "overdue_order",
      detected: `Paid order ${order.name} remains ${order.fulfillmentStatus.toLowerCase().replaceAll("_", " ")} ${ageLabel(ageHours)} after creation.`,
      why: `The order exceeded the ${thresholds.overdueHours}-hour fulfilment threshold by ${ageLabel(ageHours - thresholds.overdueHours)}. Delays can increase cancellation risk and customer support contacts.`,
      supportingData: [
        { label: "Order age", value: ageLabel(ageHours), recordType: "order", recordId: order.id },
        { label: "Order value", value: formatMoney(order.total.amount, order.total.currencyCode), recordType: "order", recordId: order.id },
        { label: "Customer", value: order.customerName, recordType: "customer", recordId: order.customerId ?? undefined },
        { label: "Fulfilment", value: order.fulfillmentStatus.replaceAll("_", " ") },
      ],
      rule: "Flag a paid order when it is not fulfilled within the configured time window.",
      threshold: `More than ${thresholds.overdueHours} hours unfulfilled`,
      recommendedAction: "Confirm inventory allocation and fulfilment ownership, then send the customer an accurate status update.",
      recordLink: `/orders/${order.id}`,
      recordType: "order",
      recordId: order.id,
      priorityScore: score(severity, Math.min(10, Math.floor((ageHours - thresholds.overdueHours) / 12))),
      findingSource: "deterministic_rule",
    });

    if (customer && customer.lifetimeValue.amount >= thresholds.highValueCustomerAmount) {
      alerts.push({
        id: `customer-risk-${order.id}`,
        title: `${customer.name} has a delayed order`,
        severity: "critical",
        issueType: "customer_risk",
        detected: `A customer with ${formatMoney(customer.lifetimeValue.amount, customer.lifetimeValue.currencyCode)} in lifetime value has an unresolved ${ageLabel(ageHours)}-old order.`,
        why: `The customer exceeds the ${formatMoney(thresholds.highValueCustomerAmount, customer.lifetimeValue.currencyCode)} high-value threshold and the related order exceeded the fulfilment threshold.`,
        supportingData: [
          { label: "Customer lifetime value", value: formatMoney(customer.lifetimeValue.amount, customer.lifetimeValue.currencyCode), recordType: "customer", recordId: customer.id },
          { label: "Lifetime orders", value: String(customer.ordersCount), recordType: "customer", recordId: customer.id },
          { label: "Delayed order", value: order.name, recordType: "order", recordId: order.id },
          { label: "Delay", value: ageLabel(ageHours), recordType: "order", recordId: order.id },
        ],
        rule: "Escalate an overdue order when its customer exceeds the lifetime-value threshold.",
        threshold: `${formatMoney(thresholds.highValueCustomerAmount, customer.lifetimeValue.currencyCode)} lifetime value + overdue order`,
        recommendedAction: "Assign an owner to the order and provide a personal update before the end of the day.",
        recordLink: `/customers/${customer.id}`,
        recordType: "customer",
        recordId: customer.id,
        priorityScore: Math.min(
          100,
          90
            + Math.min(5, Math.floor((ageHours - thresholds.overdueHours) / 12))
            + Math.min(5, Math.floor(customer.lifetimeValue.amount / thresholds.highValueCustomerAmount)),
        ),
        findingSource: "deterministic_rule",
      });
    }
  }

  for (const product of snapshot.products.filter(product => product.status === "ACTIVE")) {
    for (const variant of product.variants) {
      if (variant.available < thresholds.lowInventoryUnits) {
        const severity: Severity = variant.available === 0 ? "critical" : variant.available <= 2 ? "high" : "medium";
        alerts.push({
          id: `low-stock-${variant.id}`,
          title: `${product.title} · ${variant.title} is running low`,
          severity,
          issueType: "low_inventory",
          detected: `${variant.available} units are available while ${variant.unitsSold7d} sold in the last seven days.`,
          why: `Available inventory is below the ${thresholds.lowInventoryUnits}-unit rule. This is a current stock risk, not a demand forecast.`,
          supportingData: [
            { label: "Available", value: `${variant.available} units`, recordType: "variant", recordId: variant.id },
            { label: "Sold · 7 days", value: `${variant.unitsSold7d} units`, recordType: "variant", recordId: variant.id },
            { label: "Sold · 30 days", value: `${variant.unitsSold30d} units`, recordType: "variant", recordId: variant.id },
            { label: "SKU", value: variant.sku, recordType: "variant", recordId: variant.id },
          ],
          rule: "Flag active variants with available inventory below the configured floor.",
          threshold: `Fewer than ${thresholds.lowInventoryUnits} units`,
          recommendedAction: variant.available === 0 ? "Confirm replenishment timing and consider pausing promotion until availability is restored." : "Review inbound inventory and recent sales before deciding whether to reorder.",
          recordLink: `/inventory/${variant.id}`,
          recordType: "product",
          recordId: variant.id,
          priorityScore: score(severity, Math.min(8, variant.unitsSold7d)),
          findingSource: "deterministic_rule",
        });
      }

      if (variant.available >= thresholds.excessInventoryUnits && variant.unitsSold30d <= thresholds.lowVelocityUnits30d) {
        const daysSinceSale = variant.lastSoldAt ? Math.floor(hoursBetween(snapshot.generatedAt, variant.lastSoldAt) / 24) : null;
        alerts.push({
          id: `excess-${variant.id}`,
          title: `${product.title} · ${variant.title} may be overstocked`,
          severity: "medium",
          issueType: "excess_inventory",
          detected: `${variant.available} units are available, with ${variant.unitsSold30d} sold in the last 30 days.`,
          why: `Inventory meets the ${thresholds.excessInventoryUnits}-unit excess threshold while 30-day sales are at or below ${thresholds.lowVelocityUnits30d}. Seasonality and margin are not included.`,
          supportingData: [
            { label: "Available", value: `${variant.available} units`, recordType: "variant", recordId: variant.id },
            { label: "Sold · 30 days", value: `${variant.unitsSold30d} units`, recordType: "variant", recordId: variant.id },
            { label: "Last sale", value: daysSinceSale == null ? "No sale recorded" : `${daysSinceSale} days ago`, recordType: "variant", recordId: variant.id },
            { label: "Inventory value", value: formatMoney(variant.available * variant.price.amount, variant.price.currencyCode), recordType: "variant", recordId: variant.id },
          ],
          rule: "Flag active variants with high availability and no or very few sales in the last 30 days.",
          threshold: `At least ${thresholds.excessInventoryUnits} units + no more than ${thresholds.lowVelocityUnits30d} sales in 30 days`,
          recommendedAction: "Pause replenishment and test placement, bundling, or audience fit before considering a discount.",
          recordLink: `/inventory/${variant.id}`,
          recordType: "product",
          recordId: variant.id,
          priorityScore: score("medium", Math.min(8, Math.floor(variant.available / 30))),
          findingSource: "deterministic_rule",
        });
      }
    }
  }

  const recentRefunds = snapshot.refunds.filter(refund => hoursBetween(snapshot.generatedAt, refund.createdAt) <= thresholds.refundWindowDays * 24);
  const priorRefunds = snapshot.refunds.filter(refund => {
    const hours = hoursBetween(snapshot.generatedAt, refund.createdAt);
    return hours > thresholds.refundWindowDays * 24 && hours <= thresholds.refundWindowDays * 48;
  });
  if (recentRefunds.length >= thresholds.refundCountThreshold && recentRefunds.length > priorRefunds.length) {
    const total = recentRefunds.reduce((sum, refund) => sum + refund.amount.amount, 0);
    const mostRecentRefund = recentRefunds.reduce((latest, refund) =>
      new Date(refund.createdAt).getTime() > new Date(latest.createdAt).getTime() ? refund : latest,
    );
    alerts.push({
      id: "refund-activity-recent",
      title: "Refund activity increased this week",
      severity: recentRefunds.length >= thresholds.refundCountThreshold + 2 ? "high" : "medium",
      issueType: "refund_activity",
      detected: `${recentRefunds.length} refunds worth ${formatMoney(total, snapshot.shop.currencyCode)} were recorded in the last ${thresholds.refundWindowDays} days.`,
      why: `The recent count meets the ${thresholds.refundCountThreshold}-refund threshold and is higher than the prior ${thresholds.refundWindowDays}-day period (${priorRefunds.length}).`,
      supportingData: recentRefunds.map(refund => ({ label: refund.orderName, value: formatMoney(refund.amount.amount, refund.amount.currencyCode), recordType: "refund" as const, recordId: refund.id })),
      rule: "Flag when the recent refund count meets the baseline and exceeds the immediately preceding period.",
      threshold: `${thresholds.refundCountThreshold}+ refunds in ${thresholds.refundWindowDays} days and above prior period`,
      recommendedAction: "Review the affected orders for a shared product, reason, or fulfilment pattern before changing policy.",
      recordLink: `/orders/${mostRecentRefund.orderId}`,
      recordType: "refund",
      recordId: "refund-activity-recent",
      priorityScore: score("medium", recentRefunds.length),
      findingSource: "deterministic_rule",
    });
  }

  return alerts.sort((a, b) => b.priorityScore - a.priorityScore || a.title.localeCompare(b.title));
}

export function getAlertById(alerts: OperationalAlert[], id: string) {
  return alerts.find(alert => alert.id === id) ?? null;
}
