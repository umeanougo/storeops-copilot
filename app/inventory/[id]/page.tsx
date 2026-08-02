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
export default async function VariantPage({params}:{params:Promise<{id:string}>}){const[result,{id}]=await Promise.all([getStoreResult(),params]);const s=result.snapshot;const variant=s.products.flatMap(product=>product.variants).find(item=>item.id===id);if(!variant)notFound();const merchant=s.merchants.find(item=>item.id===variant.merchantId)!;const store=s.stores.find(item=>item.id===variant.storeId)!;const alerts=detectAlerts(s,DEFAULT_THRESHOLDS).filter(alert=>alert.supportingData.some(item=>item.recordId===id));const affectedOrders=s.orders.filter(order=>order.merchantId===variant.merchantId&&order.storeId===variant.storeId&&order.fulfillmentStatus!=="FULFILLED"&&order.lineItems.some(item=>item.variantId===id));return <AppShell source={s.source} storeName={s.provider.name} storeCount={s.stores.length} warning={result.liveError}><main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Link href="/inventory" className="inline-flex items-center gap-2 text-[9px] font-bold text-[#68736b]"><ArrowLeft size={12}/>All inventory</Link><p className="small-caps mt-6 text-[8px] font-bold text-[#828c84]">{merchant.name} · {store.name}</p><h1 className="mt-2 text-[32px] font-bold tracking-[-.05em]">{variant.productTitle}</h1><p className="mt-2 text-[11px] text-[#6b756e]">{variant.title} · {variant.sku}</p><div className="mt-6 space-y-4"><DetailSection eyebrow="Inventory facts" title="Current same-store variant"><FactGrid facts={[{label:"Merchant",value:merchant.name},{label:"Client store",value:store.name},{label:"Available",value:`${variant.available} units`},{label:"Open orders using variant",value:String(affectedOrders.length)},{label:"Sold · 7 days",value:`${variant.unitsSold7d} units`},{label:"Sold · 30 days",value:`${variant.unitsSold30d} units`},{label:"Unit price",value:formatMoney(variant.price.amount,variant.price.currencyCode)},{label:"Connection",value:store.connectionStatus}]}/></DetailSection>{alerts.map(alert=><AlertCard key={alert.id} alert={alert}/>)}</div></main></AppShell>}
