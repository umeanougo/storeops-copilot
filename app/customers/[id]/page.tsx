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

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const [result, { id }] = await Promise.all([getStoreResult(), params]);
  const snapshot = result.snapshot;
  const customer = snapshot.customers.find((item) => item.id === id);

  if (!customer) notFound();

  const merchant = snapshot.merchants.find((item) => item.id === customer.merchantId)!;
  const store = snapshot.stores.find((item) => item.id === customer.storeId)!;
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS).filter(
    (alert) =>
      alert.merchantId === customer.merchantId &&
      alert.storeId === customer.storeId &&
      alert.supportingData.some((item) => item.recordId === id),
  );
  const orders = snapshot.orders.filter(
    (order) =>
      order.customerId === id &&
      order.merchantId === customer.merchantId &&
      order.storeId === customer.storeId,
  );
  const identityNote =
    snapshot.source === "demo"
      ? "Synthetic identity · no real personal information"
      : "Read-only customer record from the connected Shopify store";

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/customers"
          className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold text-[#68736b] hover:text-[#1b251f]"
        >
          <ArrowLeft size={15} />
          Supporting customer records
        </Link>

        <header className="mt-5 border-b border-[#dfe2dc] pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#758078]">
            {merchant.name} · {store.name}
          </p>
          <h1 className="mt-2 text-[36px] font-bold tracking-[-.05em] text-[#17211b]">
            {customer.name}
          </h1>
          <p className="mt-2 text-[13px] text-[#667169]">
            {identityNote} · value scoped to this store
          </p>
        </header>

        <div className="mt-6 space-y-4">
          <DetailSection
            eyebrow="Customer facts"
            title="Same-store relationship"
            description="Customer value and order history stay inside the merchant and store boundary that owns this record."
          >
            <FactGrid
              facts={[
                { label: "Merchant", value: merchant.name },
                { label: "Client store", value: store.name },
                {
                  label: "Lifetime value",
                  value: formatMoney(
                    customer.lifetimeValue.amount,
                    customer.lifetimeValue.currencyCode,
                  ),
                },
                { label: "Lifetime orders", value: String(customer.ordersCount) },
                { label: "Orders in snapshot", value: String(orders.length) },
                { label: "Tags", value: customer.tags.join(", ") || "None" },
              ]}
            />
          </DetailSection>

          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
