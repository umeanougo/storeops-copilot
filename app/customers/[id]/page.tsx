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
export default async function CustomerPage({params}:{params:Promise<{id:string}>}){const[result,{id}]=await Promise.all([getStoreResult(),params]);const s=result.snapshot;const customer=s.customers.find(item=>item.id===id);if(!customer)notFound();const alerts=detectAlerts(s,DEFAULT_THRESHOLDS).filter(alert=>alert.recordId===id||alert.supportingData.some(item=>item.recordId===id));const orders=s.orders.filter(order=>order.customerId===id);return <AppShell source={s.source} storeName={s.shop.name} warning={result.liveError}><main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Link href="/customers" className="inline-flex items-center gap-2 text-[9px] font-bold text-[#68736b]"><ArrowLeft size={12}/>All customers</Link><p className="small-caps mt-6 text-[8px] font-bold text-[#828c84]">Customer record</p><h1 className="mt-2 text-[32px] font-bold tracking-[-.05em]">{customer.name}</h1><p className="mt-2 text-[10px] text-[#6b756e]">Synthetic demo identity · no real personal information</p><div className="mt-6 space-y-4"><DetailSection eyebrow="Customer facts" title="Recorded relationship"><FactGrid facts={[{label:"Lifetime value",value:formatMoney(customer.lifetimeValue.amount,customer.lifetimeValue.currencyCode)},{label:"Lifetime orders",value:String(customer.ordersCount)},{label:"Available orders",value:String(orders.length)},{label:"Tags",value:customer.tags.join(", ")||"None"}]}/></DetailSection>{alerts.map(alert=><AlertCard key={alert.id} alert={alert}/>)}</div></main></AppShell>}
