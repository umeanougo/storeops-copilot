import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, Calculator, Database, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DetailSection, FactGrid } from "@/components/detail-section";
import { SeverityBadge } from "@/components/severity";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts, getAlertById } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

export const dynamic = "force-dynamic";
export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const [result,{id}]=await Promise.all([getStoreResult(),params]); const s=result.snapshot; const alerts=detectAlerts(s,DEFAULT_THRESHOLDS); const alert=getAlertById(alerts,id); if(!alert) notFound();
  return <AppShell source={s.source} storeName={s.shop.name} warning={result.liveError}><main className="mx-auto max-w-[980px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Link href="/" className="inline-flex items-center gap-2 text-[9px] font-bold text-[#68736b]"><ArrowLeft size={12}/>Back to overview</Link><div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={alert.severity}/><span className="rounded-full border border-[#dce0da] bg-white px-2.5 py-1 font-mono text-[8px] text-[#69736c]">Priority {alert.priorityScore}/100</span></div><h1 className="mt-4 max-w-[720px] text-[30px] font-bold leading-[1.1] tracking-[-.05em]">{alert.title}</h1><p className="mt-3 max-w-[720px] text-[11px] leading-5 text-[#69736c]">{alert.detected}</p></div><Link href={alert.recordLink as never} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1f2923] px-4 py-2.5 text-[9px] font-bold text-white">Open source record <ArrowRight size={12}/></Link></div>
    <div className="mt-7 space-y-4">
      <DetailSection eyebrow="1 · Store data" title="Supporting data" description="These values come from normalized source records. The language model does not calculate or replace them."><FactGrid facts={alert.supportingData.map(item=>({label:item.label,value:item.value}))}/><div className="mt-4 flex items-center gap-2 text-[8px] text-[#7b857d]"><Database size={11}/>Record: {alert.recordType} · {alert.recordId}</div></DetailSection>
      <DetailSection eyebrow="2 · Detected by rule" title="Why this was flagged" description={alert.why} tone="rule"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white/80 p-4"><div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.09em] text-[#607067]"><Calculator size={12}/>Rule</div><p className="mt-2 text-[10px] leading-5">{alert.rule}</p></div><div className="rounded-xl bg-white/80 p-4"><div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.09em] text-[#607067]"><ShieldCheck size={12}/>Threshold used</div><p className="mt-2 text-[10px] leading-5">{alert.threshold}</p></div></div><p className="mt-4 text-[8px] text-[#708078]">Severity and priority are assigned by deterministic logic, not by AI.</p></DetailSection>
      <DetailSection eyebrow="3 · Suggested next step" title="A review step, not an automated action" tone="suggestion"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#9b5931]"><Bot size={15}/></span><div><p className="text-[11px] font-semibold leading-5">{alert.recommendedAction}</p><p className="mt-2 text-[8px] leading-4 text-[#81786d]">Recommendations are generated from available store data and should be reviewed before action. StoreOps Copilot cannot modify Shopify records.</p></div></div></DetailSection>
    </div></main></AppShell>;
}
