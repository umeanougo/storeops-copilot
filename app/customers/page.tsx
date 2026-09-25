import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { getStoreResult } from "@/lib/data/store";
import { formatMoney } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const result = await getStoreResult();
  const snapshot = result.snapshot;
  const merchantById = new Map(snapshot.merchants.map(item => [item.id, item]));
  const storeById = new Map(snapshot.stores.map(item => [item.id, item]));

  return <AppShell source={snapshot.source} storeName={snapshot.provider.name} storeCount={snapshot.stores.length} warning={result.liveError}>
    <main className="mx-auto max-w-[1100px] px-4 py-7 sm:px-7 lg:px-9 lg:py-10">
      <PageHeader eyebrow="Supporting records" title="Customers within each store" description={`${snapshot.source === "demo" ? "Synthetic customer" : "Customer"} history and value stay inside one merchant and store boundary. Records are used only to explain order-priority rules.`} />
      <div className="mt-6"><SourceBanner result={result} /></div>
      <div className="mt-7 flex items-center justify-between"><h2 className="text-base font-bold">Customer records</h2><p className="text-sm text-[#758078]">{snapshot.customers.length} total</p></div>
      <section className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Customer records">
        {snapshot.customers.map(customer => <Link key={customer.id} href={`/customers/${customer.id}` as never} className="group flex items-center gap-4 rounded-[18px] border border-[var(--line)] bg-white p-5 transition hover:border-[#b9c4bb] hover:shadow-[0_10px_30px_rgba(30,45,35,.05)]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e9eee8] text-sm font-bold text-[#496052]">{customer.name.split(" ").map(part => part[0]).join("")}</span>
          <div className="min-w-0 flex-1"><p className="text-sm font-bold">{customer.name}</p><p className="mt-1 truncate text-xs text-[#758078]">{merchantById.get(customer.merchantId)?.name} · {storeById.get(customer.storeId)?.name}</p></div>
          <div className="shrink-0 text-right"><p className="text-sm font-bold">{formatMoney(customer.lifetimeValue.amount, customer.lifetimeValue.currencyCode)}</p><p className="mt-1 text-xs text-[#758078]">{customer.ordersCount} store orders</p></div>
          <ArrowUpRight size={14} className="shrink-0 text-[#9aa39c] transition group-hover:text-[#a95337]" />
        </Link>)}
      </section>
    </main>
  </AppShell>;
}
