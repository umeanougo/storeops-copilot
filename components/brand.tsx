import { Radar } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#244f40] text-[#f9d77d]"><Radar size={18} strokeWidth={2.2}/></span>{!compact&&<div><p className="text-[15px] font-bold tracking-[-.03em]">StoreOps</p><p className="mt-[-3px] text-[10px] font-medium tracking-[.08em] text-[#768078]">COPILOT</p></div>}</div>;
}
