import Link from "next/link";
import { ArrowRight, Boxes, CircleDollarSign, PackageCheck, RotateCcw, ShoppingBag } from "lucide-react";
import { getStoreResult } from "@/lib/data/store";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { detectAlerts } from "@/lib/domain/alerts";
import { calculateMetrics, topSellingProducts } from "@/lib/domain/metrics";
import { formatMoney } from "@/lib/domain/format";
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
  const brief = createFallbackBrief(snapshot, alerts, metrics);
  const overdue = alerts.filter(alert => alert.issueType === "overdue_order").slice(0, 2);
  const inventory = alerts.filter(alert => alert.issueType === "low_inventory" || alert.issueType === "excess_inventory").slice(0, 3);
  const topProducts = topSellingProducts(snapshot, 3);
  return <AppShell source={snapshot.source} storeName={snapshot.shop.name} warning={result.liveError}>
    <main className="mx-auto max-w-[1260px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader eyebrow={`As of ${new Date(snapshot.generatedAt).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric",timeZone:snapshot.shop.timezone})}`} title="What needs attention today?" description="A focused view of fulfilment, inventory, customer, and refund signals—ranked by transparent operational rules." action={<Link href="/ask" className="inline-flex items-center gap-2 rounded-xl bg-[#1f2923] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#304038]">Ask your store <ArrowRight size={13}/></Link>}/>
      <div className="mt-6"><SourceBanner result={result}/></div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard icon={ShoppingBag} label="Orders · 7 days" value={String(metrics.orders7d)} note="Received"/><MetricCard icon={CircleDollarSign} label="Order value · 7 days" value={formatMoney(metrics.revenue7d.amount,metrics.revenue7d.currencyCode)} note="Gross" tone="good"/><MetricCard icon={PackageCheck} label="Overdue paid orders" value={String(metrics.overdueOrders)} note={`>${DEFAULT_THRESHOLDS.overdueHours}h`} tone="attention"/><MetricCard icon={Boxes} label="Inventory signals" value={String(metrics.lowStockVariants+metrics.excessInventoryVariants)} note="Rule-based" tone="attention"/></div>
      <div className="mt-5"><DailyBriefCard initial={brief}/></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section><div className="mb-3 flex items-end justify-between"><div><p className="small-caps text-[8px] font-bold text-[#8b948c]">Priority queue</p><h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">Orders requiring attention</h2></div><Link href="/orders" className="text-[9px] font-bold text-[#a64f34]">View all orders →</Link></div><div className="grid gap-3 sm:grid-cols-2">{overdue.length ? overdue.map(alert=><AlertCard key={alert.id} alert={alert}/>) : <EmptyPanel message="No orders cross the current overdue rule in the available data."/>}</div></section>
        <section className="rounded-[20px] border border-[#dfe2dc] bg-[#fffefa] p-5"><div className="flex items-center justify-between"><div><p className="small-caps text-[8px] font-bold text-[#8b948c]">Recent performance</p><h2 className="mt-1 text-[15px] font-bold">Top-selling products</h2><p className="mt-1 text-[8px] text-[#8a938c]">Recorded line-item value · available 30-day window</p></div><RotateCcw size={14} className="text-[#929a93]"/></div><div className="mt-5 space-y-4">{topProducts.length ? topProducts.map((product,index)=><div key={product.id} className="flex items-center gap-3"><span className="font-mono text-[9px] text-[#a0a7a1]">0{index+1}</span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{product.title}</p><p className="mt-0.5 text-[9px] text-[#879089]">{product.unitsSold30d} units · 30 days</p></div><span className="text-[10px] font-bold">{formatMoney(product.revenue30d,snapshot.shop.currencyCode)}</span></div>) : <p className="text-[10px] leading-5 text-[#758077]">No product line items are available for this window.</p>}</div></section>
      </div>
      <section className="mt-7"><div className="mb-3 flex items-end justify-between"><div><p className="small-caps text-[8px] font-bold text-[#8b948c]">Merchandising</p><h2 className="mt-1 text-[17px] font-bold tracking-[-.03em]">Inventory risks</h2></div><Link href="/inventory" className="text-[9px] font-bold text-[#a64f34]">Open inventory →</Link></div><div className="grid gap-3 md:grid-cols-3">{inventory.length ? inventory.map(alert=><AlertCard key={alert.id} alert={alert} compact/>) : <EmptyPanel message="No variants cross the current low- or excess-inventory rules."/>}</div></section>
      <section className="mt-7 rounded-[20px] border border-[#e0e3dd] bg-[#fbfaf6] p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="small-caps text-[8px] font-bold text-[#8b948c]">Recommended actions</p><p className="mt-2 max-w-[700px] text-[11px] leading-5 text-[#657067]">The product suggests review steps, but never modifies orders, inventory, refunds, or customer records. Every action stays with the merchant.</p></div>{alerts[0] ? <Link href={`/issues/${alerts[0].id}` as never} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#cfd5ce] bg-white px-4 py-2.5 text-[9px] font-bold">Review highest priority <ArrowRight size={12}/></Link> : <span className="rounded-xl border border-[#d7ddd6] bg-white px-4 py-2.5 text-[9px] font-bold text-[#6c776f]">No rule-based action right now</span>}</div></section>
    </main>
  </AppShell>;
}

function EmptyPanel({message}:{message:string}) {
  return <div className="rounded-[18px] border border-dashed border-[#d6dbd5] bg-[#faf9f5] p-5 text-[10px] leading-5 text-[#758077] sm:col-span-2 md:col-span-3">{message}</div>;
}
