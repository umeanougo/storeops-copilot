import type { Customer, FinancialState, FulfillmentState, Order, Product, Refund, StoreSnapshot } from "@/lib/domain/types";

// Implemented against Shopify Admin GraphQL API 2026-07. Read-only queries only.
// Pagination is bounded to keep this portfolio prototype responsive.
const MAX_PAGES = 5;
const PAGE_SIZE = 50;

type GraphQLErrorShape = { message?: string };
type ShopifyResponse<T> = { data?: T; errors?: GraphQLErrorShape[]; extensions?: { cost?: { throttleStatus?: { currentlyAvailable?: number; restoreRate?: number } } } };

type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type Connection<T> = { nodes: T[]; pageInfo: PageInfo };

const QUERY = `#graphql
query StoreOpsSnapshot($ordersCursor: String, $customersCursor: String, $productsCursor: String) {
  shop { name myshopifyDomain currencyCode ianaTimezone }
  orders(first: ${PAGE_SIZE}, after: $ordersCursor, sortKey: CREATED_AT, reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id name createdAt updatedAt displayFulfillmentStatus displayFinancialStatus
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
type RawCustomer = { id: string; displayName?: string | null; email?: string | null; numberOfOrders?: string | number; amountSpent?: RawMoney; lastOrder?: { createdAt?: string | null } | null; tags?: string[] };
type RawOrder = { id: string; name: string; createdAt: string; updatedAt: string; displayFulfillmentStatus?: string | null; displayFinancialStatus?: string | null; currentTotalPriceSet?: { shopMoney?: RawMoney }; customer?: RawCustomer | null; lineItems?: { nodes?: Array<{ id: string; title: string; variantTitle?: string | null; quantity: number; originalTotalSet?: { shopMoney?: RawMoney }; product?: { id: string } | null; variant?: { id: string } | null }> }; fulfillments?: Array<{ createdAt?: string; status?: string }>; refunds?: Array<{ id: string; createdAt: string; totalRefundedSet?: { shopMoney?: RawMoney } }> };
type RawProduct = { id: string; title: string; productType?: string; status?: string; variants?: { nodes?: Array<{ id: string; title: string; sku?: string | null; price?: string; inventoryQuantity?: number | null }> } };
type QueryData = { shop: { name: string; myshopifyDomain: string; currencyCode: string; ianaTimezone?: string | null }; orders: Connection<RawOrder>; customers: Connection<RawCustomer>; products: Connection<RawProduct> };

async function graphql<T>(query: string, variables: Record<string, string | null>): Promise<ShopifyResponse<T>> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || "2026-07";
  if (!domain || !token) throw new Error("Shopify credentials are not configured");
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token }, body: JSON.stringify({ query, variables }), cache: "no-store",
  });
  if (!response.ok) throw new Error(`Shopify request failed (${response.status})`);
  const payload = await response.json() as ShopifyResponse<T>;
  if (payload.errors?.length) throw new Error(`Shopify GraphQL error: ${payload.errors.map(error => error.message ?? "Unknown error").join("; ")}`);
  if (!payload.data) throw new Error("Shopify returned no data");
  return payload;
}

const fulfillmentState = (value?: string | null): FulfillmentState => {
  const normalized = value?.toUpperCase();
  if (normalized === "FULFILLED") return "FULFILLED";
  if (normalized === "PARTIALLY_FULFILLED") return "PARTIALLY_FULFILLED";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "ON_HOLD") return "ON_HOLD";
  return "UNFULFILLED";
};

const FINANCIAL_STATES = new Set<FinancialState>([
  "AUTHORIZED",
  "EXPIRED",
  "PAID",
  "PARTIALLY_PAID",
  "PARTIALLY_REFUNDED",
  "PENDING",
  "REFUNDED",
  "VOIDED",
]);

const financialState = (value?: string | null): FinancialState => {
  const normalized = value?.toUpperCase() as FinancialState | undefined;
  return normalized && FINANCIAL_STATES.has(normalized) ? normalized : "UNKNOWN";
};

export const normalizeIanaTimezone = (value?: string | null): string => {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    return "UTC";
  }
};

export async function fetchShopifySnapshot(): Promise<StoreSnapshot> {
  const allOrders: RawOrder[] = [], allCustomers: RawCustomer[] = [], allProducts: RawProduct[] = [];
  let ordersCursor: string | null = null, customersCursor: string | null = null, productsCursor: string | null = null;
  let ordersDone = false, customersDone = false, productsDone = false;
  let shop: QueryData["shop"] | null = null;
  const warnings: string[] = [];

  for (let page = 0; page < MAX_PAGES && (!ordersDone || !customersDone || !productsDone); page++) {
    const response: ShopifyResponse<QueryData> = await graphql<QueryData>(QUERY, { ordersCursor: ordersDone ? null : ordersCursor, customersCursor: customersDone ? null : customersCursor, productsCursor: productsDone ? null : productsCursor });
    const data: QueryData = response.data!;
    shop = data.shop;
    if (!ordersDone) { allOrders.push(...data.orders.nodes); ordersDone = !data.orders.pageInfo.hasNextPage; ordersCursor = data.orders.pageInfo.endCursor; }
    if (!customersDone) { allCustomers.push(...data.customers.nodes); customersDone = !data.customers.pageInfo.hasNextPage; customersCursor = data.customers.pageInfo.endCursor; }
    if (!productsDone) { allProducts.push(...data.products.nodes); productsDone = !data.products.pageInfo.hasNextPage; productsCursor = data.products.pageInfo.endCursor; }
    const available = response.extensions?.cost?.throttleStatus?.currentlyAvailable;
    if (available != null && available < 200) warnings.push(`Shopify query budget was low (${available} points available).`);
  }
  if (!ordersDone || !customersDone || !productsDone) warnings.push(`Results were capped at ${MAX_PAGES * PAGE_SIZE} records per resource for this prototype.`);
  if (!shop) throw new Error("Shopify shop metadata was unavailable");

  const orders = normalizeOrders(allOrders, shop.currencyCode);
  const customers = normalizeCustomers(allCustomers, shop.currencyCode);
  const sales = new Map<string, { units7: number; units30: number; lastSoldAt: string | null }>();
  const now = new Date();
  for (const order of orders) for (const item of order.lineItems) if (item.variantId) {
    const ageDays = (now.getTime() - new Date(order.createdAt).getTime()) / 86_400_000;
    const current = sales.get(item.variantId) ?? { units7: 0, units30: 0, lastSoldAt: null };
    if (ageDays <= 7) current.units7 += item.quantity;
    if (ageDays <= 30) current.units30 += item.quantity;
    if (!current.lastSoldAt || new Date(order.createdAt) > new Date(current.lastSoldAt)) current.lastSoldAt = order.createdAt;
    sales.set(item.variantId, current);
  }
  const products = normalizeProducts(allProducts, shop.currencyCode, sales);
  const refunds = normalizeRefunds(allOrders, shop.currencyCode);
  return { source: "live", generatedAt: now.toISOString(), shop: { name: shop.name, domain: shop.myshopifyDomain, currencyCode: shop.currencyCode, timezone: normalizeIanaTimezone(shop.ianaTimezone) }, orders, customers, products, refunds, warnings };
}

export function normalizeCustomers(raw: RawCustomer[], fallbackCurrency: string): Customer[] {
  return raw.map(customer => ({ id: customer.id, name: customer.displayName || "Unknown customer", email: customer.email || "", ordersCount: Number(customer.numberOfOrders || 0), lifetimeValue: { amount: Number(customer.amountSpent?.amount || 0), currencyCode: customer.amountSpent?.currencyCode || fallbackCurrency }, lastOrderAt: customer.lastOrder?.createdAt || null, tags: customer.tags || [] }));
}

export function normalizeOrders(raw: RawOrder[], fallbackCurrency: string): Order[] {
  return raw.map(order => {
    const amount = order.currentTotalPriceSet?.shopMoney;
    const fulfillment = order.fulfillments?.[0];
    return { id: order.id, name: order.name, createdAt: order.createdAt, updatedAt: order.updatedAt, customerId: order.customer?.id || null, customerName: order.customer?.displayName || "Guest", total: { amount: Number(amount?.amount || 0), currencyCode: amount?.currencyCode || fallbackCurrency }, fulfillmentStatus: fulfillmentState(order.displayFulfillmentStatus), financialStatus: financialState(order.displayFinancialStatus), fulfillmentCreatedAt: fulfillment?.createdAt || null, lineItems: (order.lineItems?.nodes || []).map(item => ({ id: item.id, productId: item.product?.id || null, variantId: item.variant?.id || null, title: item.title, variantTitle: item.variantTitle || "Default", quantity: item.quantity, total: { amount: Number(item.originalTotalSet?.shopMoney?.amount || 0), currencyCode: item.originalTotalSet?.shopMoney?.currencyCode || fallbackCurrency } })) };
  });
}

export function normalizeProducts(raw: RawProduct[], fallbackCurrency: string, sales = new Map<string, { units7: number; units30: number; lastSoldAt: string | null }>()): Product[] {
  return raw.map(product => ({ id: product.id, title: product.title, productType: product.productType || "", status: product.status === "DRAFT" ? "DRAFT" : product.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE", variants: (product.variants?.nodes || []).map(variant => { const activity = sales.get(variant.id); return { id: variant.id, productId: product.id, productTitle: product.title, title: variant.title, sku: variant.sku || "No SKU", available: variant.inventoryQuantity ?? 0, price: { amount: Number(variant.price || 0), currencyCode: fallbackCurrency }, unitsSold7d: activity?.units7 || 0, unitsSold30d: activity?.units30 || 0, lastSoldAt: activity?.lastSoldAt || null }; }) }));
}

export function normalizeRefunds(raw: RawOrder[], fallbackCurrency: string): Refund[] {
  return raw.flatMap(order => (order.refunds || []).map(refund => ({ id: refund.id, orderId: order.id, orderName: order.name, createdAt: refund.createdAt, amount: { amount: Number(refund.totalRefundedSet?.shopMoney?.amount || 0), currencyCode: refund.totalRefundedSet?.shopMoney?.currencyCode || fallbackCurrency }, reason: "Reason not provided by query" })));
}
