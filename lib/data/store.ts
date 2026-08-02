import { createDemoSnapshot } from "@/lib/demo/seed";
import type { StoreSnapshot } from "@/lib/domain/types";
import { fetchShopifySnapshot } from "@/lib/shopify/client";

export type StoreResult = { snapshot: StoreSnapshot; requestedMode: "demo" | "live"; liveError: string | null };

export async function getStoreResult(): Promise<StoreResult> {
  const requestedMode = process.env.STOREOPS_DATA_MODE === "live" ? "live" : "demo";
  if (requestedMode === "demo") return { snapshot: createDemoSnapshot(), requestedMode, liveError: null };
  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    const snapshot = createDemoSnapshot();
    snapshot.warnings.push("Live mode was requested, but Shopify credentials are missing. Demo data is shown instead.");
    return { snapshot, requestedMode, liveError: "Missing Shopify credentials" };
  }
  try {
    return { snapshot: await fetchShopifySnapshot(), requestedMode, liveError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Shopify error";
    const snapshot = createDemoSnapshot();
    snapshot.warnings.push("The live store could not be loaded. Demo data is shown so the prototype remains usable.");
    return { snapshot, requestedMode, liveError: message };
  }
}
