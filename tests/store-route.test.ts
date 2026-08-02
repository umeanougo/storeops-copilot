import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/store/route";

describe("public store API", () => {
  it("returns only the synthetic demo snapshot", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.requestedMode).toBe("demo");
    expect(body.snapshot.source).toBe("demo");
    expect(body.snapshot.shop.domain).toContain("-demo.myshopify.com");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
