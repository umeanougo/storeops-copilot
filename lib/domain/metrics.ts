import type { AlertThresholds, Money, OperationsMetrics, StoreSnapshot } from "./types";
import { hoursBetween } from "./format";

const inWindow = (asOf: string, value: string, days: number) => hoursBetween(asOf, value) <= days * 24;
const totalMoney = (values: Money[], currencyCode: string): Money => ({ amount: values.reduce((sum, value) => sum + value.amount, 0), currencyCode });

export function calculateMetrics(snapshot: StoreSnapshot, thresholds: AlertThresholds): OperationsMetrics {
  const orders7d = snapshot.orders.filter(order => inWindow(snapshot.generatedAt, order.createdAt, 7));
  const refunds7d = snapshot.refunds.filter(refund => inWindow(snapshot.generatedAt, refund.createdAt, thresholds.refundWindowDays));
  const variants = snapshot.products.flatMap(product => product.variants);
  return {
    orders7d: orders7d.length,
    revenue7d: totalMoney(orders7d.map(order => order.total), snapshot.shop.currencyCode),
    unfulfilledOrders: snapshot.orders.filter(order => order.fulfillmentStatus !== "FULFILLED").length,
    overdueOrders: snapshot.orders.filter(order => order.financialStatus === "PAID" && order.fulfillmentStatus !== "FULFILLED" && hoursBetween(snapshot.generatedAt, order.createdAt) > thresholds.overdueHours).length,
    refunds7d: refunds7d.length,
    refundValue7d: totalMoney(refunds7d.map(refund => refund.amount), snapshot.shop.currencyCode),
    lowStockVariants: variants.filter(variant => variant.available < thresholds.lowInventoryUnits).length,
    excessInventoryVariants: variants.filter(variant => variant.available >= thresholds.excessInventoryUnits && variant.unitsSold30d <= thresholds.lowVelocityUnits30d).length,
  };
}

export function topSellingProducts(snapshot: StoreSnapshot, limit = 4) {
  const recordedByProduct = new Map<string, { units: number; value: number }>();
  for (const order of snapshot.orders.filter(order => inWindow(snapshot.generatedAt, order.createdAt, 30))) {
    for (const lineItem of order.lineItems) {
      if (!lineItem.productId) continue;
      const current = recordedByProduct.get(lineItem.productId) ?? { units: 0, value: 0 };
      recordedByProduct.set(lineItem.productId, {
        units: current.units + lineItem.quantity,
        value: current.value + lineItem.total.amount,
      });
    }
  }
  return snapshot.products.map(product => ({
    id: product.id,
    title: product.title,
    unitsSold30d: recordedByProduct.get(product.id)?.units ?? 0,
    revenue30d: recordedByProduct.get(product.id)?.value ?? 0,
  })).sort((a, b) => b.revenue30d - a.revenue30d).slice(0, limit);
}

export function highestValueCustomers(snapshot: StoreSnapshot, limit = 4) {
  return [...snapshot.customers].sort((a, b) => b.lifetimeValue.amount - a.lifetimeValue.amount).slice(0, limit);
}
