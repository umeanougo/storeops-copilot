import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DetailSection, FactGrid } from "@/components/detail-section";
import { AlertCard } from "@/components/alert-card";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { formatMoney } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function VariantPage({ params }: { params: Promise<{ id: string }> }) {
  const [result, { id }] = await Promise.all([getStoreResult(), params]);
  const snapshot = result.snapshot;
  const variant = snapshot.products
    .flatMap((product) => product.variants)
    .find((item) => item.id === id);

  if (!variant) notFound();

  const merchant = snapshot.merchants.find((item) => item.id === variant.merchantId)!;
  const store = snapshot.stores.find((item) => item.id === variant.storeId)!;
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS).filter((alert) =>
    alert.supportingData.some((item) => item.recordId === id),
  );
  const affectedOrders = snapshot.orders.filter(
    (order) =>
      order.merchantId === variant.merchantId &&
      order.storeId === variant.storeId &&
      order.fulfillmentStatus !== "FULFILLED" &&
      order.lineItems.some((item) => item.variantId === id),
  );
  const availability =
    variant.available == null ? "Unavailable from Shopify" : `${variant.available} units`;

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/inventory"
          className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold text-[#68736b] hover:text-[#1b251f]"
        >
          <ArrowLeft size={15} />
          All inventory
        </Link>

        <header className="mt-5 border-b border-[#dfe2dc] pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#758078]">
            {merchant.name} · {store.name}
          </p>
          <h1 className="mt-2 text-[36px] font-bold tracking-[-.05em] text-[#17211b]">
            {variant.productTitle}
          </h1>
          <p className="mt-2 text-[14px] text-[#657069]">
            {variant.title} · {variant.sku}
          </p>
        </header>

        <div className="mt-6 space-y-4">
          <DetailSection
            eyebrow="Inventory facts"
            title="Current same-store variant"
            description="Availability and sales remain scoped to the Shopify store that owns this product record."
          >
            <FactGrid
              facts={[
                { label: "Merchant", value: merchant.name },
                { label: "Client store", value: store.name },
                { label: "Available", value: availability },
                { label: "Open orders using variant", value: String(affectedOrders.length) },
                { label: "Ordered · 7 days", value: `${variant.unitsSold7d} units` },
                { label: "Ordered · 30 days", value: `${variant.unitsSold30d} units` },
                {
                  label: "Unit price",
                  value: formatMoney(variant.price.amount, variant.price.currencyCode),
                },
                { label: "Connection", value: store.connectionStatus },
              ]}
            />
          </DetailSection>

          {variant.available == null && (
            <p className="rounded-2xl border border-[#e5ddd0] bg-[#fffaf2] px-5 py-4 text-[13px] leading-6 text-[#745d42]">
              No available quantity was returned for this variant, so the product is excluded from low-stock and inventory-blocker rules.
            </p>
          )}

          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
