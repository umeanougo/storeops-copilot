import { describe, expect, it } from "vitest";
import { createDemoSnapshot } from "@/lib/demo/seed";
import { detectAlerts } from "@/lib/domain/alerts";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

const setup=()=>{const snapshot=createDemoSnapshot();return {snapshot,alerts:detectAlerts(snapshot,DEFAULT_THRESHOLDS)}};
describe("multi-merchant deterministic alert engine",()=>{
  it("detects paid and unfulfilled work",()=>expect(setup().alerts.some(item=>item.issueType==="paid_unfulfilled")).toBe(true));
  it("detects 24-hour ageing without calling it 48-hour overdue",()=>{const{alerts}=setup();const warning=alerts.find(item=>item.issueType==="order_age_24");expect(warning?.threshold).toContain("24");});
  it("detects an order beyond 48 hours",()=>{const{alerts}=setup();expect(alerts.some(item=>item.id==="age-48-ord_1_1")).toBe(true);});
  it("does not flag exactly 48 hours as beyond 48 hours",()=>{const{snapshot}=setup();const order=snapshot.orders.find(item=>item.id==="ord_1_1")!;order.createdAt=new Date(new Date(snapshot.generatedAt).getTime()-48*3_600_000).toISOString();expect(detectAlerts(snapshot,DEFAULT_THRESHOLDS).some(item=>item.id===`age-48-${order.id}`)).toBe(false);});
  it("detects partial fulfilment",()=>expect(setup().alerts.some(item=>item.issueType==="partial_fulfillment")).toBe(true));
  it("detects payment-blocked orders",()=>expect(setup().alerts.some(item=>item.issueType==="payment_blocked")).toBe(true));
  it("detects a high-value delayed order",()=>expect(setup().alerts.some(item=>item.issueType==="high_value_order"&&item.recordId==="ord_1_1")).toBe(true));
  it("detects an increasing merchant backlog",()=>expect(setup().alerts.some(item=>item.id==="backlog-mer_northstar")).toBe(true));
  it("detects same-store inventory constraints",()=>expect(setup().alerts.some(item=>item.issueType==="inventory_constraint"&&item.merchantId==="mer_northstar")).toBe(true));
  it("preserves merchant and store on every alert",()=>{const{alerts}=setup();expect(alerts.every(item=>item.merchantId&&item.storeId&&item.supportingData.some(fact=>fact.label==="Merchant")&&item.supportingData.some(fact=>fact.label==="Client store"))).toBe(true);});
  it("does not create cross-merchant customer risk",()=>{const{snapshot}=setup();const order=snapshot.orders.find(item=>item.id==="ord_1_1")!;order.customerId="cus_2_1";expect(detectAlerts(snapshot,DEFAULT_THRESHOLDS).some(item=>item.id===`customer-risk-${order.id}`)).toBe(false);});
});
