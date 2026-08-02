"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import type { DailyBrief } from "@/lib/domain/brief";

export function DailyBriefCard({ initial }: { initial: DailyBrief }) {
  const [brief, setBrief] = useState(initial);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/brief", { method: "POST" }).then(async response => {
      if (!response.ok) throw new Error("Brief unavailable");
      const data = await response.json(); if (active) setBrief(data);
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <section className="overflow-hidden rounded-[22px] border border-[#d8ded7] bg-[#244f40] text-white panel-shadow" aria-labelledby="daily-brief-heading" aria-live="polite">
    <div className="grid xl:grid-cols-[.82fr_1.18fr]">
      <div className="border-b border-white/10 p-5 sm:p-6 xl:border-b-0 xl:border-r"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.13em] text-[#c4d7ca]"><Sparkles size={13} className="text-[#f2d477]"/>AI-assisted operations brief</div><span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[8px] text-[#bdd0c4]">{loading ? "Refreshing…" : brief.generatedBy === "openai" ? "AI-constrained" : "Rule-generated"}</span></div><h2 id="daily-brief-heading" className="mt-6 max-w-[430px] text-[25px] font-bold leading-[1.12] tracking-[-.045em]">{brief.headline}</h2><p className="mt-3 max-w-[470px] text-[11px] leading-5 text-[#c0d0c5]">{brief.summary}</p><div className="mt-5 grid gap-2"><BriefFact label="Blocked or at risk" value={brief.blockedSummary}/><BriefFact label="Inventory constraints" value={brief.inventorySummary}/><BriefFact label="What changed" value={brief.changeSummary}/></div><p className="mt-5 text-[9px] leading-4 text-[#9fb5a7]">{brief.caveat}</p></div>
      <div className="p-5 sm:p-6"><p className="small-caps mb-4 text-[8px] font-bold text-[#9fb5a7]">Immediate priorities</p><div className="space-y-2.5">{brief.priorities.map((priority,index)=><Link key={priority.alertId} href={`/issues/${priority.alertId}` as never} className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.06] p-3 transition hover:bg-white/[.1]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f2d477] text-[9px] font-bold text-[#244f40]">{index+1}</span><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[.08em] text-[#9fb5a7]">{priority.merchantName} · {priority.storeName}</p><p className="mt-1 text-[10px] font-bold">{priority.label}</p><p className="mt-1 line-clamp-1 text-[9px] text-[#afc2b6]">{priority.nextStep}</p></div><ArrowRight className="ml-auto mt-1 shrink-0 text-[#afc2b6] group-hover:text-white" size={12}/></Link>)}{brief.priorities.length===0&&<div className="flex items-center gap-2 rounded-xl bg-white/[.06] p-4 text-[10px] text-[#c3d2c8]"><CheckCircle2 size={15}/>No configured rules triggered.</div>}</div><p className="small-caps mb-3 mt-6 text-[8px] font-bold text-[#9fb5a7]">Merchant backlogs</p><div className="grid gap-2 sm:grid-cols-2">{brief.merchantBacklogs.map(item=><Link key={item.merchantId} href={`/merchants/${item.merchantId}` as never} className="rounded-xl border border-white/10 bg-white/[.04] p-3"><p className="text-[9px] font-bold">{item.merchantName}</p><p className="mt-1 text-[8px] text-[#a9beb1]">{item.openOrders} open · {item.change>=0?"+":""}{item.change} · {item.risk}</p></Link>)}</div></div>
    </div>
  </section>;
}

function BriefFact({label,value}:{label:string;value:string}) { return <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><p className="text-[8px] font-bold uppercase tracking-[.08em] text-[#9fb5a7]">{label}</p><p className="mt-1 text-[9px] leading-4 text-[#d4dfd8]">{value}</p></div>; }
