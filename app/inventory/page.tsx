import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SourceBanner } from "@/components/source-banner";
import { getStoreResult } from "@/lib/data/store";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const result = await getStoreResult();
  const snapshot = result.snapshot;
  const merchantById = new Map(snapshot.merchants.map((merchant) => [merchant.id, merchant]));
  const storeById = new Map(snapshot.stores.map((store) => [store.id, store]));
  const variants = snapshot.products
    .flatMap((product) => product.variants)
    .sort((a, b) => {
      if (a.available == null) return 1;
      if (b.available == null) return -1;
      return a.available - b.available;
    });
  const knownInventory = variants.filter((variant) => variant.available != null);
  const lowInventory = knownInventory.filter(
    (variant) => variant.available! < DEFAULT_THRESHOLDS.lowInventoryUnits,
  ).length;
  const unavailable = variants.length - knownInventory.length;

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          eyebrow="Across all merchant stores"
          title="Inventory by store"
          description="Review each product variant in its owning store. Low-stock signals only appear when a reliable available quantity exists."
        />

        <div className="mt-6">
          <SourceBanner result={result} />
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Summary value={variants.length} label="Variants tracked" />
          <Summary value={lowInventory} label="Below low-stock threshold" attention={lowInventory > 0} />
          <Summary value={unavailable} label="Quantity unavailable" muted={unavailable === 0} />
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant) => {
            const low =
              variant.available != null &&
              variant.available < DEFAULT_THRESHOLDS.lowInventoryUnits;
            const merchant = merchantById.get(variant.merchantId);
            const store = storeById.get(variant.storeId);

            return (
              <Link
                href={`/inventory/${variant.id}` as never}
                key={variant.id}
                className="group rounded-[18px] border border-[#dfe2dc] bg-[#fffefa] p-5 transition hover:-translate-y-0.5 hover:border-[#b9c4bb] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#7b867e]">
                      {merchant?.name} · {store?.name}
                    </p>
                    <h2 className="mt-2 text-[16px] font-bold tracking-[-.02em] text-[#1b251f]">
                      {variant.productTitle}
                    </h2>
                    <p className="mt-1 text-[12px] text-[#6f7972]">
                      {variant.title} · {variant.sku}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-[#9ca39d] transition group-hover:text-[#b64d2f]"
                  />
                </div>

                <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-[#e7e9e5] pt-4">
                  <VariantStat
                    value={variant.available == null ? "—" : variant.available}
                    label={variant.available == null ? "Unavailable" : "Available"}
                    attention={low}
                    muted={variant.available == null}
                  />
                  <VariantStat value={variant.unitsSold7d} label="Ordered · 7d" />
                  <VariantStat value={variant.unitsSold30d} label="Ordered · 30d" />
                </dl>

                {low && (
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[.08em] text-[#a74730]">
                    Low inventory · review open orders
                  </p>
                )}
                {variant.available == null && (
                  <p className="mt-4 text-[10px] font-semibold text-[#747e77]">
                    Shopify did not return an available quantity.
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}

function Summary({
  value,
  label,
  attention = false,
  muted = false,
}: {
  value: number;
  label: string;
  attention?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe2dc] bg-white px-5 py-4">
      <dd
        className={`text-[26px] font-bold tracking-[-.04em] ${attention ? "text-[#a74730]" : muted ? "text-[#7a847c]" : "text-[#1b251f]"}`}
      >
        {value}
      </dd>
      <dt className="mt-1 text-[12px] text-[#68736b]">{label}</dt>
    </div>
  );
}

function VariantStat({
  value,
  label,
  attention = false,
  muted = false,
}: {
  value: number | string;
  label: string;
  attention?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <dd
        className={`text-[22px] font-bold tracking-[-.04em] ${attention ? "text-[#a74730]" : muted ? "text-[#7a847c]" : "text-[#1b251f]"}`}
      >
        {value}
      </dd>
      <dt className="mt-1 text-[11px] text-[#747e77]">{label}</dt>
    </div>
  );
}
