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
  const result = await getStoreResult(); const { snapshot } = result;
  const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
  const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
  const backlogs = calculateMerchantBacklogs(snapshot, DEFAULT_THRESHOLDS);
  const prioritized = getPrioritizedOrders(snapshot, DEFAULT_THRESHOLDS).slice(0, 5);
  const brief = createFallbackBrief(snapshot, alerts, metrics);
  const constraints = alerts.filter(alert => alert.issueType === "inventory_constraint").slice(0,3);
  const merchantById = new Map(snapshot.merchants.map(merchant => [merchant.id, merchant]));
  const storeById = new Map(snapshot.stores.map(store => [store.id, store]));
  return <AppShell source={snapshot.source} storeName={snapshot.provider.name} storeCount={snapshot.stores.length} warning={result.liveError}>
    <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader eyebrow={`Across ${snapshot.merchants.length} merchant clients · As of ${new Date(snapshot.generatedAt).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric",timeZone:snapshot.stores[0]?.timezone||"UTC"})}`} title="What needs fulfilment operations’ attention today?" description="One explainable view of ready work, ageing orders, merchant backlogs, payment blocks, and inventory constraints across every simulated client store." action={<Link href="/orders" className="inline-flex items-center gap-2 rounded-xl bg-[#1f2923] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#304038]">Open unified queue <ArrowRight size={13}/></Link>}/>
      <div className="mt-6"><SourceBanner result={result}/></div>
      <section className="mt-5"><p className="small-caps mb-3 text-[8px] font-bold text-[#8b948c]">Today’s workload</p><div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <MetricCard icon={PackageCheck} label="Open orders" value={String(metrics.totalOpenOrders)} note="Across stores"/>
        <MetricCard icon={ShieldAlert} label="Paid + unfulfilled" value={String(metrics.paidUnfulfilledOrders)} note="Ready work" tone="good"/>
        <MetricCard icon={Clock3} label="Older than 24h" value={String(metrics.olderThan24h)} note=">24h" tone="attention"/>
        <MetricCard icon={TimerReset} label="Older than 48h" value={String(metrics.olderThan48h)} note=">48h" tone="attention"/>
        <MetricCard icon={Store} label="Elevated merchants" value={String(metrics.merchantsAtRisk)} note="Backlog risk" tone="attention"/>
        <MetricCard icon={Ban} label="Payment blocked" value={String(metrics.paymentBlockedOrders)} note="Not ready"/>
        <MetricCard icon={Boxes} label="Inventory risks" value={String(metrics.inventoryConstraints)} note="Open orders" tone="attention"/>
        <MetricCard icon={Clock3} label="Oldest order" value={ageLabel(metrics.oldestOutstandingHours)} note="Outstanding"/>
      </div></section>
      <div className="mt-5"><DailyBriefCard initial={brief}/></div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section><div className="mb-3 flex items-end justify-between"><div><p className="small-caps text-[8px] font-bold text-[#8b948c]">Orders awaiting action</p><h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">Highest operational priority</h2></div><Link href="/orders" className="text-[9px] font-bold text-[#a64f34]">Open queue →</Link></div><div className="overflow-hidden rounded-[20px] border border-[#dfe2dc] bg-[#fffefa]">{prioritized.map(({order,priority})=><Link key={order.id} href={`/orders/${order.id}` as never} className="grid gap-3 border-b border-[#e8ebe6] p-4 last:border-0 hover:bg-[#fafbf8] sm:grid-cols-[1fr_auto]"><div><p className="text-[8px] font-bold uppercase tracking-[.08em] text-[#89928a]">{merchantById.get(order.merchantId)?.name} · {storeById.get(order.storeId)?.name}</p><p className="mt-1 text-[12px] font-bold">{order.name} · {order.customerName}</p><p className="mt-1 text-[9px] text-[#6f7a72]">{priority.reasons.slice(0,2).join(" · ")}</p></div><div className="flex items-center gap-3 sm:text-right"><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold uppercase ${priority.band==="critical"?"bg-[#fee8e1] text-[#a7442d]":priority.band==="high"?"bg-[#fff0de] text-[#98601e]":"bg-[#edf1ec] text-[#59675e]"}`}>{priority.band}</span><span className="font-mono text-[10px]">P{priority.score}</span></div></Link>)}{!prioritized.length&&<p className="p-5 text-[10px] text-[#758077]">No open orders are available.</p>}</div></section>
        <section><div className="mb-3 flex items-end justify-between"><div><p className="small-caps text-[8px] font-bold text-[#8b948c]">Merchant backlogs</p><h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">Where capacity is needed</h2></div><Link href="/merchants" className="text-[9px] font-bold text-[#a64f34]">All merchants →</Link></div><div className="space-y-2">{backlogs.slice(0,5).map(backlog=><Link key={backlog.merchantId} href={`/merchants/${backlog.merchantId}` as never} className="flex items-center justify-between rounded-[16px] border border-[#dfe2dc] bg-[#fffefa] p-4"><div><p className="text-[10px] font-bold">{merchantById.get(backlog.merchantId)?.name}</p><p className="mt-1 text-[8px] text-[#7f8881]">{storeById.get(backlog.storeId)?.name} · oldest {ageLabel(backlog.oldestOrderHours)}</p></div><div className="text-right"><p className="text-[16px] font-bold">{backlog.openOrders}</p><p className={`text-[8px] ${backlog.backlogChange>0?"text-[#a95337]":"text-[#7d867f]"}`}>{backlog.backlogChange>=0?"+":""}{backlog.backlogChange} vs prior</p></div></Link>)}</div></section>
      </div>
      <section className="mt-7"><div className="mb-3 flex items-end justify-between"><div><p className="small-caps text-[8px] font-bold text-[#8b948c]">Inventory constraints</p><h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">Risks that could prevent fulfilment</h2></div><Link href="/inventory" className="text-[9px] font-bold text-[#a64f34]">Open inventory →</Link></div><div className="grid gap-3 md:grid-cols-3">{constraints.length?constraints.map(alert=><AlertCard key={alert.id} alert={alert} compact/>):<div className="rounded-[18px] border border-dashed border-[#d6dbd5] bg-[#faf9f5] p-5 text-[10px] text-[#758077] md:col-span-3">No open order has a same-store inventory shortfall.</div>}</div></section>
      <section className="mt-7 rounded-[20px] border border-[#e0e3dd] bg-[#fbfaf6] p-5"><p className="small-caps text-[8px] font-bold text-[#8b948c]">Read-only operator workspace</p><p className="mt-2 max-w-[850px] text-[11px] leading-5 text-[#657067]">StoreOps Copilot recommends review steps but never modifies orders, inventory, fulfilments, payments, or customer records. Merchant and store boundaries remain visible for every operator decision.</p></section>
    </main>
  </AppShell>;
}
