import { FlaskConical, PlugZap } from "lucide-react";
import type { StoreResult } from "@/lib/data/store";

export function SourceBanner({ result }: { result: StoreResult }) {
  const demo = result.snapshot.source === "demo";
  return <div className={`flex flex-col justify-between gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center ${demo ? "border-[#edd7c9] bg-[#fff7f1]" : "border-[#cee1d3] bg-[#f0f7f1]"}`} role="status"><div className="flex items-start gap-3">{demo?<FlaskConical className="mt-0.5 text-[#b85d3d]" size={16}/>:<PlugZap className="mt-0.5 text-[#3d7350]" size={16}/>}<div><p className="text-[11px] font-bold">{demo ? "Demo mode · simulated records" : "Live mode · Shopify development store"}</p><p className="mt-0.5 text-[10px] leading-4 text-[#6e7770]">{demo ? "Safe portfolio data. No real customers, orders, or products are shown." : "Read-only records retrieved server-side."}</p></div></div>{result.liveError&&<span className="rounded-lg bg-white px-3 py-1.5 text-[9px] font-semibold text-[#9b5239]">Live connection unavailable · demo fallback active</span>}</div>;
}
