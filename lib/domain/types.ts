export type DataSource = "demo" | "live";
export type Severity = "critical" | "high" | "medium" | "low";
export type RiskLevel = "elevated" | "watch" | "clear";
export type IssueType =
  | "paid_unfulfilled"
  | "order_age_24"
  | "order_age_48"
  | "high_value_order"
  | "customer_risk"
  | "partial_fulfillment"
  | "unusual_status"
  | "payment_blocked"
  | "merchant_backlog"
  | "inventory_constraint"
  | "low_inventory"
  | "excess_inventory"
  | "refund_activity";
export type FulfillmentState =
  | "FULFILLED"
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "SCHEDULED"
  | "REQUEST_DECLINED"
  | "UNKNOWN";
export type FinancialState = "AUTHORIZED" | "EXPIRED" | "PAID" | "PARTIALLY_PAID" | "PARTIALLY_REFUNDED" | "PENDING" | "REFUNDED" | "VOIDED" | "UNKNOWN";

export type Money = { amount: number; currencyCode: string };

export type FulfillmentProvider = { id: string; name: string };

export type Merchant = {
  id: string;
  fulfillmentProviderId: string;
  name: string;
  status: "active" | "paused";
  serviceLevelTargetHours: number;
  primaryContact: string;
  previousOpenOrders: number;
};

export type ShopifyStore = {
  id: string;
  merchantId: string;
  name: string;
  domain: string;
  currencyCode: string;
  timezone: string;
  connectionStatus: "connected" | "attention" | "demo";
  mode: DataSource;
};

export type Customer = {
  id: string;
  merchantId: string;
  storeId: string;
  name: string;
  email: string;
  ordersCount: number;
  lifetimeValue: Money;
  lastOrderAt: string | null;
  tags: string[];
};

export type ProductVariant = {
  id: string;
  merchantId: string;
  storeId: string;
  productId: string;
  productTitle: string;
  title: string;
  sku: string;
  available: number;
  price: Money;
  unitsSold7d: number;
  unitsSold30d: number;
  lastSoldAt: string | null;
};

export type Product = {
  id: string;
  merchantId: string;
  storeId: string;
  title: string;
  productType: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  variants: ProductVariant[];
};

export type OrderLineItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  title: string;
  variantTitle: string;
  quantity: number;
  total: Money;
};

export type Order = {
  id: string;
  merchantId: string;
  storeId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  customerId: string | null;
  customerName: string;
  total: Money;
  fulfillmentStatus: FulfillmentState;
  financialStatus: FinancialState;
  lineItems: OrderLineItem[];
  fulfillmentCreatedAt: string | null;
  tags: string[];
  notes: string;
  riskSignals: string[];
};

export type Refund = {
  id: string;
  merchantId: string;
  storeId: string;
  orderId: string;
  orderName: string;
  createdAt: string;
  amount: Money;
  reason: string;
};

export type FulfillmentTask = {
  id: string;
  merchantId: string;
  storeId: string;
  orderId: string;
  taskType: "review" | "pick_pack" | "payment_check" | "inventory_check";
  status: "open" | "in_progress" | "blocked" | "done";
  priority: number;
  createdAt: string;
  dueAt: string;
};

export type OperationsSnapshot = {
  source: DataSource;
  generatedAt: string;
  provider: FulfillmentProvider;
  merchants: Merchant[];
  stores: ShopifyStore[];
  orders: Order[];
  customers: Customer[];
  products: Product[];
  refunds: Refund[];
  tasks: FulfillmentTask[];
  warnings: string[];
};

export type StoreSnapshot = OperationsSnapshot;

export type SupportingDatum = {
  label: string;
  value: string;
  recordType?: "order" | "product" | "variant" | "customer" | "refund" | "merchant" | "store";
  recordId?: string;
};

export type OperationalAlert = {
  id: string;
  merchantId: string;
  storeId: string;
  title: string;
  severity: Severity;
  issueType: IssueType;
  detectedAt: string;
  detected: string;
  why: string;
  supportingData: SupportingDatum[];
  rule: string;
  threshold: string;
  recommendedAction: string;
  recordLink: string;
  recordType: "order" | "product" | "customer" | "refund" | "merchant";
  recordId: string;
  priorityScore: number;
  findingSource: "deterministic_rule";
};

export type AlertThresholds = {
  ageingWarningHours: number;
  overdueHours: number;
  highValueOrderAmount: number;
  highValueCustomerAmount: number;
  backlogOpenOrders: number;
  backlogIncreaseOrders: number;
  lowInventoryUnits: number;
  excessInventoryUnits: number;
  lowVelocityUnits30d: number;
  refundWindowDays: number;
  refundCountThreshold: number;
};

export type OrderPriority = {
  orderId: string;
  score: number;
  band: "critical" | "high" | "medium" | "routine";
  reasons: string[];
  recommendedAction: string;
};

export type MerchantBacklog = {
  merchantId: string;
  storeId: string;
  openOrders: number;
  paidUnfulfilled: number;
  olderThan24h: number;
  olderThan48h: number;
  partiallyFulfilled: number;
  paymentBlocked: number;
  averageAgeHours: number;
  oldestOrderHours: number;
  backlogChange: number;
  riskLevel: RiskLevel;
};

export type OperationsMetrics = {
  totalOpenOrders: number;
  paidUnfulfilledOrders: number;
  olderThan24h: number;
  olderThan48h: number;
  merchantsAtRisk: number;
  paymentBlockedOrders: number;
  inventoryConstraints: number;
  oldestOutstandingHours: number;
};
