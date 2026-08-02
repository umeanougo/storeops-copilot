export type DataSource = "demo" | "live";
export type Severity = "critical" | "high" | "medium" | "low";
export type IssueType = "overdue_order" | "low_inventory" | "excess_inventory" | "customer_risk" | "refund_activity";
export type FulfillmentState = "FULFILLED" | "UNFULFILLED" | "PARTIALLY_FULFILLED" | "IN_PROGRESS" | "ON_HOLD";
export type FinancialState = "AUTHORIZED" | "EXPIRED" | "PAID" | "PARTIALLY_PAID" | "PARTIALLY_REFUNDED" | "PENDING" | "REFUNDED" | "VOIDED" | "UNKNOWN";

export type Money = { amount: number; currencyCode: string };

export type Customer = {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  lifetimeValue: Money;
  lastOrderAt: string | null;
  tags: string[];
};

export type ProductVariant = {
  id: string;
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
};

export type Refund = {
  id: string;
  orderId: string;
  orderName: string;
  createdAt: string;
  amount: Money;
  reason: string;
};

export type StoreSnapshot = {
  source: DataSource;
  generatedAt: string;
  shop: { name: string; domain: string; currencyCode: string; timezone: string };
  orders: Order[];
  customers: Customer[];
  products: Product[];
  refunds: Refund[];
  warnings: string[];
};

export type SupportingDatum = {
  label: string;
  value: string;
  recordType?: "order" | "product" | "variant" | "customer" | "refund";
  recordId?: string;
};

export type OperationalAlert = {
  id: string;
  title: string;
  severity: Severity;
  issueType: IssueType;
  detected: string;
  why: string;
  supportingData: SupportingDatum[];
  rule: string;
  threshold: string;
  recommendedAction: string;
  recordLink: string;
  recordType: "order" | "product" | "customer" | "refund";
  recordId: string;
  priorityScore: number;
  findingSource: "deterministic_rule";
};

export type AlertThresholds = {
  overdueHours: number;
  lowInventoryUnits: number;
  excessInventoryUnits: number;
  lowVelocityUnits30d: number;
  highValueCustomerAmount: number;
  refundWindowDays: number;
  refundCountThreshold: number;
};

export type OperationsMetrics = {
  orders7d: number;
  revenue7d: Money;
  unfulfilledOrders: number;
  overdueOrders: number;
  refunds7d: number;
  refundValue7d: Money;
  lowStockVariants: number;
  excessInventoryVariants: number;
};
