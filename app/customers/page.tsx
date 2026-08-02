import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getStoreResult } from "@/lib/data/store";
import { formatMoney } from "@/lib/domain/format";

export const dynamic = "force-dynamic";
export default async function CustomersPage() {
  const result=await getStoreResult(); const s=result.snapshot; const customers=[...s.customers].sort((a,b)=>b.lifetimeValue.amount-a.lifetimeValue.amount);
  return <AppShell source={s.source} storeName={s.shop.name} warning={result.liveError}><main className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Store records" title="Customers" description="Lifetime value and order history are descriptive signals. They do not authorize automated outreach or account changes."/>{customers.length===0&&<div className="mt-6"><EmptyState title="No customers are available" body="The current data source returned no customer records. Check customer access or continue with demo mode."/></div>}<div className="mt-6 grid gap-3 sm:grid-cols-2">{customers.map((customer,index)=><Link key={customer.id} href={`/customers/${customer.id}` as never} className="flex items-center gap-4 rounded-[18px] border border-[#dfe2dc] bg-[#fffefa] p-4 hover:border-[#b9c4bb]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e9eee8] text-[11px] font-bold text-[#496052]">{customer.name.split(" ").map(part=>part[0]).join("")}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-bold">{customer.name}</p><p className="mt-0.5 text-[8px] text-[#858e87]">{customer.ordersCount} lifetime orders</p></div><div className="text-right"><p className="text-[11px] font-bold">{formatMoney(customer.lifetimeValue.amount,customer.lifetimeValue.currencyCode)}</p><p className="mt-0.5 text-[8px] text-[#858e87]">#{index+1} by value</p></div></Link>)}</div></main></AppShell>;
}
