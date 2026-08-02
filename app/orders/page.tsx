import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { UnifiedOrderQueue, type QueueRow } from "@/components/unified-order-queue";
import { getStoreResult } from "@/lib/data/store";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { detectAlerts } from "@/lib/domain/alerts";
import { calculateOrderPriority } from "@/lib/domain/metrics";

export const dynamic = "force-dynamic";
export default async function OrdersPage({searchParams}:{searchParams:Promise<{merchant?:string;store?:string}>}) {
  const [result,params]=await Promise.all([getStoreResult(),searchParams]); const s=result.snapshot; const alerts=detectAlerts(s,DEFAULT_THRESHOLDS);
  const merchantById=new Map(s.merchants.map(merchant=>[merchant.id,merchant])); const storeById=new Map(s.stores.map(store=>[store.id,store]));
  const rows:QueueRow[]=s.orders.map(order=>{const priority=calculateOrderPriority(s,order,DEFAULT_THRESHOLDS);return {id:order.id,merchantId:order.merchantId,merchantName:merchantById.get(order.merchantId)?.name||"Unknown merchant",storeId:order.storeId,storeName:storeById.get(order.storeId)?.name||"Unknown store",orderName:order.name,createdAt:order.createdAt,customerName:order.customerName,financialStatus:order.financialStatus,fulfillmentStatus:order.fulfillmentStatus,lineItemCount:order.lineItems.length,itemQuantity:order.lineItems.reduce((sum,item)=>sum+item.quantity,0),totalAmount:order.total.amount,currencyCode:order.total.currencyCode,priorityScore:priority.score,priorityBand:priority.band,exceptionTypes:[...new Set(alerts.filter(alert=>alert.recordId===order.id).map(alert=>alert.issueType))],recommendedAction:priority.recommendedAction};});
  return <AppShell source={s.source} storeName={s.provider.name} storeCount={s.stores.length} warning={result.liveError}><main className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Cross-merchant fulfilment operations" title="Unified order queue" description="Actionable work from every simulated client store, with merchant context, deterministic priority, exceptions, filtering, and a recommended review step."/><div className="mt-6"><SourceBanner result={result}/></div><UnifiedOrderQueue rows={rows} generatedAt={s.generatedAt} timezone={s.stores[0]?.timezone||"UTC"} initialMerchant={s.merchants.some(item=>item.id===params.merchant)?params.merchant:"all"} initialStore={s.stores.some(item=>item.id===params.store)?params.store:"all"}/></main></AppShell>;
}
