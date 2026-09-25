import { Radar } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#234d3d] text-[#f4d274]"><Radar size={18} strokeWidth={2.2}/></span>{!compact&&<div><p className="text-[16px] font-bold tracking-[-.035em]">StoreOps</p><p className="mt-[-3px] text-[9px] font-bold tracking-[.14em] text-[#808980]">COPILOT</p></div>}</div>;
}
