import type { Customer, Order, Product, Refund, StoreSnapshot } from "@/lib/domain/types";

const currencyCode = "CAD";
const money = (amount: number) => ({ amount, currencyCode });
const at = (base: Date, hoursAgo: number) => new Date(base.getTime() - hoursAgo * 3_600_000).toISOString();

export function createDemoSnapshot(asOf = new Date("2026-08-02T14:00:00-04:00")): StoreSnapshot {
  const customers: Customer[] = [
    { id: "cus_maya", name: "Maya Chen", email: "maya.chen@example.test", ordersCount: 18, lifetimeValue: money(5_680), lastOrderAt: at(asOf, 76), tags: ["VIP", "Repeat"] },
    { id: "cus_noah", name: "Noah Williams", email: "noah.williams@example.test", ordersCount: 11, lifetimeValue: money(3_240), lastOrderAt: at(asOf, 18), tags: ["VIP"] },
    { id: "cus_amara", name: "Amara Singh", email: "amara.singh@example.test", ordersCount: 8, lifetimeValue: money(2_150), lastOrderAt: at(asOf, 51), tags: ["Repeat"] },
    { id: "cus_liam", name: "Liam Martin", email: "liam.martin@example.test", ordersCount: 6, lifetimeValue: money(1_460), lastOrderAt: at(asOf, 30), tags: [] },
    { id: "cus_sofia", name: "Sofia Garcia", email: "sofia.garcia@example.test", ordersCount: 4, lifetimeValue: money(980), lastOrderAt: at(asOf, 8), tags: [] },
    { id: "cus_ethan", name: "Ethan Brown", email: "ethan.brown@example.test", ordersCount: 3, lifetimeValue: money(725), lastOrderAt: at(asOf, 96), tags: [] },
    { id: "cus_ava", name: "Ava Thompson", email: "ava.thompson@example.test", ordersCount: 2, lifetimeValue: money(440), lastOrderAt: at(asOf, 25), tags: [] },
    { id: "cus_lucas", name: "Lucas Roy", email: "lucas.roy@example.test", ordersCount: 1, lifetimeValue: money(195), lastOrderAt: at(asOf, 4), tags: ["New"] },
  ];

  const products: Product[] = [
    {
      id: "prod_terra", title: "Terra Weekender", productType: "Bags", status: "ACTIVE",
      variants: [
        { id: "var_terra_olive", productId: "prod_terra", productTitle: "Terra Weekender", title: "Olive", sku: "TW-OLV", available: 3, price: money(195), unitsSold7d: 8, unitsSold30d: 24, lastSoldAt: at(asOf, 4) },
        { id: "var_terra_sand", productId: "prod_terra", productTitle: "Terra Weekender", title: "Sand", sku: "TW-SND", available: 18, price: money(195), unitsSold7d: 4, unitsSold30d: 17, lastSoldAt: at(asOf, 18) },
      ],
    },
    {
      id: "prod_tote", title: "Field Canvas Tote", productType: "Bags", status: "ACTIVE",
      variants: [
        { id: "var_tote_natural", productId: "prod_tote", productTitle: "Field Canvas Tote", title: "Natural", sku: "FC-NAT", available: 42, price: money(90), unitsSold7d: 12, unitsSold30d: 39, lastSoldAt: at(asOf, 8) },
        { id: "var_tote_navy", productId: "prod_tote", productTitle: "Field Canvas Tote", title: "Navy", sku: "FC-NVY", available: 31, price: money(90), unitsSold7d: 7, unitsSold30d: 28, lastSoldAt: at(asOf, 25) },
      ],
    },
    {
      id: "prod_knit", title: "Harbour Knit", productType: "Apparel", status: "ACTIVE",
      variants: [
        { id: "var_knit_s", productId: "prod_knit", productTitle: "Harbour Knit", title: "Small / Oat", sku: "HK-S-OAT", available: 12, price: money(125), unitsSold7d: 3, unitsSold30d: 11, lastSoldAt: at(asOf, 22) },
        { id: "var_knit_m", productId: "prod_knit", productTitle: "Harbour Knit", title: "Medium / Oat", sku: "HK-M-OAT", available: 2, price: money(125), unitsSold7d: 6, unitsSold30d: 18, lastSoldAt: at(asOf, 12) },
        { id: "var_knit_l", productId: "prod_knit", productTitle: "Harbour Knit", title: "Large / Oat", sku: "HK-L-OAT", available: 0, price: money(125), unitsSold7d: 4, unitsSold30d: 15, lastSoldAt: at(asOf, 16) },
      ],
    },
    {
      id: "prod_throw", title: "Linen Throw", productType: "Home", status: "ACTIVE",
      variants: [
        { id: "var_throw_clay", productId: "prod_throw", productTitle: "Linen Throw", title: "Clay", sku: "LT-CLY", available: 142, price: money(89), unitsSold7d: 0, unitsSold30d: 2, lastSoldAt: at(asOf, 410) },
        { id: "var_throw_sage", productId: "prod_throw", productTitle: "Linen Throw", title: "Sage", sku: "LT-SGE", available: 74, price: money(89), unitsSold7d: 1, unitsSold30d: 5, lastSoldAt: at(asOf, 66) },
      ],
    },
    {
      id: "prod_candle", title: "Wicklow Candle", productType: "Home", status: "ACTIVE",
      variants: [
        { id: "var_candle_cedar", productId: "prod_candle", productTitle: "Wicklow Candle", title: "Cedar", sku: "WC-CDR", available: 96, price: money(39), unitsSold7d: 0, unitsSold30d: 0, lastSoldAt: at(asOf, 1_080) },
        { id: "var_candle_fig", productId: "prod_candle", productTitle: "Wicklow Candle", title: "Fig", sku: "WC-FIG", available: 54, price: money(39), unitsSold7d: 2, unitsSold30d: 9, lastSoldAt: at(asOf, 32) },
      ],
    },
    {
      id: "prod_cup", title: "Stoneware Cup", productType: "Home", status: "ACTIVE",
      variants: [
        { id: "var_cup_chalk", productId: "prod_cup", productTitle: "Stoneware Cup", title: "Chalk", sku: "SC-CHK", available: 84, price: money(36), unitsSold7d: 0, unitsSold30d: 1, lastSoldAt: at(asOf, 312) },
        { id: "var_cup_ink", productId: "prod_cup", productTitle: "Stoneware Cup", title: "Ink", sku: "SC-INK", available: 27, price: money(36), unitsSold7d: 3, unitsSold30d: 12, lastSoldAt: at(asOf, 14) },
      ],
    },
    {
      id: "prod_jacket", title: "Ridge Utility Jacket", productType: "Apparel", status: "ACTIVE",
      variants: [
        { id: "var_jacket_m", productId: "prod_jacket", productTitle: "Ridge Utility Jacket", title: "Medium / Moss", sku: "RJ-M-MOS", available: 5, price: money(225), unitsSold7d: 3, unitsSold30d: 9, lastSoldAt: at(asOf, 6) },
        { id: "var_jacket_l", productId: "prod_jacket", productTitle: "Ridge Utility Jacket", title: "Large / Moss", sku: "RJ-L-MOS", available: 14, price: money(225), unitsSold7d: 2, unitsSold30d: 7, lastSoldAt: at(asOf, 20) },
      ],
    },
  ];

  const order = (value: Omit<Order, "updatedAt" | "fulfillmentCreatedAt"> & { updatedAtHours?: number; fulfillmentCreatedAtHours?: number }): Order => ({
    ...value,
    updatedAt: at(asOf, value.updatedAtHours ?? 1),
    fulfillmentCreatedAt: value.fulfillmentCreatedAtHours == null ? null : at(asOf, value.fulfillmentCreatedAtHours),
  });

  const orders: Order[] = [
    order({ id: "ord_1052", name: "#1052", createdAt: at(asOf, 76), updatedAtHours: 70, customerId: "cus_maya", customerName: "Maya Chen", total: money(418), fulfillmentStatus: "UNFULFILLED", financialStatus: "PAID", lineItems: [
      { id: "li_1052_1", productId: "prod_terra", variantId: "var_terra_olive", title: "Terra Weekender", variantTitle: "Olive", quantity: 1, total: money(195) },
      { id: "li_1052_2", productId: "prod_jacket", variantId: "var_jacket_m", title: "Ridge Utility Jacket", variantTitle: "Medium / Moss", quantity: 1, total: money(223) },
    ] }),
    order({ id: "ord_1059", name: "#1059", createdAt: at(asOf, 51), updatedAtHours: 9, customerId: "cus_amara", customerName: "Amara Singh", total: money(250), fulfillmentStatus: "IN_PROGRESS", financialStatus: "PAID", lineItems: [{ id: "li_1059_1", productId: "prod_knit", variantId: "var_knit_m", title: "Harbour Knit", variantTitle: "Medium / Oat", quantity: 2, total: money(250) }] }),
    order({ id: "ord_1064", name: "#1064", createdAt: at(asOf, 30), customerId: "cus_liam", customerName: "Liam Martin", total: money(180), fulfillmentStatus: "UNFULFILLED", financialStatus: "PAID", lineItems: [{ id: "li_1064_1", productId: "prod_tote", variantId: "var_tote_natural", title: "Field Canvas Tote", variantTitle: "Natural", quantity: 2, total: money(180) }] }),
    order({ id: "ord_1067", name: "#1067", createdAt: at(asOf, 25), customerId: "cus_ava", customerName: "Ava Thompson", total: money(214), fulfillmentStatus: "ON_HOLD", financialStatus: "PENDING", lineItems: [{ id: "li_1067_1", productId: "prod_knit", variantId: "var_knit_s", title: "Harbour Knit", variantTitle: "Small / Oat", quantity: 1, total: money(125) }, { id: "li_1067_2", productId: "prod_throw", variantId: "var_throw_sage", title: "Linen Throw", variantTitle: "Sage", quantity: 1, total: money(89) }] }),
    order({ id: "ord_1068", name: "#1068", createdAt: at(asOf, 18), customerId: "cus_noah", customerName: "Noah Williams", total: money(285), fulfillmentStatus: "FULFILLED", financialStatus: "PAID", fulfillmentCreatedAtHours: 7, lineItems: [{ id: "li_1068_1", productId: "prod_terra", variantId: "var_terra_sand", title: "Terra Weekender", variantTitle: "Sand", quantity: 1, total: money(195) }, { id: "li_1068_2", productId: "prod_tote", variantId: "var_tote_navy", title: "Field Canvas Tote", variantTitle: "Navy", quantity: 1, total: money(90) }] }),
    order({ id: "ord_1069", name: "#1069", createdAt: at(asOf, 14), customerId: "cus_sofia", customerName: "Sofia Garcia", total: money(125), fulfillmentStatus: "FULFILLED", financialStatus: "PAID", fulfillmentCreatedAtHours: 5, lineItems: [{ id: "li_1069_1", productId: "prod_knit", variantId: "var_knit_m", title: "Harbour Knit", variantTitle: "Medium / Oat", quantity: 1, total: money(125) }] }),
    order({ id: "ord_1070", name: "#1070", createdAt: at(asOf, 10), customerId: "cus_lucas", customerName: "Lucas Roy", total: money(195), fulfillmentStatus: "PARTIALLY_FULFILLED", financialStatus: "PAID", fulfillmentCreatedAtHours: 3, lineItems: [{ id: "li_1070_1", productId: "prod_terra", variantId: "var_terra_olive", title: "Terra Weekender", variantTitle: "Olive", quantity: 1, total: money(195) }] }),
    order({ id: "ord_1071", name: "#1071", createdAt: at(asOf, 8), customerId: "cus_sofia", customerName: "Sofia Garcia", total: money(270), fulfillmentStatus: "FULFILLED", financialStatus: "PAID", fulfillmentCreatedAtHours: 2, lineItems: [{ id: "li_1071_1", productId: "prod_tote", variantId: "var_tote_natural", title: "Field Canvas Tote", variantTitle: "Natural", quantity: 3, total: money(270) }] }),
    order({ id: "ord_1072", name: "#1072", createdAt: at(asOf, 4), customerId: "cus_lucas", customerName: "Lucas Roy", total: money(225), fulfillmentStatus: "UNFULFILLED", financialStatus: "PAID", lineItems: [{ id: "li_1072_1", productId: "prod_jacket", variantId: "var_jacket_m", title: "Ridge Utility Jacket", variantTitle: "Medium / Moss", quantity: 1, total: money(225) }] }),
    order({ id: "ord_1048", name: "#1048", createdAt: at(asOf, 190), customerId: "cus_ethan", customerName: "Ethan Brown", total: money(178), fulfillmentStatus: "FULFILLED", financialStatus: "PARTIALLY_REFUNDED", fulfillmentCreatedAtHours: 180, lineItems: [{ id: "li_1048_1", productId: "prod_throw", variantId: "var_throw_clay", title: "Linen Throw", variantTitle: "Clay", quantity: 2, total: money(178) }] }),
    order({ id: "ord_1047", name: "#1047", createdAt: at(asOf, 220), customerId: "cus_noah", customerName: "Noah Williams", total: money(225), fulfillmentStatus: "FULFILLED", financialStatus: "PARTIALLY_REFUNDED", fulfillmentCreatedAtHours: 205, lineItems: [{ id: "li_1047_1", productId: "prod_jacket", variantId: "var_jacket_l", title: "Ridge Utility Jacket", variantTitle: "Large / Moss", quantity: 1, total: money(225) }] }),
    order({ id: "ord_1043", name: "#1043", createdAt: at(asOf, 310), customerId: "cus_amara", customerName: "Amara Singh", total: money(90), fulfillmentStatus: "FULFILLED", financialStatus: "REFUNDED", fulfillmentCreatedAtHours: 300, lineItems: [{ id: "li_1043_1", productId: "prod_tote", variantId: "var_tote_navy", title: "Field Canvas Tote", variantTitle: "Navy", quantity: 1, total: money(90) }] }),
    order({ id: "ord_1035", name: "#1035", createdAt: at(asOf, 400), customerId: "cus_liam", customerName: "Liam Martin", total: money(39), fulfillmentStatus: "FULFILLED", financialStatus: "PARTIALLY_REFUNDED", fulfillmentCreatedAtHours: 390, lineItems: [{ id: "li_1035_1", productId: "prod_candle", variantId: "var_candle_fig", title: "Wicklow Candle", variantTitle: "Fig", quantity: 1, total: money(39) }] }),
  ];

  const refunds: Refund[] = [
    { id: "ref_1048", orderId: "ord_1048", orderName: "#1048", createdAt: at(asOf, 35), amount: money(89), reason: "Returned item" },
    { id: "ref_1047", orderId: "ord_1047", orderName: "#1047", createdAt: at(asOf, 52), amount: money(125), reason: "Size exchange" },
    { id: "ref_1043", orderId: "ord_1043", orderName: "#1043", createdAt: at(asOf, 90), amount: money(90), reason: "Order returned" },
    { id: "ref_1035", orderId: "ord_1035", orderName: "#1035", createdAt: at(asOf, 260), amount: money(20), reason: "Damaged item" },
  ];

  return {
    source: "demo",
    generatedAt: asOf.toISOString(),
    shop: { name: "North & Pine Supply", domain: "north-pine-demo.myshopify.com", currencyCode, timezone: "America/Toronto" },
    orders,
    customers,
    products,
    refunds,
    warnings: ["This is simulated portfolio data. No real merchant or customer records are shown."],
  };
}
