import { afterEach, describe, expect, it } from "vitest";
import { getStoreResult } from "@/lib/data/store";

const originalMode = process.env.STOREOPS_DATA_MODE;
afterEach(() => { if (originalMode === undefined) delete process.env.STOREOPS_DATA_MODE; else process.env.STOREOPS_DATA_MODE = originalMode; });

describe("credential-free demo mode", () => {
  it("works without Shopify credentials", async () => {
    process.env.STOREOPS_DATA_MODE = "demo";
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const result = await getStoreResult();
    expect(result.snapshot.source).toBe("demo");
    expect(result.snapshot.orders.length).toBeGreaterThan(0);
  });
});
