import type { Customer, FulfillmentState, FinancialState, Merchant, Order, Product, Refund, ShopifyStore, StoreSnapshot } from "@/lib/domain/types";

const currencyCode = "CAD";
const money = (amount: number) => ({ amount, currencyCode });
const at = (base: Date, hoursAgo: number) => new Date(base.getTime() - hoursAgo * 3_600_000).toISOString();

const merchantSeeds = [
  { id: "mer_northstar", name: "Northstar Goods", store: "Northstar Supply", slug: "northstar-supply", sla: 24, previous: 2, open: 6 },
  { id: "mer_cedar", name: "Cedar & Coast", store: "Cedar & Coast Home", slug: "cedar-coast-home", sla: 36, previous: 3, open: 4 },
  { id: "mer_field", name: "Fieldwork Outfitters", store: "Fieldwork Canada", slug: "fieldwork-canada", sla: 24, previous: 3, open: 3 },
  { id: "mer_juniper", name: "Juniper Table", store: "Juniper Tableware", slug: "juniper-tableware", sla: 48, previous: 2, open: 3 },
  { id: "mer_lumen", name: "Lumen Paper Co.", store: "Lumen Paper Shop", slug: "lumen-paper-shop", sla: 24, previous: 2, open: 2 },
  { id: "mer_morrow", name: "Morrow Skin", store: "Morrow Skin Canada", slug: "morrow-skin-ca", sla: 36, previous: 1, open: 4 },
  { id: "mer_pine", name: "Pine & Path", store: "Pine & Path Goods", slug: "pine-path-goods", sla: 48, previous: 2, open: 1 },
  { id: "mer_alder", name: "Alder & Tide", store: "Alder & Tide Studio", slug: "alder-tide-studio", sla: 48, previous: 0, open: 0 },
] as const;

const productNames = [
  ["Transit Weekender", "Studio Utility Jacket"],
  ["Washed Linen Throw", "Cedar Vessel Candle"],
  ["Trail Canvas Tote", "Alpine Overshirt"],
  ["Stacking Stoneware Set", "Oak Serving Board"],
  ["Daily Planning Set", "Archival Notebook"],
  ["Barrier Recovery Cream", "Mineral Cleanser"],
  ["Camp Enamel Set", "Packable Trail Blanket"],
  ["Tidal Vase", "Drift Linen Runner"],
] as const;

const openStatuses: Array<{ fulfillment: FulfillmentState; financial: FinancialState; age: number }> = [
  { fulfillment: "UNFULFILLED", financial: "PAID", age: 79 },
  { fulfillment: "PARTIALLY_FULFILLED", financial: "PAID", age: 54 },
  { fulfillment: "UNFULFILLED", financial: "PENDING", age: 31 },
  { fulfillment: "UNFULFILLED", financial: "PAID", age: 27 },
  { fulfillment: "IN_PROGRESS", financial: "PAID", age: 18 },
  { fulfillment: "ON_HOLD", financial: "AUTHORIZED", age: 9 },
];

export function createDemoSnapshot(asOf = new Date("2026-08-02T14:00:00-04:00")): StoreSnapshot {
  const provider = { id: "fp_harbour", name: "Harbour Fulfilment Collective" };
  const merchants: Merchant[] = merchantSeeds.map(seed => ({
    id: seed.id,
    fulfillmentProviderId: provider.id,
    name: seed.name,
    status: "active",
    serviceLevelTargetHours: seed.sla,
    primaryContact: "Simulated merchant contact",
    previousOpenOrders: seed.previous,
  }));
  const stores: ShopifyStore[] = merchantSeeds.map((seed, index) => ({
    id: `store_${index + 1}`,
    merchantId: seed.id,
    name: seed.store,
    domain: `${seed.slug}-demo.myshopify.com`,
    currencyCode,
    timezone: "America/Toronto",
    connectionStatus: "demo",
    mode: "demo",
  }));

  const customers: Customer[] = merchantSeeds.flatMap((seed, merchantIndex) => {
    const storeId = stores[merchantIndex].id;
    return Array.from({ length: 3 }, (_, customerIndex) => ({
      id: `cus_${merchantIndex + 1}_${customerIndex + 1}`,
      merchantId: seed.id,
      storeId,
      name: `Customer ${String.fromCharCode(65 + merchantIndex)}${customerIndex + 1}`,
      email: `customer-${merchantIndex + 1}-${customerIndex + 1}@example.test`,
      ordersCount: 4 + customerIndex * 3,
      lifetimeValue: money(customerIndex === 0 ? 2_400 + merchantIndex * 110 : 620 + customerIndex * 280),
      lastOrderAt: at(asOf, 6 + merchantIndex * 4 + customerIndex * 11),
      tags: customerIndex === 0 ? ["Repeat", "High value"] : customerIndex === 1 ? ["Repeat"] : [],
    }));
  });

  const products: Product[] = merchantSeeds.flatMap((seed, merchantIndex) => {
    const storeId = stores[merchantIndex].id;
    return productNames[merchantIndex].map((title, productIndex) => {
      const productId = `prod_${merchantIndex + 1}_${productIndex + 1}`;
      const constrained = (merchantIndex === 0 && productIndex === 0) || (merchantIndex === 1 && productIndex === 1);
      const available = constrained ? (merchantIndex === 0 ? 0 : 2) : 18 + merchantIndex * 4 + productIndex * 12;
      return {
        id: productId,
        merchantId: seed.id,
        storeId,
        title,
        productType: productIndex === 0 ? "Core assortment" : "Seasonal assortment",
        status: "ACTIVE" as const,
        variants: [{
          id: `var_${merchantIndex + 1}_${productIndex + 1}`,
          merchantId: seed.id,
          storeId,
          productId,
          productTitle: title,
          title: productIndex === 0 ? "Standard" : "Primary",
          sku: `SKU-${merchantIndex + 1}${productIndex + 1}-DEMO`,
          available,
          price: money(42 + merchantIndex * 9 + productIndex * 38),
          unitsSold7d: 3 + ((merchantIndex + productIndex) % 7),
          unitsSold30d: 10 + merchantIndex * 2 + productIndex * 4,
          lastSoldAt: at(asOf, 3 + merchantIndex * 2),
        }],
      };
    });
  });

  const orders: Order[] = [];
  for (const [merchantIndex, seed] of merchantSeeds.entries()) {
    const storeId = stores[merchantIndex].id;
    const merchantProducts = products.filter(product => product.merchantId === seed.id);
    for (let orderIndex = 0; orderIndex < 7; orderIndex++) {
      const isOpen = orderIndex < seed.open;
      const openState = openStatuses[orderIndex] ?? openStatuses[5];
      const fulfillmentStatus: FulfillmentState = isOpen ? openState.fulfillment : "FULFILLED";
      const financialStatus: FinancialState = isOpen ? openState.financial : "PAID";
      const age = isOpen ? openState.age + merchantIndex * 2 : 4 + orderIndex * 5 + merchantIndex;
      const customer = customers.find(item => item.merchantId === seed.id && item.id.endsWith(`_${(orderIndex % 3) + 1}`))!;
      const product = merchantProducts[orderIndex % merchantProducts.length];
      const variant = product.variants[0];
      const quantity = orderIndex % 3 === 0 ? 2 : 1;
      const highValue = merchantIndex === 0 && orderIndex === 0;
      const amount = highValue ? 780 : variant.price.amount * quantity;
      const orderId = `ord_${merchantIndex + 1}_${orderIndex + 1}`;
      orders.push({
        id: orderId,
        merchantId: seed.id,
        storeId,
        name: `#${2100 + merchantIndex * 100 + orderIndex + 1}`,
        createdAt: at(asOf, age),
        updatedAt: at(asOf, Math.max(1, age - 3)),
        customerId: customer.id,
        customerName: customer.name,
        total: money(amount),
        fulfillmentStatus,
        financialStatus,
        fulfillmentCreatedAt: fulfillmentStatus === "FULFILLED" ? at(asOf, Math.max(1, age - 4)) : fulfillmentStatus === "PARTIALLY_FULFILLED" ? at(asOf, 8) : null,
        tags: highValue ? ["priority-review"] : [],
        notes: orderIndex === 2 && isOpen ? "Simulated note: confirm payment before releasing inventory." : "",
        riskSignals: variant.available < quantity && isOpen ? ["inventory_shortfall"] : [],
        lineItems: [{
          id: `li_${merchantIndex + 1}_${orderIndex + 1}`,
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          variantTitle: variant.title,
          quantity,
          total: money(amount),
        }],
      });
    }
  }

  const refunds: Refund[] = [
    { id: "ref_1", merchantId: merchantSeeds[2].id, storeId: stores[2].id, orderId: "ord_3_7", orderName: "#2307", createdAt: at(asOf, 30), amount: money(48), reason: "Simulated return" },
    { id: "ref_2", merchantId: merchantSeeds[2].id, storeId: stores[2].id, orderId: "ord_3_6", orderName: "#2306", createdAt: at(asOf, 62), amount: money(72), reason: "Simulated exchange" },
    { id: "ref_3", merchantId: merchantSeeds[4].id, storeId: stores[4].id, orderId: "ord_5_7", orderName: "#2507", createdAt: at(asOf, 90), amount: money(39), reason: "Simulated return" },
  ];

  const tasks = orders.filter(order => order.fulfillmentStatus !== "FULFILLED").map(order => ({
    id: `task_${order.id}`,
    merchantId: order.merchantId,
    storeId: order.storeId,
    orderId: order.id,
    taskType: order.financialStatus === "PAID" ? "pick_pack" as const : "payment_check" as const,
    status: order.financialStatus === "PAID" ? "open" as const : "blocked" as const,
    priority: 0,
    createdAt: order.createdAt,
    dueAt: at(asOf, -4),
  }));

  return {
    source: "demo",
    generatedAt: asOf.toISOString(),
    provider,
    merchants,
    stores,
    orders,
    customers,
    products,
    refunds,
    tasks,
    warnings: ["This is simulated portfolio data. No real merchant, customer, order, or product records are shown."],
  };
}
