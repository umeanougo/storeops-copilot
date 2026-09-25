import Link from "next/link";
import { ArrowRight, Ban, Boxes, Clock3, PackageCheck, ShieldAlert, Store, TimerReset } from "lucide-react";
import { getStoreResult } from "@/lib/data/store";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { detectAlerts } from "@/lib/domain/alerts";
import { calculateMerchantBacklogs, calculateMetrics, getPrioritizedOrders } from "@/lib/domain/metrics";
import { ageLabel } from "@/lib/domain/format";
import { createFallbackBrief } from "@/lib/domain/brief";
import { AppShell } from "@/components/app-shell";
import { SourceBanner } from "@/components/source-banner";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { DailyBriefCard } from "@/components/daily-brief-card";
import { AlertCard } from "@/components/alert-card";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const result = await getStoreResult();
  const { snapshot } = result;
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
  const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
  const backlogs = calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS);
  const prioritized = getPrioritizedOrders(snapshot, DEFAULT_THRESHOLDS).slice(0, 4);
  const brief = createFallbackBrief(snapshot, alerts, metrics);
  const constraints = alerts.filter(alert => alert.issueType === "inventory_constraint").slice(0, 3);
  const merchantById = new Map(snapshot.merchants.map(merchant => [merchant.id, merchant]));
  const storeById = new Map(snapshot.stores.map(store => [store.id, store]));
  const date = new Date(snapshot.generatedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: snapshot.stores[0]?.timezone || "UTC" });

  return <AppShell source={snapshot.source} storeName={snapshot.provider.name} storeCount={snapshot.stores.length} warning={result.liveError}>
    <main className="mx-auto max-w-[1240px] px-4 py-7 sm:px-7 lg:px-9 lg:py-10">
      <PageHeader eyebrow={`${snapshot.source === "demo" ? "Demo" : "Live"} snapshot · ${snapshot.stores.length} stores · ${date}`} title="What needs attention today" description="Open orders, ageing, and blockers in one operator view—without switching Shopify accounts." action={<Link href="/orders" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f2923] px-5 py-3 text-[12px] font-bold text-white transition hover:bg-[#304038]">Open order queue <ArrowRight size={14}/></Link>} />
      <div className="mt-6"><SourceBanner result={result} /></div>

      <section className="mt-7" aria-labelledby="workload-heading">
        <div className="mb-4 flex items-center justify-between"><h2 id="workload-heading" className="text-[12px] font-bold uppercase tracking-[.13em] text-[#7b857d]">Today’s workload</h2><p className="text-[12px] text-[#7b857d]">Excludes fulfilled orders</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={PackageCheck} label="Open orders" value={String(metrics.totalOpenOrders)} note="Across stores" />
          <MetricCard icon={ShieldAlert} label="Paid, still open" value={String(metrics.paidUnfulfilledOrders)} note="Payment confirmed" tone="good" />
          <MetricCard icon={TimerReset} label="Overdue orders" value={String(metrics.olderThan48h)} note="> 48 hours" tone="attention" />
          <MetricCard icon={Store} label="Merchants to review" value={String(metrics.merchantsAtRisk)} note="Rule threshold crossed" tone="attention" />
        </div>
        <div className="mt-3 grid overflow-hidden rounded-2xl border border-[var(--line)] bg-white sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat icon={Clock3} label="Ageing > 24h" value={String(metrics.olderThan24h)} />
          <MiniStat icon={Ban} label="Payment blocked" value={String(metrics.paymentBlockedOrders)} />
          <MiniStat icon={Boxes} label="Inventory blockers" value={String(metrics.inventoryConstraints)} />
          <MiniStat icon={Clock3} label="Oldest open order" value={ageLabel(metrics.oldestOutstandingHours)} last />
        </div>
      </section>

      <div className="mt-7"><DailyBriefCard initial={brief} /></div>

      <div className="mt-9 grid gap-8 xl:grid-cols-[1.15fr_.85fr]">
        <section aria-labelledby="priority-heading">
          <SectionHeading eyebrow="Orders awaiting action" title="Highest priority" href="/orders" linkLabel="View queue" id="priority-heading" />
          <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">{prioritized.map(({ order, priority }, index) => <Link key={order.id} href={`/orders/${order.id}` as never} className="group grid gap-3 border-b border-[var(--line)] p-4 last:border-0 hover:bg-[#fafbf8] sm:grid-cols-[28px_minmax(0,1fr)_auto] sm:items-center"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#eef2ed] text-[11px] font-bold text-[#526158]">{index + 1}</span><div><p className="text-[11px] font-semibold text-[#758077]">{merchantById.get(order.merchantId)?.name} · {storeById.get(order.storeId)?.name}</p><p className="mt-1 text-[14px] font-bold">{order.name} · {order.customerName}</p><p className="mt-1 text-[12px] text-[#667169]">{priority.reasons.slice(0, 2).join(" · ")}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${priority.band === "critical" ? "bg-[#fee8e1] text-[#a7442d]" : priority.band === "high" ? "bg-[#fff0de] text-[#98601e]" : "bg-[#edf1ec] text-[#59675e]"}`}>{priority.band}</span><span className="font-mono text-[12px]">P{priority.score}</span><ArrowRight size={14} className="text-[#a2aaa3] transition group-hover:translate-x-0.5" /></div></Link>)}{!prioritized.length && <p className="p-5 text-[13px] text-[#758077]">No open orders are available.</p>}</div>
        </section>

        <section aria-labelledby="backlog-heading">
          <SectionHeading eyebrow="Merchant backlogs" title="Where work is building" href="/merchants" linkLabel="All merchants" id="backlog-heading" />
          <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">{backlogs.slice(0, 4).map(backlog => <Link key={backlog.merchantId} href={`/merchants/${backlog.merchantId}` as never} className="group flex items-center justify-between border-b border-[var(--line)] p-4 last:border-0 hover:bg-[#fafbf8]"><div><p className="text-[13px] font-bold">{merchantById.get(backlog.merchantId)?.name}</p><p className="mt-1 text-[11px] text-[#758077]">{storeById.get(backlog.storeId)?.name} · oldest {ageLabel(backlog.oldestOrderHours)}</p></div><div className="flex items-center gap-4 text-right"><div><p className="text-[20px] font-bold">{backlog.openOrders}</p><p className={`text-[10px] ${snapshot.source === "demo" && backlog.backlogChange > 0 ? "text-[#a95337]" : "text-[#7d867f]"}`}>{snapshot.source === "demo" ? `${backlog.backlogChange >= 0 ? "+" : ""}${backlog.backlogChange} vs demo baseline` : "Trend unavailable"}</p></div><ArrowRight size={14} className="text-[#a2aaa3] transition group-hover:translate-x-0.5" /></div></Link>)}</div>
        </section>
      </div>

      <section className="mt-9" aria-labelledby="inventory-heading">
        <SectionHeading eyebrow="Inventory blockers" title="Orders with a stock shortfall" href="/inventory" linkLabel="View inventory" id="inventory-heading" />
        <div className="grid gap-3 md:grid-cols-3">{constraints.length ? constraints.map(alert => <AlertCard key={alert.id} alert={alert} compact />) : <div className="rounded-[18px] border border-dashed border-[#d6dbd5] bg-[#fafbf8] p-5 text-[13px] text-[#758077] md:col-span-3">No open order has a same-store inventory shortfall.</div>}</div>
      </section>

      <p className="mt-9 border-t border-[var(--line)] pt-5 text-[11px] leading-5 text-[#758077]">Read-only portfolio prototype · No Shopify orders, inventory, fulfilments, payments, or customer records are modified.</p>
    </main>
  </AppShell>;
}

function MiniStat({ icon: Icon, label, value, last = false }: { icon: typeof Clock3; label: string; value: string; last?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 px-5 py-4 ${last ? "" : "border-b border-[var(--line)] sm:odd:border-r xl:border-b-0"}`}><div className="flex items-center gap-2.5"><Icon size={15} className="text-[#718078]" /><span className="text-[12px] text-[#667169]">{label}</span></div><span className="text-[15px] font-bold">{value}</span></div>;
}

function SectionHeading({ eyebrow, title, href, linkLabel, id }: { eyebrow: string; title: string; href: string; linkLabel: string; id: string }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#7b857d]">{eyebrow}</p><h2 id={id} className="mt-1.5 text-[20px] font-bold tracking-[-.035em]">{title}</h2></div><Link href={href as never} className="shrink-0 text-[12px] font-bold text-[#9d4d34]">{linkLabel} →</Link></div>;
}
