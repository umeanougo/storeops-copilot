"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Filter, RotateCcw } from "lucide-react";
import type { FinancialState, FulfillmentState } from "@/lib/domain/types";
import { ageLabel, formatDateTime, formatMoney, hoursBetween } from "@/lib/domain/format";

export type QueueRow = {
  id: string; merchantId: string; merchantName: string; storeId: string; storeName: string; orderName: string; createdAt: string; customerName: string; financialStatus: FinancialState; fulfillmentStatus: FulfillmentState; lineItemCount: number; itemQuantity: number; totalAmount: number; currencyCode: string; priorityScore: number; priorityBand: string; exceptionTypes: string[]; recommendedAction: string;
};

export function UnifiedOrderQueue({ rows, generatedAt, timezone, initialMerchant = "all", initialStore = "all" }: { rows: QueueRow[]; generatedAt: string; timezone: string; initialMerchant?: string; initialStore?: string }) {
  const [merchant,setMerchant]=useState(initialMerchant); const [store,setStore]=useState(initialStore); const [payment,setPayment]=useState("all"); const [fulfillment,setFulfillment]=useState("all"); const [age,setAge]=useState("all"); const [priority,setPriority]=useState("all"); const [exception,setException]=useState("all"); const [dateRange,setDateRange]=useState("30d"); const [sort,setSort]=useState("priority"); const [scope,setScope]=useState("actionable");
  const merchants=[...new Map(rows.map(row=>[row.merchantId,row.merchantName])).entries()];
  const stores=[...new Map(rows.filter(row=>merchant==="all"||row.merchantId===merchant).map(row=>[row.storeId,row.storeName])).entries()];
  const exceptionTypes=[...new Set(rows.flatMap(row=>row.exceptionTypes))].sort();
  const visible=useMemo(()=>rows.filter(row=>{
    const hours=hoursBetween(generatedAt,row.createdAt);
    if(scope==="actionable"&&row.fulfillmentStatus==="FULFILLED")return false;
    if(merchant!=="all"&&row.merchantId!==merchant)return false;
    if(store!=="all"&&row.storeId!==store)return false;
    if(payment!=="all"&&row.financialStatus!==payment)return false;
    if(fulfillment!=="all"&&row.fulfillmentStatus!==fulfillment)return false;
    if(age==="under24"&&hours>=24)return false; if(age==="24to48"&&(hours<24||hours>=48))return false; if(age==="over48"&&hours<48)return false;
    if(priority!=="all"&&row.priorityBand!==priority)return false;
    if(exception!=="all"&&!row.exceptionTypes.includes(exception))return false;
    if(dateRange!=="all"&&hours>Number(dateRange.replace("d",""))*24)return false;
    return true;
  }).sort((a,b)=>sort==="oldest"?new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime():sort==="newest"?new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime():sort==="merchant"?a.merchantName.localeCompare(b.merchantName):sort==="value"?b.totalAmount-a.totalAmount:b.priorityScore-a.priorityScore),[rows,generatedAt,scope,merchant,store,payment,fulfillment,age,priority,exception,dateRange,sort]);
  const reset=()=>{setMerchant("all");setStore("all");setPayment("all");setFulfillment("all");setAge("all");setPriority("all");setException("all");setDateRange("30d");setSort("priority");setScope("actionable");};
  return <>
    <section className="mt-6 rounded-[20px] border border-[#dfe2dc] bg-[#fffefa] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Filter size={14} className="text-[#657169]"/><p className="text-[10px] font-bold">Queue controls</p><span className="rounded-full bg-[#eef1ed] px-2 py-1 text-[8px] text-[#6e7971]">{visible.length} orders</span></div><button onClick={reset} className="inline-flex items-center gap-2 text-[9px] font-bold text-[#8a5c45]"><RotateCcw size={11}/>Reset</button></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <FilterSelect label="View" value={scope} onChange={setScope} options={[["actionable","Actionable work"],["all","All orders"]]}/>
      <FilterSelect label="Merchant" value={merchant} onChange={value=>{setMerchant(value);setStore("all");}} options={[["all","All merchants"],...merchants]}/>
      <FilterSelect label="Store" value={store} onChange={setStore} options={[["all","All stores"],...stores]}/>
      <FilterSelect label="Payment" value={payment} onChange={setPayment} options={[["all","All payment states"],...[...new Set(rows.map(row=>row.financialStatus))].map(value=>[value,value.replaceAll("_"," ")])]}/>
      <FilterSelect label="Fulfilment" value={fulfillment} onChange={setFulfillment} options={[["all","All fulfilment states"],...[...new Set(rows.map(row=>row.fulfillmentStatus))].map(value=>[value,value.replaceAll("_"," ")])]}/>
      <FilterSelect label="Order age" value={age} onChange={setAge} options={[["all","Any age"],["under24","Under 24 hours"],["24to48","24–48 hours"],["over48","Over 48 hours"]]}/>
      <FilterSelect label="Priority" value={priority} onChange={setPriority} options={[["all","All priorities"],["critical","Critical"],["high","High"],["medium","Medium"],["routine","Routine"]]}/>
      <FilterSelect label="Exception" value={exception} onChange={setException} options={[["all","All exception types"],...exceptionTypes.map(value=>[value,value.replaceAll("_"," ")])]}/>
      <FilterSelect label="Date range" value={dateRange} onChange={setDateRange} options={[["7d","Last 7 days"],["30d","Last 30 days"],["all","All available"]]}/>
      <FilterSelect label="Sort" value={sort} onChange={setSort} options={[["priority","Highest priority"],["oldest","Oldest order"],["newest","Newest order"],["merchant","Merchant"],["value","Order value"]]}/>
    </div></section>
    <section className="mt-4 overflow-hidden rounded-[20px] border border-[#dfe2dc] bg-[#fffefa]"><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left"><caption className="sr-only">Unified multi-merchant order queue</caption><thead><tr className="border-b border-[#e5e8e3] bg-[#faf9f6] text-[8px] uppercase tracking-[.1em] text-[#7c867e]"><th className="px-4 py-3">Merchant / store</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Created / age</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Fulfilment</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Exception</th><th className="px-4 py-3">Recommended next action</th><th className="px-4 py-3"><span className="sr-only">Open</span></th></tr></thead><tbody>{visible.map(row=><tr key={row.id} className="border-b border-[#eceeea] align-top last:border-0 hover:bg-[#fcfcf9]"><td className="px-4 py-4"><p className="text-[10px] font-bold">{row.merchantName}</p><p className="mt-1 text-[8px] text-[#7d867f]">{row.storeName}</p></td><td className="px-4 py-4"><Link href={`/orders/${row.id}` as never} className="text-[11px] font-bold hover:text-[#b45032]">{row.orderName}</Link><p className="mt-1 text-[8px] text-[#858e87]">{formatMoney(row.totalAmount,row.currencyCode)}</p></td><td className="px-4 py-4"><p className="text-[9px]">{formatDateTime(row.createdAt,timezone)}</p><p className="mt-1 text-[8px] font-bold text-[#a64f34]">{ageLabel(hoursBetween(generatedAt,row.createdAt))}</p></td><td className="px-4 py-4 text-[9px]">{row.customerName}</td><td className="px-4 py-4 text-[8px] font-bold">{row.financialStatus.replaceAll("_"," ")}</td><td className="px-4 py-4 text-[8px] font-bold">{row.fulfillmentStatus.replaceAll("_"," ")}</td><td className="px-4 py-4 text-[9px]">{row.lineItemCount} lines · {row.itemQuantity} units</td><td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase ${row.priorityBand==="critical"?"bg-[#fee8e1] text-[#a7442d]":row.priorityBand==="high"?"bg-[#fff0de] text-[#98601e]":"bg-[#edf1ec] text-[#59675e]"}`}>{row.priorityBand} · {row.priorityScore}</span></td><td className="max-w-[150px] px-4 py-4 text-[8px] leading-4 text-[#6d7770]">{row.exceptionTypes.length?row.exceptionTypes.map(value=>value.replaceAll("_"," ")).join(", "):"None"}</td><td className="max-w-[210px] px-4 py-4 text-[9px] leading-4 text-[#566159]">{row.recommendedAction}</td><td className="px-4 py-4"><Link href={`/orders/${row.id}` as never} aria-label={`Open ${row.merchantName} ${row.orderName}`}><ArrowUpRight size={13} className="text-[#9aa19b]"/></Link></td></tr>)}</tbody></table>{!visible.length&&<div className="p-8 text-center text-[10px] text-[#758077]">No orders match the selected queue filters.</div>}</div></section>
  </>;
}

function FilterSelect({label,value,onChange,options}:{label:string;value:string;onChange:(value:string)=>void;options:string[][]}) { return <label className="block"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[.08em] text-[#7f8981]">{label}</span><select value={value} onChange={event=>onChange(event.target.value)} className="w-full rounded-xl border border-[#dce1da] bg-white px-3 py-2.5 text-[9px] text-[#344038] outline-none focus:border-[#7f9986]">{options.map(([optionValue,optionLabel])=><option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
