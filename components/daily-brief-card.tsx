"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import type { DailyBrief } from "@/lib/domain/brief";

export function DailyBriefCard({ initial }: { initial: DailyBrief }) {
  const [brief, setBrief] = useState(initial);

  useEffect(() => {
    let active = true;
    fetch("/api/brief", { method: "POST" }).then(async response => {
      if (!response.ok) throw new Error("Brief unavailable");
      const data = await response.json();
      if (active) setBrief(data);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  return <section className="overflow-hidden rounded-[22px] bg-[#234d3d] text-white panel-shadow" aria-labelledby="daily-brief-heading" aria-live="polite">
    <div className="grid lg:grid-cols-[.78fr_1.22fr]">
      <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#c4d7ca]"><Sparkles size={14} className="text-[#f2d477]" />Operations brief</div><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[#bdd0c4]">{brief.generatedBy === "openai" ? "Validated model output" : "Deterministic brief"}</span></div>
        <h2 id="daily-brief-heading" className="mt-6 max-w-[440px] text-[26px] font-bold leading-[1.12] tracking-[-.045em]">{brief.headline}</h2>
        <p className="mt-3 max-w-[470px] text-[13px] leading-6 text-[#c7d5cc]">{brief.summary}</p>
        <div className="mt-6 space-y-3 border-t border-white/10 pt-5"><BriefLine label="Blocked" value={brief.blockedSummary}/><BriefLine label="Inventory" value={brief.inventorySummary}/><BriefLine label="Change" value={brief.changeSummary}/></div>
        <p className="mt-5 text-[11px] leading-5 text-[#aebfb4]">{brief.caveat}</p>
      </div>
      <div className="p-6 lg:p-7">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[.13em] text-[#9fb5a7]">Start here</p>
        <div className="space-y-3">{brief.priorities.map((priority, index) => <Link key={priority.alertId} href={`/issues/${priority.alertId}` as never} className="group grid grid-cols-[30px_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-white/10 bg-white/[.055] p-4 transition hover:bg-white/[.1]"><span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#f2d477] text-[11px] font-bold text-[#234d3d]">{index + 1}</span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#9fb5a7]">{priority.merchantName} · {priority.storeName}</p><p className="mt-1.5 text-[13px] font-semibold">{priority.label}</p><p className="mt-1 text-[12px] leading-5 text-[#b9cbbf]">{priority.nextStep}</p></div><ArrowRight className="mt-1 text-[#afc2b6] transition group-hover:translate-x-0.5 group-hover:text-white" size={14}/></Link>)}{brief.priorities.length === 0 && <div className="flex items-center gap-2 rounded-2xl bg-white/[.06] p-4 text-[12px] text-[#c3d2c8]"><CheckCircle2 size={16}/>No configured rules triggered.</div>}</div>
      </div>
    </div>
  </section>;
}

function BriefLine({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[72px_1fr] gap-3"><p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#9fb5a7]">{label}</p><p className="text-[12px] leading-5 text-[#d4dfd8]">{value}</p></div>;
}
