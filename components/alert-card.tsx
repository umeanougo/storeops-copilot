import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { OperationalAlert } from "@/lib/domain/types";
import { SeverityBadge } from "./severity";

export function AlertCard({ alert, compact = false }: { alert: OperationalAlert; compact?: boolean }) {
  const merchant=alert.supportingData.find(item=>item.label==="Merchant")?.value;
  const store=alert.supportingData.find(item=>item.label==="Client store")?.value;
  return <Link href={`/issues/${alert.id}` as never} className="group block rounded-2xl border border-[#e0e3dd] bg-[#fffefa] p-4 transition hover:-translate-y-0.5 hover:border-[#bbc5bc] hover:shadow-[0_12px_35px_rgba(30,45,35,.07)]"><div className="flex items-start justify-between gap-3"><SeverityBadge severity={alert.severity}/><span className="font-mono text-[9px] text-[#89928b]">P{alert.priorityScore}</span></div>{(merchant||store)&&<p className="mt-3 text-[8px] font-bold uppercase tracking-[.08em] text-[#8b948d]">{merchant}{merchant&&store?" · ":""}{store}</p>}<h3 className="mt-2 text-[13px] font-bold tracking-[-.02em]">{alert.title}</h3><p className={`mt-1.5 text-[10px] leading-5 text-[#69736c] ${compact ? "line-clamp-2" : ""}`}>{alert.detected}</p><div className="mt-3 flex items-center justify-between border-t border-[#eceeea] pt-3"><span className="text-[9px] font-semibold text-[#7b857d]">Why this was flagged</span><ArrowUpRight size={13} className="text-[#9aa19b] transition group-hover:text-[#c95a36]"/></div></Link>;
}
