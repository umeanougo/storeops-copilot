"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Filter, RotateCcw, Search } from "lucide-react";
import type { FinancialState, FulfillmentState } from "@/lib/domain/types";
import { ageLabel, formatDateTime, formatMoney, hoursBetween } from "@/lib/domain/format";

export type QueueRow = {
  id: string;
  merchantId: string;
  merchantName: string;
  storeId: string;
  storeName: string;
  orderName: string;
  createdAt: string;
  customerName: string;
  financialStatus: FinancialState;
  fulfillmentStatus: FulfillmentState;
  lineItemCount: number;
  itemQuantity: number;
  totalAmount: number;
  currencyCode: string;
  isOpen: boolean;
  isCancelled: boolean;
  priorityScore: number;
  priorityBand: string;
  exceptionTypes: string[];
  recommendedAction: string;
};

export function UnifiedOrderQueue({ rows, generatedAt, timezone, initialMerchant = "all", initialStore = "all" }: { rows: QueueRow[]; generatedAt: string; timezone: string; initialMerchant?: string; initialStore?: string }) {
  const [query, setQuery] = useState("");
  const [merchant, setMerchant] = useState(initialMerchant);
  const [store, setStore] = useState(initialStore);
  const [payment, setPayment] = useState("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [age, setAge] = useState("all");
  const [priority, setPriority] = useState("all");
  const [exception, setException] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [sort, setSort] = useState("priority");
  const [scope, setScope] = useState("open");

  const merchants = [...new Map(rows.map(row => [row.merchantId, row.merchantName])).entries()];
  const stores = [...new Map(rows.filter(row => merchant === "all" || row.merchantId === merchant).map(row => [row.storeId, row.storeName])).entries()];
  const exceptionTypes = [...new Set(rows.flatMap(row => row.exceptionTypes))].sort();
  const hasSingleCurrency = new Set(rows.map(row => row.currencyCode)).size <= 1;
  const advancedCount = [payment, fulfillment, priority, exception].filter(value => value !== "all").length + (dateRange !== "30d" ? 1 : 0) + (scope !== "open" ? 1 : 0);
  const dirty = Boolean(query) || merchant !== "all" || store !== "all" || age !== "all" || sort !== "priority" || advancedCount > 0;

  const visible = useMemo(() => rows.filter(row => {
    const hours = hoursBetween(generatedAt, row.createdAt);
    const search = query.trim().toLowerCase();
    if (search && ![row.orderName, row.customerName, row.merchantName, row.storeName].some(value => value.toLowerCase().includes(search))) return false;
    if (scope === "open" && !row.isOpen) return false;
    if (merchant !== "all" && row.merchantId !== merchant) return false;
    if (store !== "all" && row.storeId !== store) return false;
    if (payment !== "all" && row.financialStatus !== payment) return false;
    if (fulfillment !== "all" && row.fulfillmentStatus !== fulfillment) return false;
    if (age === "under24" && hours >= 24) return false;
    if (age === "24to48" && (hours < 24 || hours > 48)) return false;
    if (age === "over48" && hours <= 48) return false;
    if (priority !== "all" && row.priorityBand !== priority) return false;
    if (exception !== "all" && !row.exceptionTypes.includes(exception)) return false;
    if (dateRange !== "all" && hours > Number(dateRange.replace("d", "")) * 24) return false;
    return true;
  }).sort((a, b) => sort === "oldest" ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : sort === "newest" ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : sort === "merchant" ? a.merchantName.localeCompare(b.merchantName) : sort === "value" && hasSingleCurrency ? b.totalAmount - a.totalAmount : b.priorityScore - a.priorityScore), [rows, generatedAt, query, scope, merchant, store, payment, fulfillment, age, priority, exception, dateRange, sort, hasSingleCurrency]);

  const reset = () => {
    setQuery(""); setMerchant("all"); setStore("all"); setPayment("all"); setFulfillment("all"); setAge("all"); setPriority("all"); setException("all"); setDateRange("30d"); setSort("priority"); setScope("open");
  };

  return <>
    <section className="mt-7 rounded-[18px] border border-[var(--line)] bg-white p-4 sm:p-5" aria-label="Order queue filters">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2.5"><Filter size={15} className="text-[#657169]"/><h2 className="text-[13px] font-bold">Filter orders</h2><span className="rounded-full bg-[#eef1ed] px-2.5 py-1 text-[11px] font-semibold text-[#59675e]" aria-live="polite">{visible.length} results</span></div><button onClick={reset} disabled={!dirty} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-[12px] font-bold text-[#8a4f3b] hover:bg-[#fff5ef] disabled:cursor-default disabled:opacity-35"><RotateCcw size={13}/>Reset</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.25fr_repeat(4,1fr)]">
        <label className="block"><span className="filter-label">Search</span><span className="relative block"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a938c]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Order, customer, merchant…" className="filter-control pl-9"/></span></label>
        <FilterSelect label="Merchant" value={merchant} onChange={value => { setMerchant(value); setStore("all"); }} options={[["all", "All merchants"], ...merchants]} />
        <FilterSelect label="Store" value={store} onChange={setStore} options={[["all", "All stores"], ...stores]} />
        <FilterSelect label="Order age" value={age} onChange={setAge} options={[["all", "Any age"], ["under24", "Under 24 hours"], ["24to48", "24–48 hours"], ["over48", "Over 48 hours"]]} />
        <FilterSelect label="Sort" value={sort} onChange={setSort} options={[["priority", "Highest priority"], ["oldest", "Oldest order"], ["newest", "Newest order"], ["merchant", "Merchant"], ...(hasSingleCurrency ? [["value", "Order value"]] : [])]} />
      </div>
      <details className="group mt-4 border-t border-[var(--line)] pt-3"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-[12px] font-bold text-[#5f6b63]"><ChevronDown size={14} className="transition group-open:rotate-180"/>More filters{advancedCount > 0 && <span className="rounded-full bg-[#fff0e8] px-2 py-0.5 text-[10px] text-[#985035]">{advancedCount} active</span>}</summary><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><FilterSelect label="View" value={scope} onChange={setScope} options={[["open", "Open orders"], ["all", "All orders"]]} /><FilterSelect label="Payment" value={payment} onChange={setPayment} options={[["all", "All payment states"], ...[...new Set(rows.map(row => row.financialStatus))].map(value => [value, titleCase(value)])]} /><FilterSelect label="Fulfilment" value={fulfillment} onChange={setFulfillment} options={[["all", "All fulfilment states"], ...[...new Set(rows.map(row => row.fulfillmentStatus))].map(value => [value, titleCase(value)])]} /><FilterSelect label="Priority" value={priority} onChange={setPriority} options={[["all", "All priorities"], ["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["routine", "Routine"]]} /><FilterSelect label="Exception" value={exception} onChange={setException} options={[["all", "All exception types"], ...exceptionTypes.map(value => [value, issueLabel(value)])]} /><FilterSelect label="Date range" value={dateRange} onChange={setDateRange} options={[["7d", "Last 7 days"], ["30d", "Last 30 days"], ["all", "All available"]]} /></div></details>
    </section>

    <section className="mt-4 hidden min-w-0 max-w-full overflow-hidden rounded-[18px] border border-[var(--line)] bg-white lg:block"><div className="w-full max-w-full overflow-x-auto"><table className="w-full min-w-[1040px] text-left"><caption className="sr-only">Unified multi-merchant order queue</caption><thead className="sticky top-0 z-10"><tr className="border-b border-[var(--line)] bg-[#fafbf8] text-[11px] uppercase tracking-[.08em] text-[#68736b]"><th scope="col" className="px-4 py-3.5">Merchant / store</th><th scope="col" className="px-4 py-3.5">Order</th><th scope="col" className="px-4 py-3.5">Age</th><th scope="col" className="px-4 py-3.5">Status</th><th scope="col" className="px-4 py-3.5">Items</th><th scope="col" className="px-4 py-3.5">Priority / exceptions</th><th scope="col" className="px-4 py-3.5">Recommended next step</th><th scope="col" className="px-4 py-3.5"><span className="sr-only">Open</span></th></tr></thead><tbody>{visible.map(row => <tr key={row.id} className="border-b border-[var(--line)] align-top last:border-0 hover:bg-[#fbfcfa]"><td className="px-4 py-4"><p className="text-[13px] font-bold">{row.merchantName}</p><p className="mt-1 text-[11px] text-[#758077]">{row.storeName}</p></td><td className="px-4 py-4"><Link href={`/orders/${row.id}` as never} className="text-[14px] font-bold hover:text-[#9d4d34]">{row.orderName}</Link><p className="mt-1 text-[11px] text-[#758077]">{row.customerName} · {formatMoney(row.totalAmount, row.currencyCode)}</p></td><td className="px-4 py-4"><p className="text-[13px] font-semibold text-[#9d4d34]">{ageLabel(hoursBetween(generatedAt, row.createdAt))}</p><p className="mt-1 text-[11px] text-[#758077]">{formatDateTime(row.createdAt, timezone)}</p></td><td className="px-4 py-4"><div className="flex flex-col items-start gap-1.5"><StatusBadge label={titleCase(row.financialStatus)} tone={row.financialStatus === "PAID" ? "good" : "neutral"}/><StatusBadge label={titleCase(row.fulfillmentStatus)} tone={row.fulfillmentStatus === "FULFILLED" ? "good" : row.fulfillmentStatus === "PARTIALLY_FULFILLED" ? "attention" : "neutral"}/></div></td><td className="px-4 py-4 text-[12px] leading-5 text-[#566159]">{row.lineItemCount} line{row.lineItemCount === 1 ? "" : "s"}<br/>{row.itemQuantity} unit{row.itemQuantity === 1 ? "" : "s"}</td><td className="max-w-[190px] px-4 py-4"><PriorityBadge band={row.priorityBand} score={row.priorityScore}/><p className="mt-2 text-[11px] leading-4 text-[#667169]">{row.exceptionTypes.length ? row.exceptionTypes.slice(0, 2).map(issueLabel).join(" · ") : "No exception"}{row.exceptionTypes.length > 2 ? ` +${row.exceptionTypes.length - 2}` : ""}</p></td><td className="max-w-[240px] px-4 py-4 text-[12px] leading-5 text-[#566159]">{row.recommendedAction}</td><td className="px-4 py-4"><Link href={`/orders/${row.id}` as never} aria-label={`Open ${row.merchantName} ${row.orderName}`} className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] text-[#526158] transition hover:border-[#9eada2] hover:bg-[#f5f8f4]"><ArrowRight size={15}/></Link></td></tr>)}</tbody></table>{!visible.length && <EmptyQueue />}</div></section>

    <section className="mt-4 space-y-3 lg:hidden" aria-label="Order results">{visible.map(row => <article key={row.id} className="rounded-[18px] border border-[var(--line)] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-[#758077]">{row.merchantName} · {row.storeName}</p><h3 className="mt-1.5 text-[17px] font-bold">{row.orderName}</h3><p className="mt-1 text-[12px] text-[#667169]">{row.customerName} · {formatMoney(row.totalAmount, row.currencyCode)}</p></div><PriorityBadge band={row.priorityBand} score={row.priorityScore}/></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f8f5] p-3"><MobileFact label="Age" value={ageLabel(hoursBetween(generatedAt, row.createdAt))}/><MobileFact label="Items" value={`${row.itemQuantity} unit${row.itemQuantity === 1 ? "" : "s"}`}/><MobileFact label="Payment" value={titleCase(row.financialStatus)}/><MobileFact label="Fulfilment" value={titleCase(row.fulfillmentStatus)}/></div>{row.exceptionTypes.length > 0 && <p className="mt-3 text-[11px] font-semibold text-[#9d4d34]">{row.exceptionTypes.slice(0, 3).map(issueLabel).join(" · ")}{row.exceptionTypes.length > 3 ? ` +${row.exceptionTypes.length - 3}` : ""}</p>}<p className="mt-3 text-[12px] leading-5 text-[#566159]">{row.recommendedAction}</p><Link href={`/orders/${row.id}` as never} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#234d3d] px-4 text-[13px] font-bold text-white">View order <ArrowRight size={14}/></Link></article>)}{!visible.length && <EmptyQueue />}</section>
  </>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="block"><span className="filter-label">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="filter-control">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function PriorityBadge({ band, score }: { band: string; score: number }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${band === "critical" ? "bg-[#fee8e1] text-[#9f3f29]" : band === "high" ? "bg-[#fff0de] text-[#8a5518]" : "bg-[#edf1ec] text-[#4f5e54]"}`}>{band} · {score}</span>;
}

function StatusBadge({ label, tone }: { label: string; tone: "neutral" | "attention" | "good" }) {
  const style = tone === "good" ? "bg-[#e9f2ea] text-[#356045]" : tone === "attention" ? "bg-[#fff0de] text-[#8a5518]" : "bg-[#eef1ed] text-[#526158]";
  return <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${style}`}>{label}</span>;
}

function MobileFact({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#7b857d]">{label}</p><p className="mt-1 text-[13px] font-semibold">{value}</p></div>;
}

function EmptyQueue() {
  return <div className="p-8 text-center text-[13px] text-[#667169]">No orders match these filters.</div>;
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, character => character.toUpperCase());
}

const ISSUE_LABELS: Record<string, string> = {
  paid_unfulfilled: "Paid, still open",
  order_age_24: "Older than 24h",
  order_age_48: "Older than 48h",
  high_value_order: "High-value review",
  customer_risk: "Customer review",
  partial_fulfillment: "Partially fulfilled",
  unusual_status: "Status review",
  payment_blocked: "Payment blocked",
  merchant_backlog: "Backlog review",
  inventory_constraint: "Inventory shortfall",
  low_inventory: "Low inventory",
  excess_inventory: "Excess inventory",
  refund_activity: "Refund activity",
};

function issueLabel(value: string) {
  return ISSUE_LABELS[value] ?? titleCase(value);
}
