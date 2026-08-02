import type { Customer, FinancialState, FulfillmentState, Merchant, Order, Product, Refund, ShopifyStore, StoreSnapshot } from "@/lib/domain/types";

// Verified against the Shopify Admin GraphQL API 2026-07 schema. Read-only queries only.
const MAX_PAGES = 5;
const PAGE_SIZE = 50;

type StoreConnection = { id: string; merchantId: string; merchantName: string; storeName: string; domain: string; token: string; apiVersion: string; serviceLevelTargetHours: number };
type GraphQLErrorShape = { message?: string };
type ShopifyResponse<T> = { data?: T; errors?: GraphQLErrorShape[]; extensions?: { cost?: { throttleStatus?: { currentlyAvailable?: number } } } };
type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type Connection<T> = { nodes: T[]; pageInfo: PageInfo };

const QUERY = `#graphql
query StoreOpsSnapshot($ordersCursor: String, $customersCursor: String, $productsCursor: String) {
  shop { name myshopifyDomain currencyCode ianaTimezone }
  orders(first: ${PAGE_SIZE}, after: $ordersCursor, sortKey: CREATED_AT, reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id name createdAt updatedAt note tags displayFulfillmentStatus displayFinancialStatus
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      customer { id displayName numberOfOrders amountSpent { amount currencyCode } lastOrder { createdAt } tags }
      lineItems(first: 100) { nodes { id title variantTitle quantity originalTotalSet { shopMoney { amount currencyCode } } product { id } variant { id } } }
      fulfillments(first: 10) { createdAt status }
      refunds { id createdAt totalRefundedSet { shopMoney { amount currencyCode } } }
    }
  }
  customers(first: ${PAGE_SIZE}, after: $customersCursor, sortKey: UPDATED_AT, reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes { id displayName numberOfOrders amountSpent { amount currencyCode } lastOrder { createdAt } tags }
  }
  products(first: ${PAGE_SIZE}, after: $productsCursor, sortKey: UPDATED_AT, reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes { id title productType status variants(first: 100) { nodes { id title sku price inventoryQuantity } } }
  }
}`;

type RawMoney = { amount: string; currencyCode: string };
type RawCustomer = { id: string; displayName?: string | null; numberOfOrders?: string | number; amountSpent?: RawMoney; lastOrder?: { createdAt?: string | null } | null; tags?: string[] };
type RawOrder = { id: string; name: string; createdAt: string; updatedAt: string; note?: string | null; tags?: string[]; displayFulfillmentStatus?: string | null; displayFinancialStatus?: string | null; currentTotalPriceSet?: { shopMoney?: RawMoney }; customer?: RawCustomer | null; lineItems?: { nodes?: Array<{ id: string; title: string; variantTitle?: string | null; quantity: number; originalTotalSet?: { shopMoney?: RawMoney }; product?: { id: string } | null; variant?: { id: string } | null }> }; fulfillments?: Array<{ createdAt?: string; status?: string }>; refunds?: Array<{ id: string; createdAt: string; totalRefundedSet?: { shopMoney?: RawMoney } }> };
type RawProduct = { id: string; title: string; productType?: string; status?: string; variants?: { nodes?: Array<{ id: string; title: string; sku?: string | null; price?: string; inventoryQuantity?: number | null }> } };
type QueryData = { shop: { name: string; myshopifyDomain: string; currencyCode: string; ianaTimezone?: string | null }; orders: Connection<RawOrder>; customers: Connection<RawCustomer>; products: Connection<RawProduct> };
type Context = { merchantId: string; storeId: string };

async function graphql<T>(connection: StoreConnection, query: string, variables: Record<string, string | null>): Promise<ShopifyResponse<T>> {
  const response = await fetch(`https://${connection.domain}/admin/api/${connection.apiVersion}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": connection.token },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Shopify request failed for ${connection.storeName} (${response.status})`);
  const payload = await response.json() as ShopifyResponse<T>;
  if (payload.errors?.length) throw new Error(`Shopify GraphQL error for ${connection.storeName}: ${payload.errors.map(error => error.message ?? "Unknown error").join("; ")}`);
  if (!payload.data) throw new Error(`Shopify returned no data for ${connection.storeName}`);
  return payload;
}

const fulfillmentState = (value?: string | null): FulfillmentState => {
  const normalized = value?.toUpperCase();
  if (["FULFILLED", "PARTIALLY_FULFILLED", "IN_PROGRESS", "ON_HOLD", "SCHEDULED", "REQUEST_DECLINED", "UNFULFILLED"].includes(normalized ?? "")) return normalized as FulfillmentState;
  if (["OPEN", "RESTOCKED", "PENDING_FULFILLMENT"].includes(normalized ?? "")) return normalized === "PENDING_FULFILLMENT" ? "IN_PROGRESS" : "UNFULFILLED";
  return normalized ? "UNKNOWN" : "UNFULFILLED";
};

const FINANCIAL_STATES = new Set<FinancialState>(["AUTHORIZED", "EXPIRED", "PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED", "PENDING", "REFUNDED", "VOIDED"]);
const financialState = (value?: string | null): FinancialState => {
  const normalized = value?.toUpperCase() as FinancialState | undefined;
  return normalized && FINANCIAL_STATES.has(normalized) ? normalized : "UNKNOWN";
};

export const normalizeIanaTimezone = (value?: string | null): string => {
  if (!value) return "UTC";
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return value; } catch { return "UTC"; }
};

function loadConnections(): StoreConnection[] {
  const version = process.env.SHOPIFY_API_VERSION || "2026-07";
  if (process.env.SHOPIFY_STORES_JSON) {
    const parsed = JSON.parse(process.env.SHOPIFY_STORES_JSON) as Array<Partial<StoreConnection>>;
    const connections = parsed.filter(item => item.id && item.merchantId && item.merchantName && item.storeName && item.domain && item.token).map(item => ({
      id: item.id!, merchantId: item.merchantId!, merchantName: item.merchantName!, storeName: item.storeName!, domain: item.domain!.replace(/^https?:\/\//, "").replace(/\/$/, ""), token: item.token!, apiVersion: item.apiVersion || version, serviceLevelTargetHours: item.serviceLevelTargetHours || 48,
    }));
    if (!connections.length) throw new Error("No valid Shopify store connections are configured");
    return connections;
  }
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!domain || !token) throw new Error("Shopify credentials are not configured");
  return [{ id: "store_live_1", merchantId: "merchant_live_1", merchantName: process.env.SHOPIFY_MERCHANT_NAME || "Connected merchant", storeName: process.env.SHOPIFY_STORE_NAME || "Connected Shopify store", domain, token, apiVersion: version, serviceLevelTargetHours: 48 }];
}

async function fetchOne(connection: StoreConnection) {
  const allOrders: RawOrder[] = [], allCustomers: RawCustomer[] = [], allProducts: RawProduct[] = [];
  let ordersCursor: string | null = null, customersCursor: string | null = null, productsCursor: string | null = null;
  let ordersDone = false, customersDone = false, productsDone = false;
  let shop: QueryData["shop"] | null = null;
  const warnings: string[] = [];
  for (let page = 0; page < MAX_PAGES && (!ordersDone || !customersDone || !productsDone); page++) {
    const response: ShopifyResponse<QueryData> = await graphql<QueryData>(connection, QUERY, { ordersCursor: ordersDone ? null : ordersCursor, customersCursor: customersDone ? null : customersCursor, productsCursor: productsDone ? null : productsCursor });
    const data: QueryData = response.data!; shop = data.shop;
    if (!ordersDone) { allOrders.push(...data.orders.nodes); ordersDone = !data.orders.pageInfo.hasNextPage; ordersCursor = data.orders.pageInfo.endCursor; }
    if (!customersDone) { allCustomers.push(...data.customers.nodes); customersDone = !data.customers.pageInfo.hasNextPage; customersCursor = data.customers.pageInfo.endCursor; }
    if (!productsDone) { allProducts.push(...data.products.nodes); productsDone = !data.products.pageInfo.hasNextPage; productsCursor = data.products.pageInfo.endCursor; }
    const available = response.extensions?.cost?.throttleStatus?.currentlyAvailable;
    if (available != null && available < 200) warnings.push(`${connection.storeName} query budget was low (${available} points available).`);
  }
  if (!ordersDone || !customersDone || !productsDone) warnings.push(`${connection.storeName} results were capped at ${MAX_PAGES * PAGE_SIZE} records per resource.`);
  if (!shop) throw new Error(`Shopify shop metadata was unavailable for ${connection.storeName}`);
  const context = { merchantId: connection.merchantId, storeId: connection.id };
  const orders = normalizeOrders(allOrders, shop.currencyCode, context);
  const sales = new Map<string, { units7: number; units30: number; lastSoldAt: string | null }>();
  const now = new Date();
  for (const order of orders) for (const item of order.lineItems) if (item.variantId) {
    const ageDays = (now.getTime() - new Date(order.createdAt).getTime()) / 86_400_000;
    const current = sales.get(item.variantId) ?? { units7: 0, units30: 0, lastSoldAt: null };
    if (ageDays <= 7) current.units7 += item.quantity; if (ageDays <= 30) current.units30 += item.quantity;
    if (!current.lastSoldAt || new Date(order.createdAt) > new Date(current.lastSoldAt)) current.lastSoldAt = order.createdAt;
    sales.set(item.variantId, current);
  }
  const merchant: Merchant = { id: connection.merchantId, fulfillmentProviderId: "fp_live", name: connection.merchantName, status: "active", serviceLevelTargetHours: connection.serviceLevelTargetHours, primaryContact: "Not retrieved", previousOpenOrders: 0 };
  const store: ShopifyStore = { id: connection.id, merchantId: connection.merchantId, name: connection.storeName || shop.name, domain: shop.myshopifyDomain, currencyCode: shop.currencyCode, timezone: normalizeIanaTimezone(shop.ianaTimezone), connectionStatus: "connected", mode: "live" };
  return { merchant, store, orders, customers: normalizeCustomers(allCustomers, shop.currencyCode, context), products: normalizeProducts(allProducts, shop.currencyCode, sales, context), refunds: normalizeRefunds(allOrders, shop.currencyCode, context), warnings };
}

export async function fetchShopifySnapshot(): Promise<StoreSnapshot> {
  const connections = loadConnections();
  const records = await Promise.all(connections.map(fetchOne));
  const generatedAt = new Date().toISOString();
  const orders = records.flatMap(record => record.orders);
  return {
    source: "live", generatedAt, provider: { id: "fp_live", name: process.env.FULFILLMENT_PROVIDER_NAME || "Connected fulfilment provider" },
    merchants: records.map(record => record.merchant), stores: records.map(record => record.store), orders,
    customers: records.flatMap(record => record.customers), products: records.flatMap(record => record.products), refunds: records.flatMap(record => record.refunds),
    tasks: orders.filter(order => order.fulfillmentStatus !== "FULFILLED").map(order => ({ id: `task_${order.id}`, merchantId: order.merchantId, storeId: order.storeId, orderId: order.id, taskType: order.financialStatus === "PAID" ? "pick_pack" : "payment_check", status: order.financialStatus === "PAID" ? "open" : "blocked", priority: 0, createdAt: order.createdAt, dueAt: generatedAt })),
    warnings: records.flatMap(record => record.warnings),
  };
}

export function normalizeCustomers(raw: RawCustomer[], fallbackCurrency: string, context: Context = { merchantId: "merchant_test", storeId: "store_test" }): Customer[] {
  return raw.map(customer => ({ id: customer.id, merchantId: context.merchantId, storeId: context.storeId, name: customer.displayName || "Unknown customer", email: "", ordersCount: Number(customer.numberOfOrders || 0), lifetimeValue: { amount: Number(customer.amountSpent?.amount || 0), currencyCode: customer.amountSpent?.currencyCode || fallbackCurrency }, lastOrderAt: customer.lastOrder?.createdAt || null, tags: customer.tags || [] }));
}

export function normalizeOrders(raw: RawOrder[], fallbackCurrency: string, context: Context = { merchantId: "merchant_test", storeId: "store_test" }): Order[] {
  return raw.map(order => { const amount = order.currentTotalPriceSet?.shopMoney; const fulfillment = order.fulfillments?.[0]; return {
    id: order.id, merchantId: context.merchantId, storeId: context.storeId, name: order.name, createdAt: order.createdAt, updatedAt: order.updatedAt, customerId: order.customer?.id || null, customerName: order.customer?.displayName || "Guest", total: { amount: Number(amount?.amount || 0), currencyCode: amount?.currencyCode || fallbackCurrency }, fulfillmentStatus: fulfillmentState(order.displayFulfillmentStatus), financialStatus: financialState(order.displayFinancialStatus), fulfillmentCreatedAt: fulfillment?.createdAt || null, tags: order.tags || [], notes: order.note || "", riskSignals: [], lineItems: (order.lineItems?.nodes || []).map(item => ({ id: item.id, productId: item.product?.id || null, variantId: item.variant?.id || null, title: item.title, variantTitle: item.variantTitle || "Default", quantity: item.quantity, total: { amount: Number(item.originalTotalSet?.shopMoney?.amount || 0), currencyCode: item.originalTotalSet?.shopMoney?.currencyCode || fallbackCurrency } })) };
  });
}

export function normalizeProducts(raw: RawProduct[], fallbackCurrency: string, sales = new Map<string, { units7: number; units30: number; lastSoldAt: string | null }>(), context: Context = { merchantId: "merchant_test", storeId: "store_test" }): Product[] {
  return raw.map(product => ({ id: product.id, merchantId: context.merchantId, storeId: context.storeId, title: product.title, productType: product.productType || "", status: product.status === "DRAFT" ? "DRAFT" : product.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE", variants: (product.variants?.nodes || []).map(variant => { const activity = sales.get(variant.id); return { id: variant.id, merchantId: context.merchantId, storeId: context.storeId, productId: product.id, productTitle: product.title, title: variant.title, sku: variant.sku || "No SKU", available: variant.inventoryQuantity ?? 0, price: { amount: Number(variant.price || 0), currencyCode: fallbackCurrency }, unitsSold7d: activity?.units7 || 0, unitsSold30d: activity?.units30 || 0, lastSoldAt: activity?.lastSoldAt || null }; }) }));
}

export function normalizeRefunds(raw: RawOrder[], fallbackCurrency: string, context: Context = { merchantId: "merchant_test", storeId: "store_test" }): Refund[] {
  return raw.flatMap(order => (order.refunds || []).map(refund => ({ id: refund.id, merchantId: context.merchantId, storeId: context.storeId, orderId: order.id, orderName: order.name, createdAt: refund.createdAt, amount: { amount: Number(refund.totalRefundedSet?.shopMoney?.amount || 0), currencyCode: refund.totalRefundedSet?.shopMoney?.currencyCode || fallbackCurrency }, reason: "Reason not provided by query" })));
}
