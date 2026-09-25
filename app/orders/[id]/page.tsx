import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AlertCard } from "@/components/alert-card";
import { AppShell } from "@/components/app-shell";
import { DetailSection, FactGrid } from "@/components/detail-section";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { ageLabel, formatDateTime, formatMoney, hoursBetween } from "@/lib/domain/format";
import { calculateOrderPriority } from "@/lib/domain/metrics";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [result, { id }] = await Promise.all([getStoreResult(), params]);
  const snapshot = result.snapshot;
  const order = snapshot.orders.find((item) => item.id === id);

  if (!order) notFound();

  const merchant = snapshot.merchants.find((item) => item.id === order.merchantId)!;
  const store = snapshot.stores.find((item) => item.id === order.storeId)!;
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS).filter((alert) => alert.recordId === id);
  const priority = calculateOrderPriority(snapshot, order, DEFAULT_THRESHOLDS);
  const age = hoursBetween(snapshot.generatedAt, order.createdAt);
  const variants = snapshot.products.flatMap((product) => product.variants);
  const sourceLabel = snapshot.source === "demo" ? "Simulated portfolio data" : "Live Shopify data";

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href={`/orders?merchant=${merchant.id}&store=${store.id}` as never}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#5f6b63] transition hover:bg-white hover:text-[#17211b]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to {merchant.name} queue
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="small-caps text-xs font-bold text-[#78827b]">
              {merchant.name} · {store.name} · {sourceLabel}
            </p>
            <h1 className="mt-2 text-[38px] font-bold tracking-[-0.045em] text-[#17211b] sm:text-[44px]">
              Order {order.name}
            </h1>
            <p className="mt-2 text-sm text-[#626d65]">
              Created {formatDateTime(order.createdAt, store.timezone)} · {ageLabel(age)} ago
            </p>
          </div>

          <div className="min-w-40 rounded-2xl border border-[#dfe2dc] bg-white px-5 py-4 sm:text-right">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#78827b]">
              Review priority
            </p>
            <p className="mt-1 text-[30px] font-bold leading-none text-[#17211b]">
              {priority.score}
              <span className="ml-1 text-sm text-[#758078]">/100</span>
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.06em] text-[#a95337]">
              {priority.band}
            </p>
          </div>
        </header>

        <div className="mt-7 space-y-5">
          <DetailSection eyebrow="Merchant and store" title="Tenant context">
            <FactGrid
              facts={[
                { label: "Data source", value: sourceLabel },
                { label: "Fulfilment provider", value: snapshot.provider.name },
                { label: "Merchant", value: merchant.name },
                { label: "Client store", value: store.name },
                { label: "Store domain", value: store.domain },
              ]}
            />
          </DetailSection>

          <DetailSection eyebrow="Order facts" title="Current source record">
            <FactGrid
              facts={[
                { label: "Customer", value: order.customerName },
                { label: "Order value", value: formatMoney(order.total.amount, order.total.currencyCode) },
                { label: "Payment", value: order.financialStatus.replaceAll("_", " ") },
                { label: "Fulfilment", value: order.fulfillmentStatus.replaceAll("_", " ") },
                { label: "Line items", value: String(order.lineItems.length) },
                {
                  label: "Item quantity",
                  value: String(order.lineItems.reduce((sum, item) => sum + item.quantity, 0)),
                },
                { label: "Order notes", value: order.notes || "No note in available data" },
                { label: "Tags", value: order.tags.join(", ") || "None" },
              ]}
            />
          </DetailSection>

          <DetailSection eyebrow="Line items and availability" title="Items required for fulfilment">
            <div className="space-y-3">
              {order.lineItems.map((item) => {
                const variant = variants.find(
                  (candidate) =>
                    candidate.id === item.variantId &&
                    candidate.merchantId === order.merchantId &&
                    candidate.storeId === order.storeId,
                );
                const available = variant?.available;
                const inventoryKnown = available != null;
                const inventoryShort = available != null && available < item.quantity;

                return (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-xl border border-[#e2e5df] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#17211b]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#758078]">
                        {item.variantTitle} · Quantity {item.quantity}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${inventoryShort ? "text-[#ad4a30]" : "text-[#26362d]"}`}>
                        {inventoryKnown ? `${available} available` : "Inventory unavailable"}
                      </p>
                      <p className="mt-1 text-xs text-[#758078]">Same-store inventory</p>
                    </div>
                    <p className="text-sm font-bold text-[#17211b]">
                      {formatMoney(item.total.amount, item.total.currencyCode)}
                    </p>
                  </div>
                );
              })}
            </div>
          </DetailSection>

          <DetailSection
            eyebrow="Deterministic prioritization"
            title="Why this order was prioritized"
            description="Rules assign the score; the language model does not calculate it."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {priority.reasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-xl border border-[#dce2db] bg-white p-4 text-sm leading-6 text-[#344139]"
                >
                  {reason}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#eef3e8] p-4">
              <p className="small-caps text-xs font-bold text-[#5d735f]">Recommended review</p>
              <p className="mt-2 text-sm leading-6 text-[#4f5f55]">{priority.recommendedAction}</p>
            </div>
          </DetailSection>

          {alerts.length > 0 ? (
            <section aria-labelledby="current-exceptions-heading">
              <h2
                id="current-exceptions-heading"
                className="small-caps mb-3 text-xs font-bold text-[#6f7972]"
              >
                Current exceptions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
