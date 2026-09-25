import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { UnifiedOrderQueue, type QueueRow } from "@/components/unified-order-queue";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { calculateOrderPriority, isOpenOrder } from "@/lib/domain/metrics";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ merchant?: string; store?: string }>;
}) {
  const [result, params] = await Promise.all([getStoreResult(), searchParams]);
  const snapshot = result.snapshot;
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
  const merchantById = new Map(snapshot.merchants.map((merchant) => [merchant.id, merchant]));
  const storeById = new Map(snapshot.stores.map((store) => [store.id, store]));

  const rows: QueueRow[] = snapshot.orders.map((order) => {
    const priority = calculateOrderPriority(snapshot, order, DEFAULT_THRESHOLDS);

    return {
      id: order.id,
      merchantId: order.merchantId,
      merchantName: merchantById.get(order.merchantId)?.name || "Unknown merchant",
      storeId: order.storeId,
      storeName: storeById.get(order.storeId)?.name || "Unknown store",
      orderName: order.name,
      createdAt: order.createdAt,
      customerName: order.customerName,
      financialStatus: order.financialStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      lineItemCount: order.lineItems.length,
      itemQuantity: order.lineItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: order.total.amount,
      currencyCode: order.total.currencyCode,
      isOpen: isOpenOrder(order),
      isCancelled: Boolean(order.cancelledAt),
      priorityScore: priority.score,
      priorityBand: priority.band,
      exceptionTypes: [
        ...new Set(alerts.filter((alert) => alert.recordId === order.id).map((alert) => alert.issueType)),
      ],
      recommendedAction: priority.recommendedAction,
    };
  });

  const initialMerchant = snapshot.merchants.some((merchant) => merchant.id === params.merchant)
    ? params.merchant!
    : "all";
  const requestedStore = snapshot.stores.find((store) => store.id === params.store);
  const initialStore =
    requestedStore && (initialMerchant === "all" || requestedStore.merchantId === initialMerchant)
      ? requestedStore.id
      : "all";
  const sourceDescription =
    snapshot.source === "demo"
      ? "Open fulfilment work across the simulated client portfolio, ranked by deterministic operating rules."
      : "Open fulfilment work across connected Shopify stores, ranked by deterministic operating rules.";

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader eyebrow="Cross-merchant fulfilment" title="Order queue" description={sourceDescription} />
        <div className="mt-6">
          <SourceBanner result={result} />
        </div>
        <UnifiedOrderQueue
          rows={rows}
          generatedAt={snapshot.generatedAt}
          timezone={snapshot.stores[0]?.timezone || "UTC"}
          initialMerchant={initialMerchant}
          initialStore={initialStore}
        />
      </main>
    </AppShell>
  );
}
