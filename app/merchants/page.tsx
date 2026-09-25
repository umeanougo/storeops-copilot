import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { getStoreResult } from "@/lib/data/store";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { calculateMerchantBacklogs } from "@/lib/domain/metrics";
import { ageLabel } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const result = await getStoreResult();
  const snapshot = result.snapshot;
  const backlogs = calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS);
  const storeById = new Map(snapshot.stores.map((store) => [store.id, store]));
  const isDemo = snapshot.source === "demo";

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          eyebrow="Merchant portfolio"
          title="Workload by merchant"
          description={
            isDemo
              ? "Compare open work, ageing, blockers, and simulated backlog movement without mixing records across stores."
              : "Compare current open work, ageing, and blockers without mixing records across connected Shopify stores."
          }
        />

        <div className="mt-6">
          <SourceBanner result={result} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {backlogs.map((backlog) => {
            const merchant = snapshot.merchants.find((item) => item.id === backlog.merchantId)!;
            const store = storeById.get(backlog.storeId)!;

            return (
              <Link
                key={merchant.id}
                href={`/merchants/${merchant.id}` as never}
                className="group rounded-[20px] border border-[#dfe2dc] bg-[#fffefa] p-5 transition hover:-translate-y-0.5 hover:border-[#b8c4ba] hover:shadow-sm sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#78837b]">
                      {store.name}
                    </p>
                    <h2 className="mt-2 text-[20px] font-bold tracking-[-.03em] text-[#17211b]">
                      {merchant.name}
                    </h2>
                    <p className="mt-1.5 text-[12px] text-[#6c766f]">
                      Service-level target · {merchant.serviceLevelTargetHours}h
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={backlog.riskLevel} />
                    <ArrowUpRight
                      size={16}
                      className="text-[#99a19a] transition group-hover:text-[#b64d2f]"
                    />
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Open" value={backlog.openOrders} />
                  <Stat label="Paid, still open" value={backlog.paidUnfulfilled} />
                  <Stat label="Older than 48h" value={backlog.olderThan48h} />
                  <Stat label="Payment blocked" value={backlog.paymentBlocked} />
                </dl>

                <div className="mt-5 flex flex-col gap-2 border-t border-[#e8ebe6] pt-4 text-[12px] text-[#69746c] sm:flex-row sm:items-center sm:justify-between">
                  <span>Oldest open order · {ageLabel(backlog.oldestOrderHours)}</span>
                  {isDemo ? (
                    <span className={backlog.backlogChange > 0 ? "font-bold text-[#a95337]" : "font-semibold"}>
                      {backlog.backlogChange >= 0 ? "+" : ""}
                      {backlog.backlogChange} vs demo baseline
                    </span>
                  ) : (
                    <span className="font-semibold text-[#727c75]">Trend unavailable</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}

function RiskBadge({ level }: { level: "clear" | "watch" | "elevated" }) {
  const style =
    level === "elevated"
      ? "bg-[#fee8e1] text-[#a7442d]"
      : level === "watch"
        ? "bg-[#fff0de] text-[#98601e]"
        : "bg-[#e7f0e8] text-[#3e684b]";

  return (
    <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.06em] ${style}`}>
      {level}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="text-[24px] font-bold tracking-[-.04em] text-[#17211b]">{value}</dd>
      <dt className="mt-1 text-[11px] leading-4 text-[#717b74]">{label}</dt>
    </div>
  );
}
