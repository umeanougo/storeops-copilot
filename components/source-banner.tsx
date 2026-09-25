import { FlaskConical, PlugZap } from "lucide-react";
import type { StoreResult } from "@/lib/data/store";

export function SourceBanner({ result }: { result: StoreResult }) {
  const demo = result.snapshot.source === "demo";
  return <div className={`flex flex-col justify-between gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center ${demo ? "border-[#eadbd1] bg-[#fffaf7]" : "border-[#d4e2d6] bg-[#f5faf6]"}`} role="status"><div className="flex items-center gap-2.5">{demo?<FlaskConical className="text-[#b85d3d]" size={14}/>:<PlugZap className="text-[#3d7350]" size={14}/>}<p className="text-[12px] text-[#667169]"><span className="font-semibold text-[var(--ink)]">{demo ? "Simulated portfolio data" : "Live Shopify data"}</span><span className="mx-2 text-[#bbc0bb]">·</span>{demo ? `${result.snapshot.merchants.length} merchants · ${result.snapshot.stores.length} stores · no real records` : `${result.snapshot.stores.length} read-only store connection${result.snapshot.stores.length===1?"":"s"}`}</p></div>{result.liveError&&<span className="text-[11px] font-semibold text-[#9b5239]">Live unavailable · demo fallback active</span>}</div>;
}
