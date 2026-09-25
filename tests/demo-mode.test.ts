import { afterEach, describe, expect, it, vi } from "vitest";
import { getStoreResult } from "@/lib/data/store";
import { createDemoSnapshot } from "@/lib/demo/seed";
import { detectAlerts } from "@/lib/domain/alerts";
import { calculateMetrics } from "@/lib/domain/metrics";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { buildGroundingContext, createFallbackAnswer } from "@/lib/grounding/ask-store";
import { synthesizeAnswer, synthesizeBrief } from "@/lib/ai/synthesis";

const originalMode = process.env.STOREOPS_DATA_MODE;
const originalOpenAiKey = process.env.OPENAI_API_KEY;
const originalShopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
const originalShopifyToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const originalShopifyStores = process.env.SHOPIFY_STORES_JSON;
afterEach(() => {
  if (originalMode === undefined) delete process.env.STOREOPS_DATA_MODE; else process.env.STOREOPS_DATA_MODE = originalMode;
  if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalOpenAiKey;
  vi.unstubAllEnvs();
  if (originalShopifyDomain === undefined) delete process.env.SHOPIFY_STORE_DOMAIN; else process.env.SHOPIFY_STORE_DOMAIN = originalShopifyDomain;
  if (originalShopifyToken === undefined) delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN; else process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = originalShopifyToken;
  if (originalShopifyStores === undefined) delete process.env.SHOPIFY_STORES_JSON; else process.env.SHOPIFY_STORES_JSON = originalShopifyStores;
});

describe("credential-free demo mode", () => {
  it("works without Shopify credentials", async () => {
    process.env.STOREOPS_DATA_MODE = "demo";
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const result = await getStoreResult();
    expect(result.snapshot.source).toBe("demo");
    expect(result.snapshot.orders.length).toBeGreaterThan(0);
  });

  it("falls back safely when live mode has no Shopify credentials", async () => {
    process.env.STOREOPS_DATA_MODE = "live";
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    delete process.env.SHOPIFY_STORES_JSON;
    const result = await getStoreResult();
    expect(result.requestedMode).toBe("live");
    expect(result.snapshot.source).toBe("demo");
    expect(result.liveError).toBe("Missing Shopify credentials");
  });

  it("forces synthetic data in public production builds", async () => {
    process.env.STOREOPS_DATA_MODE = "live";
    vi.stubEnv("NODE_ENV", "production");
    process.env.SHOPIFY_STORE_DOMAIN = "private-store.myshopify.com";
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = "secret";
    const result = await getStoreResult();
    expect(result).toMatchObject({ requestedMode:"live", snapshot:{source:"demo"}, liveError:"Live mode requires a protected, non-production environment" });
  });

  it("uses deterministic AI fallbacks without OpenAI credentials", async () => {
    delete process.env.OPENAI_API_KEY;
    const snapshot = createDemoSnapshot();
    const alerts = detectAlerts(snapshot, DEFAULT_THRESHOLDS);
    const metrics = calculateMetrics(snapshot, DEFAULT_THRESHOLDS);
    const context = buildGroundingContext("Which merchant has the most overdue orders?", snapshot, alerts, metrics);
    const fallback = createFallbackAnswer(context, snapshot, alerts, metrics);
    expect(await synthesizeAnswer(context, fallback)).toEqual(fallback);
    expect((await synthesizeBrief(snapshot, alerts, metrics)).generatedBy).toBe("deterministic_fallback");
  });
});
