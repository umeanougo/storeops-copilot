import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { OperationalAlert } from "@/lib/domain/types";
import { SeverityBadge } from "./severity";

export function AlertCard({ alert, compact = false }: { alert: OperationalAlert; compact?: boolean }) {
  const merchant=alert.supportingData.find(item=>item.label==="Merchant")?.value;
  const store=alert.supportingData.find(item=>item.label==="Client store")?.value;
  const title=merchant?alert.title.replace(`${merchant} · `,""):alert.title;
  return <Link href={`/issues/${alert.id}` as never} className="group block rounded-[18px] border border-[var(--line)] bg-white p-5 transition hover:border-[#b8c4ba] hover:shadow-[0_10px_30px_rgba(30,45,35,.06)]"><div className="flex items-start justify-between gap-3"><SeverityBadge severity={alert.severity}/><span className="font-mono text-[11px] text-[#667169]">P{alert.priorityScore}</span></div>{(merchant||store)&&<p className="mt-4 text-[10px] font-bold uppercase tracking-[.08em] text-[#68736b]">{merchant}{merchant&&store?" · ":""}{store}</p>}<h3 className="mt-2 text-[15px] font-bold tracking-[-.02em]">{title}</h3><p className={`mt-2 text-[13px] leading-5 text-[#667169] ${compact ? "line-clamp-2" : ""}`}>{alert.detected}</p><div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3"><span className="text-[12px] font-semibold text-[#667169]">View explanation</span><ArrowUpRight size={14} className="text-[#8c968e] transition group-hover:text-[#b64d2f]"/></div></Link>;
}
