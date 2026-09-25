import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DetailSection, FactGrid } from "@/components/detail-section";
import { AlertCard } from "@/components/alert-card";
import { getStoreResult } from "@/lib/data/store";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { detectAlerts } from "@/lib/domain/alerts";
import { calculateMerchantBacklogs } from "@/lib/domain/metrics";
import { ageLabel } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const [result, { id }] = await Promise.all([getStoreResult(), params]);
  const snapshot = result.snapshot;
  const merchant = snapshot.merchants.find((item) => item.id === id);

  if (!merchant) notFound();

  const store = snapshot.stores.find((item) => item.merchantId === id)!;
  const backlog = calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS).find(
    (item) => item.merchantId === id,
  )!;
  const allAlerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS).filter(
    (alert) => alert.merchantId === id,
  );
  const visibleAlerts = allAlerts.slice(0, 6);
  const orders = snapshot.orders.filter((order) => order.merchantId === id);
  const isDemo = snapshot.source === "demo";
  const connectionLabel = isDemo
    ? "Simulated portfolio connection"
    : "Read-only Shopify Admin API";

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/merchants"
          className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold text-[#68736b] hover:text-[#1b251f]"
        >
          <ArrowLeft size={15} />
          All merchants
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-5 border-b border-[#dfe2dc] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#758078]">
              Merchant workspace · {store.name}
            </p>
            <h1 className="mt-2 text-[38px] font-bold tracking-[-.05em] text-[#17211b]">
              {merchant.name}
            </h1>
            <p className="mt-2 text-[13px] text-[#667169]">
              {store.domain} · {connectionLabel} · {merchant.serviceLevelTargetHours}h service-level target
            </p>
          </div>
          <Link
            href={`/orders?merchant=${merchant.id}&store=${store.id}` as never}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f2923] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#2d3b33]"
          >
            Open filtered queue
            <ArrowRight size={14} />
          </Link>
        </header>

        <div className="mt-6 space-y-4">
          <DetailSection
            eyebrow="Current workload"
            title="Fulfilment backlog"
            description="Every metric below is restricted to this merchant and its connected store."
          >
            <FactGrid
              facts={[
                { label: "Open orders", value: String(backlog.openOrders) },
                { label: "Paid, still open", value: String(backlog.paidUnfulfilled) },
                { label: "Average order age", value: ageLabel(backlog.averageAgeHours) },
                { label: "Oldest order", value: ageLabel(backlog.oldestOrderHours) },
                { label: "Older than 24h", value: String(backlog.olderThan24h) },
                { label: "Older than 48h", value: String(backlog.olderThan48h) },
                { label: "Partially fulfilled", value: String(backlog.partiallyFulfilled) },
                { label: "Payment blocked", value: String(backlog.paymentBlocked) },
              ]}
            />
          </DetailSection>

          <DetailSection
            eyebrow="Operational pressure"
            title="What needs management attention"
            description={
              isDemo
                ? "The demo compares this generated snapshot with a seeded baseline."
                : "Live mode shows the current snapshot only; no historical backlog is stored for comparison."
            }
          >
            <FactGrid
              facts={[
                {
                  label: "Backlog trend",
                  value: isDemo
                    ? `${backlog.backlogChange >= 0 ? "+" : ""}${backlog.backlogChange} vs demo baseline`
                    : "Unavailable",
                },
                { label: "Risk status", value: backlog.riskLevel },
                { label: "Orders in snapshot", value: String(orders.length) },
                {
                  label: "Inventory constraints",
                  value: String(
                    allAlerts.filter((alert) => alert.issueType === "inventory_constraint").length,
                  ),
                },
              ]}
            />
          </DetailSection>

          <section aria-labelledby="merchant-exceptions-heading">
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#758078]">
                Current exceptions
              </p>
              <h2
                id="merchant-exceptions-heading"
                className="mt-1.5 text-[20px] font-bold tracking-[-.03em] text-[#17211b]"
              >
                Why this merchant needs attention
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleAlerts.length ? (
                visibleAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#d6dbd5] bg-[#faf9f5] p-6 text-[13px] leading-6 text-[#667169] sm:col-span-2">
                  No configured risk or exception rule is active for this merchant.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
