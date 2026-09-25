import { afterEach, describe, expect, it } from "vitest";
import { buildFulfillmentTasks, loadConnections, normalizeCustomers, normalizeIanaTimezone, normalizeOrders, normalizeProducts, normalizeRefunds } from "@/lib/shopify/client";

const originalStoresJson = process.env.SHOPIFY_STORES_JSON;

afterEach(() => {
  if (originalStoresJson === undefined) delete process.env.SHOPIFY_STORES_JSON;
  else process.env.SHOPIFY_STORES_JSON = originalStoresJson;
});

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

  it("preserves closed and cancelled order state", () => {
    const orders = normalizeOrders([{ id:"o1", name:"#1", createdAt:"2026-08-01T00:00:00Z", updatedAt:"2026-08-01T00:00:00Z", cancelledAt:"2026-08-02T00:00:00Z", closed:true }], "CAD");
    expect(orders[0]).toMatchObject({ cancelledAt:"2026-08-02T00:00:00Z", closed:true });
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
    expect(products[0].variants[0].available).toBeNull();
  });

  it("retains refund currency and order relationship", () => {
    const raw = [{ id:"o1", name:"#1", createdAt:"2026-08-01", updatedAt:"2026-08-01", refunds:[{id:"r1",createdAt:"2026-08-02",totalRefundedSet:{shopMoney:{amount:"42.50",currencyCode:"USD"}}}] }];
    const orders = normalizeOrders(raw, "CAD");
    const refunds = normalizeRefunds(raw, "CAD");
    expect(refunds[0].amount).toEqual({ amount: 42.5, currencyCode: "USD" });
    expect(refunds[0].orderId).toBe(orders[0].id);
  });

  it("creates URL-safe, store-scoped IDs while preserving Shopify GIDs and relations", () => {
    const gids = {
      order: "gid://shopify/Order/101",
      customer: "gid://shopify/Customer/202",
      lineItem: "gid://shopify/LineItem/303",
      product: "gid://shopify/Product/404",
      variant: "gid://shopify/ProductVariant/505",
      refund: "gid://shopify/Refund/606",
    };
    const rawOrder = {
      id: gids.order,
      name: "#101",
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
      displayFinancialStatus: "PAID",
      customer: { id: gids.customer, displayName: "Ada" },
      lineItems: { nodes: [{ id: gids.lineItem, title: "Apron", quantity: 2, product: { id: gids.product }, variant: { id: gids.variant } }] },
      refunds: [{ id: gids.refund, createdAt: "2026-08-02T00:00:00Z" }],
    };
    const rawCustomer = [{ id: gids.customer, displayName: "Ada" }];
    const rawProduct = [{ id: gids.product, title: "Apron", variants: { nodes: [{ id: gids.variant, title: "Green" }] } }];

    const normalizeStore = (merchantId: string, storeId: string) => {
      const context = { merchantId, storeId };
      const orders = normalizeOrders([rawOrder], "CAD", context);
      const customers = normalizeCustomers(rawCustomer, "CAD", context);
      const sales = new Map([[orders[0].lineItems[0].variantId!, { units7: 2, units30: 2, lastSoldAt: orders[0].createdAt }]]);
      const products = normalizeProducts(rawProduct, "CAD", sales, context);
      const refunds = normalizeRefunds([rawOrder], "CAD", context);
      const tasks = buildFulfillmentTasks(orders, "2026-08-03T00:00:00Z");
      return { orders, customers, products, refunds, tasks };
    };

    const storeA = normalizeStore("merchant_a", "store_a");
    const storeB = normalizeStore("merchant_b", "store_b");
    const order = storeA.orders[0];
    const customer = storeA.customers[0];
    const product = storeA.products[0];
    const variant = product.variants[0];
    const lineItem = order.lineItems[0];
    const refund = storeA.refunds[0];
    const task = storeA.tasks[0];

    const idsA = [order.id, customer.id, product.id, variant.id, lineItem.id, refund.id, task.id];
    const idsB = [storeB.orders[0].id, storeB.customers[0].id, storeB.products[0].id, storeB.products[0].variants[0].id, storeB.orders[0].lineItems[0].id, storeB.refunds[0].id, storeB.tasks[0].id];
    for (const id of [...idsA, ...idsB]) {
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(id).not.toContain("/");
    }
    expect(new Set(idsA.filter(id => idsB.includes(id))).size).toBe(0);

    expect(order.shopifyGid).toBe(gids.order);
    expect(customer.shopifyGid).toBe(gids.customer);
    expect(product.shopifyGid).toBe(gids.product);
    expect(variant.shopifyGid).toBe(gids.variant);
    expect(lineItem.shopifyGid).toBe(gids.lineItem);
    expect(refund.shopifyGid).toBe(gids.refund);
    expect(order.customerId).toBe(customer.id);
    expect(lineItem.productId).toBe(product.id);
    expect(lineItem.variantId).toBe(variant.id);
    expect(variant.productId).toBe(product.id);
    expect(refund.orderId).toBe(order.id);
    expect(task.orderId).toBe(order.id);
    expect(variant.unitsSold7d).toBe(2);
  });

  it("rejects Shopify connection IDs that are not URL-safe", () => {
    process.env.SHOPIFY_STORES_JSON = JSON.stringify([
      { id: "store/unsafe", merchantId: "merchant_1", merchantName: "Merchant", storeName: "Store", domain: "example.myshopify.com", token: "test-token" },
    ]);
    expect(() => loadConnections()).toThrow("Shopify store ID must be URL-safe");
  });

  it("rejects merchant IDs that are not URL-safe", () => {
    process.env.SHOPIFY_STORES_JSON = JSON.stringify([
      { id: "store_1", merchantId: "merchant/unsafe", merchantName: "Merchant", storeName: "Store", domain: "example.myshopify.com", token: "test-token" },
    ]);
    expect(() => loadConnections()).toThrow("Shopify merchant ID must be URL-safe");
  });

  it("rejects duplicate store IDs", () => {
    process.env.SHOPIFY_STORES_JSON = JSON.stringify([
      { id: "store_1", merchantId: "merchant_1", merchantName: "One", storeName: "One", domain: "one.myshopify.com", token: "test-token" },
      { id: "store_1", merchantId: "merchant_2", merchantName: "Two", storeName: "Two", domain: "two.myshopify.com", token: "test-token" },
    ]);
    expect(() => loadConnections()).toThrow("Duplicate Shopify store ID: store_1");
  });

  it("rejects multiple configured stores for the same merchant ID", () => {
    process.env.SHOPIFY_STORES_JSON = JSON.stringify([
      { id: "store_1", merchantId: "merchant_1", merchantName: "One", storeName: "One", domain: "one.myshopify.com", token: "test-token" },
      { id: "store_2", merchantId: "merchant_1", merchantName: "One", storeName: "Two", domain: "two.myshopify.com", token: "test-token" },
    ]);
    expect(() => loadConnections()).toThrow("Duplicate Shopify merchant ID: merchant_1");
  });
});
