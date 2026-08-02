import { AppShell } from "@/components/app-shell";
import { AskStore } from "@/components/ask-store";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { getStoreResult } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [result, params] = await Promise.all([getStoreResult(), searchParams]);
  return <AppShell source={result.snapshot.source} storeName={result.snapshot.shop.name} warning={result.liveError}><main className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><PageHeader eyebrow="Grounded exploration" title="Ask your store" description="Questions map to a closed set of read-only operational queries. Unsupported requests are declined instead of improvised."/><div className="mt-6"><SourceBanner result={result}/></div><div className="mt-5"><AskStore initialQuestion={params.q?.slice(0,500)||""}/></div></main></AppShell>;
}
