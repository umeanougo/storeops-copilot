import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DetailSection, FactGrid } from "@/components/detail-section";
import { AlertCard } from "@/components/alert-card";
import { getStoreResult } from "@/lib/data/store";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { formatMoney } from "@/lib/domain/format";

export const dynamic="force-dynamic";
export default async function VariantPage({params}:{params:Promise<{id:string}>}){const[result,{id}]=await Promise.all([getStoreResult(),params]);const s=result.snapshot;const variant=s.products.flatMap(product=>product.variants).find(item=>item.id===id);if(!variant)notFound();const alerts=detectAlerts(s,DEFAULT_THRESHOLDS).filter(alert=>alert.recordId===id);return <AppShell source={s.source} storeName={s.shop.name} warning={result.liveError}><main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Link href="/inventory" className="inline-flex items-center gap-2 text-[9px] font-bold text-[#68736b]"><ArrowLeft size={12}/>All inventory</Link><p className="small-caps mt-6 text-[8px] font-bold text-[#828c84]">Variant record</p><h1 className="mt-2 text-[32px] font-bold tracking-[-.05em]">{variant.productTitle}</h1><p className="mt-2 text-[11px] text-[#6b756e]">{variant.title} · {variant.sku}</p><div className="mt-6 space-y-4"><DetailSection eyebrow="Inventory facts" title="Current variant"><FactGrid facts={[{label:"Available",value:`${variant.available} units`},{label:"Sold · 7 days",value:`${variant.unitsSold7d} units`},{label:"Sold · 30 days",value:`${variant.unitsSold30d} units`},{label:"Unit price",value:formatMoney(variant.price.amount,variant.price.currencyCode)}]}/></DetailSection>{alerts.map(alert=><AlertCard key={alert.id} alert={alert}/>)}</div></main></AppShell>}
