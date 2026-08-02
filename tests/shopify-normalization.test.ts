import { describe, expect, it } from "vitest";
import { normalizeCustomers, normalizeIanaTimezone, normalizeOrders, normalizeProducts, normalizeRefunds } from "@/lib/shopify/client";

describe("Shopify response normalization", () => {
  it("handles an order with missing customer, fulfilment, and variant", () => {
    const orders = normalizeOrders([{ id:"gid://shopify/Order/1", name:"#1", createdAt:"2026-08-01T00:00:00Z", updatedAt:"2026-08-01T00:00:00Z", lineItems:{nodes:[{id:"li1",title:"Deleted product",quantity:1}]}}], "CAD");
    expect(orders[0].customerName).toBe("Guest");
    expect(orders[0].fulfillmentStatus).toBe("UNFULFILLED");
    expect(orders[0].lineItems[0].variantId).toBeNull();
    expect(orders[0].total).toEqual({ amount: 0, currencyCode: "CAD" });
    expect(orders[0].financialStatus).toBe("UNKNOWN");
  });

  it("preserves supported financial statuses and does not treat unknown values as paid", () => {
    const base = { id:"gid://shopify/Order/1", name:"#1", createdAt:"2026-08-01T00:00:00Z", updatedAt:"2026-08-01T00:00:00Z" };
    const orders = normalizeOrders([
      { ...base, id:"o1", displayFinancialStatus:"AUTHORIZED" },
      { ...base, id:"o2", displayFinancialStatus:"A_NEW_STATUS" },
    ], "CAD");
    expect(orders[0].financialStatus).toBe("AUTHORIZED");
    expect(orders[1].financialStatus).toBe("UNKNOWN");
  });

  it("uses only valid IANA timezones", () => {
    expect(normalizeIanaTimezone("America/Toronto")).toBe("America/Toronto");
    expect(normalizeIanaTimezone("EST")).toBe("EST");
    expect(normalizeIanaTimezone("Store timezone")).toBe("UTC");
    expect(normalizeIanaTimezone()).toBe("UTC");
  });

  it("normalizes optional customer values without fabricating contact data", () => {
    const customers = normalizeCustomers([{ id:"c1", displayName:null }], "CAD");
    expect(customers[0].name).toBe("Unknown customer");
    expect(customers[0].email).toBe("");
    expect(customers[0].lifetimeValue.currencyCode).toBe("CAD");
  });

  it("normalizes money and inventory values", () => {
    const products = normalizeProducts([{ id:"p1", title:"Test", status:"ACTIVE", variants:{nodes:[{id:"v1",title:"Default",price:"19.95",inventoryQuantity:null}]}}], "CAD");
    expect(products[0].variants[0].price.amount).toBe(19.95);
    expect(products[0].variants[0].available).toBe(0);
  });

  it("retains refund currency and order relationship", () => {
    const refunds = normalizeRefunds([{ id:"o1", name:"#1", createdAt:"2026-08-01", updatedAt:"2026-08-01", refunds:[{id:"r1",createdAt:"2026-08-02",totalRefundedSet:{shopMoney:{amount:"42.50",currencyCode:"USD"}}}] }], "CAD");
    expect(refunds[0].amount).toEqual({ amount: 42.5, currencyCode: "USD" });
    expect(refunds[0].orderId).toBe("o1");
  });
});
