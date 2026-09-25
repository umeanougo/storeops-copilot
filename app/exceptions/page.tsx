import { AlertCard } from "@/components/alert-card";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

export const dynamic = "force-dynamic";

const groups = [
  {
    id: "needs-attention",
    label: "Needs attention now",
    description: "Orders blocked by age, payment, inventory, or fulfilment status.",
    types: [
      "order_age_48",
      "inventory_constraint",
      "payment_blocked",
      "partial_fulfillment",
      "unusual_status",
    ],
  },
  {
    id: "merchant-workload",
    label: "Merchant workload",
    description: "Stores where open work has crossed the operating threshold.",
    types: ["merchant_backlog"],
  },
  {
    id: "watch-next",
    label: "Watch next",
    description: "Paid open orders and early signals worth reviewing before they escalate.",
    types: [
      "paid_unfulfilled",
      "order_age_24",
      "high_value_order",
      "customer_risk",
      "low_inventory",
    ],
  },
];

export default async function ExceptionsPage() {
  const result = await getStoreResult();
  const snapshot = result.snapshot;
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          eyebrow="Deterministic operating rules"
          title="Operational exceptions"
          description="A focused review queue with the source facts, threshold, and next step behind every finding."
        />

        <div className="mt-6">
          <SourceBanner result={result} />
        </div>

        {groups.map((group) => {
          const groupAlerts = alerts.filter((alert) => group.types.includes(alert.issueType));
          const visibleAlerts = groupAlerts.slice(0, 9);

          return (
            <section key={group.id} className="mt-9" aria-labelledby={`${group.id}-heading`}>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id={`${group.id}-heading`} className="text-xl font-bold tracking-[-0.02em] text-[#17211b]">
                    {group.label}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#69736c]">{group.description}</p>
                </div>
                <p className="text-xs font-semibold text-[#7b857d]">
                  {groupAlerts.length} {groupAlerts.length === 1 ? "finding" : "findings"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleAlerts.length > 0 ? (
                  visibleAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[#d6dbd5] bg-[#faf9f5] p-6 text-sm text-[#69736c] md:col-span-2 xl:col-span-3">
                    No findings in this category.
                  </div>
                )}
              </div>

              {groupAlerts.length > visibleAlerts.length ? (
                <p className="mt-3 text-xs text-[#7b857d]">
                  Showing the {visibleAlerts.length} highest-priority findings.
                </p>
              ) : null}
            </section>
          );
        })}
      </main>
    </AppShell>
  );
}
