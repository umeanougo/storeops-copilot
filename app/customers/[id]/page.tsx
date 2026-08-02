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
export default async function CustomerPage({params}:{params:Promise<{id:string}>}){const[result,{id}]=await Promise.all([getStoreResult(),params]);const s=result.snapshot;const customer=s.customers.find(item=>item.id===id);if(!customer)notFound();const merchant=s.merchants.find(item=>item.id===customer.merchantId)!;const store=s.stores.find(item=>item.id===customer.storeId)!;const alerts=detectAlerts(s,DEFAULT_THRESHOLDS).filter(alert=>alert.merchantId===customer.merchantId&&alert.storeId===customer.storeId&&alert.supportingData.some(item=>item.recordId===id));const orders=s.orders.filter(order=>order.customerId===id&&order.merchantId===customer.merchantId&&order.storeId===customer.storeId);return <AppShell source={s.source} storeName={s.provider.name} storeCount={s.stores.length} warning={result.liveError}><main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Link href="/customers" className="inline-flex items-center gap-2 text-[9px] font-bold text-[#68736b]"><ArrowLeft size={12}/>Supporting customer records</Link><p className="small-caps mt-6 text-[8px] font-bold text-[#828c84]">{merchant.name} · {store.name}</p><h1 className="mt-2 text-[32px] font-bold tracking-[-.05em]">{customer.name}</h1><p className="mt-2 text-[10px] text-[#6b756e]">Synthetic identity · no real personal information · value scoped to this client store</p><div className="mt-6 space-y-4"><DetailSection eyebrow="Customer facts" title="Same-store relationship"><FactGrid facts={[{label:"Merchant",value:merchant.name},{label:"Client store",value:store.name},{label:"Lifetime value",value:formatMoney(customer.lifetimeValue.amount,customer.lifetimeValue.currencyCode)},{label:"Lifetime orders",value:String(customer.ordersCount)},{label:"Available orders",value:String(orders.length)},{label:"Tags",value:customer.tags.join(", ")||"None"}]}/></DetailSection>{alerts.map(alert=><AlertCard key={alert.id} alert={alert}/>)}</div></main></AppShell>}
