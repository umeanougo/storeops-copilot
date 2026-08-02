import { AppShell } from "@/components/app-shell";
import { AskStore } from "@/components/ask-store";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { getStoreResult } from "@/lib/data/store";
export const dynamic="force-dynamic";
export default async function AskPage({searchParams}:{searchParams:Promise<{q?:string}>}){const[result,params]=await Promise.all([getStoreResult(),searchParams]);const s=result.snapshot;return <AppShell source={s.source} storeName={s.provider.name} storeCount={s.stores.length} warning={result.liveError}><main className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Grounded multi-merchant exploration" title="Ask StoreOps" description="Questions map to a closed set of read-only fulfilment queries. Merchant and store scope is preserved; unsupported requests are declined instead of improvised."/><div className="mt-6"><SourceBanner result={result}/></div><div className="mt-5"><AskStore initialQuestion={params.q?.slice(0,500)||""}/></div></main></AppShell>}
