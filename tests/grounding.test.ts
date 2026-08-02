import { describe, expect, it } from "vitest";
import { createDemoSnapshot } from "@/lib/demo/seed";
import { detectAlerts } from "@/lib/domain/alerts";
import { calculateMetrics } from "@/lib/domain/metrics";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";
import { buildGroundingContext, classifyIntent, createFallbackAnswer, validateGroundedAnswer } from "@/lib/grounding/ask-store";

const setup=(question:string)=>{const snapshot=createDemoSnapshot();const alerts=detectAlerts(snapshot,DEFAULT_THRESHOLDS);const metrics=calculateMetrics(snapshot,DEFAULT_THRESHOLDS);const context=buildGroundingContext(question,snapshot,alerts,metrics);return{snapshot,alerts,metrics,context,answer:createFallbackAnswer(context,snapshot,alerts,metrics)}};
describe("grounded Ask StoreOps",()=>{
  it.each([["Which merchant has the most overdue orders?","merchant_overdue"],["Show all paid orders that are still unfulfilled.","paid_unfulfilled"],["Which orders are older than 48 hours?","over_48"],["Which merchant backlog increased the most?","backlog_change"],["Show blocked orders by merchant.","blocked_orders"],["Summarize today’s workload by merchant.","workload_summary"]] as const)("maps %s to %s",(question,intent)=>expect(classifyIntent(question)).toBe(intent));
  it("answers cross-merchant workload with merchant and store citations",()=>{const{answer}=setup("Summarize today’s workload by merchant.");expect(answer.supported).toBe(true);expect(answer.evidence.every(item=>item.label.includes("·"))).toBe(true);});
  it("retrieves only a named merchant scope",()=>{const{context,answer}=setup("Show blocked orders for Cedar & Coast.");expect(context.scope.merchantId).toBe("mer_cedar");expect(answer.evidence.every(item=>item.label.includes("Cedar & Coast"))).toBe(true);});
  it("prevents invalid merchant and store references",()=>{const{context,answer}=setup("Summarize today’s workload by merchant.");const candidate={...answer,generatedBy:"openai" as const,evidence:answer.evidence.map((item,index)=>index===0?{...item,recordId:"merchant_invented"}:item)};expect(validateGroundedAnswer(candidate,context,answer)).toBe(false);});
  it("rejects changed same-record labels and values",()=>{const{context,answer}=setup("Which merchant has the most overdue orders?");const candidate={...answer,generatedBy:"openai" as const,evidence:answer.evidence.map((item,index)=>index===0?{...item,label:"Another merchant"}:item)};expect(validateGroundedAnswer(candidate,context,answer)).toBe(false);});
  it("explains a named order",()=>{const{answer}=setup("Why was order #2101 flagged?");expect(answer.heading).toContain("#2101");expect(answer.answer).toContain("rule-based");});
  it("does not substitute another order",()=>{const{answer}=setup("Why was order #9999 flagged?");expect(answer.heading).toContain("No matching order");expect(answer.evidence).toEqual([]);});
  it("declines an unsupported marketing question",()=>{const{answer}=setup("Which campaign has the best ROAS?");expect(answer.supported).toBe(false);expect(answer.evidence).toEqual([]);});
  it("returns a stable empty-state answer",()=>{const snapshot=createDemoSnapshot();snapshot.orders=[];snapshot.products=[];const alerts=detectAlerts(snapshot,DEFAULT_THRESHOLDS);const metrics=calculateMetrics(snapshot,DEFAULT_THRESHOLDS);const context=buildGroundingContext("Which orders are older than 48 hours?",snapshot,alerts,metrics);const answer=createFallbackAnswer(context,snapshot,alerts,metrics);expect(answer.heading).toContain("No orders");expect(answer.evidence).toEqual([]);});
});
