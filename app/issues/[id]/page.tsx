import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calculator, Database, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DetailSection, FactGrid } from "@/components/detail-section";
import { SeverityBadge } from "@/components/severity";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts, getAlertById } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

export const dynamic = "force-dynamic";

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const [result, { id }] = await Promise.all([getStoreResult(), params]);
  const snapshot = result.snapshot;
  const alert = getAlertById(detectAlerts(snapshot, DEFAULT_THRESHOLDS), id);

  if (!alert) notFound();

  const merchant = snapshot.merchants.find((item) => item.id === alert.merchantId)!;
  const store = snapshot.stores.find((item) => item.id === alert.storeId)!;
  const sourceLabel = snapshot.source === "demo" ? "Simulated portfolio data" : "Live Shopify data";

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[980px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link
          href="/exceptions"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#5f6b63] transition hover:bg-white hover:text-[#17211b]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to exceptions
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              <span className="rounded-full border border-[#dce0da] bg-white px-3 py-1.5 font-mono text-xs text-[#5f6b63]">
                Priority {alert.priorityScore}/100
              </span>
            </div>
            <p className="small-caps mt-5 text-xs font-bold text-[#78827b]">
              {merchant.name} · {store.name} · {sourceLabel}
            </p>
            <h1 className="mt-2 max-w-[720px] text-[34px] font-bold leading-[1.08] tracking-[-0.045em] text-[#17211b] sm:text-[40px]">
              {alert.title}
            </h1>
            <p className="mt-3 max-w-[720px] text-sm leading-6 text-[#626d65]">{alert.detected}</p>
          </div>

          <Link
            href={alert.recordLink as never}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1f2923] px-4 text-sm font-bold text-white transition hover:bg-[#304137]"
          >
            Open source record
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>

        <div className="mt-8 space-y-5">
          <DetailSection
            eyebrow="1 · Supporting data"
            title="Merchant, store, and source facts"
            description="All values come from normalized source data; no model inference is used here."
          >
            <FactGrid facts={alert.supportingData.map((item) => ({ label: item.label, value: item.value }))} />
            <p className="mt-4 flex items-center gap-2 text-xs text-[#6f7972]">
              <Database size={15} aria-hidden="true" />
              Record: {alert.recordType} · {alert.recordId}
            </p>
          </DetailSection>

          <DetailSection
            eyebrow="2 · Detected by rule"
            title="Why this was flagged"
            description={alert.why}
            tone="rule"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/80 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5c6c63]">
                  <Calculator size={15} aria-hidden="true" />
                  Rule
                </div>
                <p className="mt-2 text-sm leading-6 text-[#344139]">{alert.rule}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#5c6c63]">
                  <ShieldCheck size={15} aria-hidden="true" />
                  Threshold used
                </div>
                <p className="mt-2 text-sm leading-6 text-[#344139]">{alert.threshold}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#66776d]">
              Severity and priority are deterministic operating signals, not predictive AI.
            </p>
          </DetailSection>

          <DetailSection
            eyebrow="3 · Recommended review"
            title="A next step, not an automated action"
            tone="suggestion"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#9b5931]">
                <ShieldCheck size={17} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-6 text-[#352f28]">{alert.recommendedAction}</p>
                <p className="mt-2 text-xs leading-5 text-[#756d64]">
                  This recommendation uses available same-store data. An operator must review it; StoreOps
                  Copilot cannot modify Shopify records.
                </p>
              </div>
            </div>
          </DetailSection>
        </div>
      </main>
    </AppShell>
  );
}
