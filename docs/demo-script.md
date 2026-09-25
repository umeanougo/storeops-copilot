# Recruiter demo script

Target length: 4 minutes. The point is to show product judgment, not every feature.

## Before the call

- Start on the overview with the demo source label visible.
- Reset the order queue so no filters carry over.
- Keep the case study and methodology pages open in separate tabs.
- Use the synthetic demo data. Do not imply that the prototype is deployed with a client.

## 0:00–0:35 — Frame the problem

**Show:** Overview, titled “What needs attention today.”

**Say:**

“I observed a third-party fulfilment operator repeatedly switch between merchant-owned Shopify accounts to find and process work. The operation managed approximately eight accounts and performed approximately 24 recurring checks per day. I mapped that workflow and independently built StoreOps Copilot to test one question: can a team prioritize cross-store work without losing merchant context?

This public prototype uses synthetic data, is read-only, and has not produced a measured customer outcome.”

## 0:35–1:10 — Show the operating view

**Show:** The four headline metrics, “Start here,” “Where work is building,” and inventory blockers.

**Say:**

“The overview is deliberately an operations brief, not a general analytics dashboard. It answers what is open, what is ageing, what is blocked, and which records deserve review first. Every count and priority is calculated by deterministic rules. The brief never performs a Shopify action.”

**Product point:** The useful unit of work is an operator decision across stores, not one store’s health score.

## 1:10–1:55 — Work the order queue

**Show:** Open **Order queue**. Filter to one merchant, select orders older than 48 hours, then sort oldest first. Open **More filters** briefly to show payment, fulfilment, priority, and exception controls.

**Say:**

“The queue consolidates open fulfilment work while preserving merchant and store identity on every record. The default controls cover the most common triage moves; the less frequent controls stay collapsed. An operator can narrow the portfolio without confusing one client’s work with another’s.”

**Product point:** The queue optimizes for actionable fulfilment work, not total commerce reporting.

## 1:55–2:30 — Explain one priority

**Show:** Open the highest-priority order. Point to payment and fulfilment state, age, line-item availability, exceptions, score inputs, and the recommended next step.

**Say:**

“Priority is a transparent rule score using age, payment, fulfilment state, order value, same-store customer value, service target, backlog risk, inventory, and manual exception signals. It ranks review work; it does not predict an outcome or make an autonomous decision. The recommendation is read-only.”

## 2:30–3:15 — Demonstrate grounded questions

**Show:** Open **Ask StoreOps**. Ask: “Which merchant has the most overdue orders?” Open one cited record. Then ask an unsupported question such as: “Which merchant has the best profit margin?”

**Say:**

“This is retrieval over typed operational records, not an open-ended chatbot. The app detects merchant and store scope, calculates the answer outside the model, and cites the matching records. OpenAI is an optional, non-authoritative output layer: it may return only the exact precomputed answer. If any sentence, value, link, record, or ordering changes, validation fails and the deterministic answer is shown. Questions without supporting data are declined.”

**Product point:** Trust comes from visible evidence and refusal behavior, not fluent prose.

## 3:15–3:45 — Show the architecture boundary

**Show:** Open **Methodology** and point to the three layers: explicit ownership, deterministic operations, and constrained optional model output.

**Say:**

“Merchant and store IDs are mandatory before any calculation. The public route returns demo records only, and server-side tokens are not exposed. A production version would still require Shopify OAuth, encrypted per-store token storage, strict tenant isolation, roles, audit logs, retention controls, and model governance. I did not build those systems because the next risk is workflow value, not infrastructure scale.”

## 3:45–4:00 — Close with the validation plan

**Show:** Case study executive summary or “Next validation steps.”

**Say:**

“The strongest product decision was narrowing the problem from store analytics to cross-merchant triage. My next step would be a task test with fulfilment operators: measure account switches, time to identify all work, overdue-order recall, alert usefulness, false positives, and trust in cited answers before adding write actions.”

## Claims to avoid

- Do not call the demo client work, a pilot, or a deployed product.
- Do not claim time savings, adoption, or improved fulfilment performance.
- Do not say the model calculates priority or independently generates recommendations.
- Do not describe every paid open order as ready; payment, inventory, hold, and partial state still matter.
- Do not imply that the public deployment has production-grade authentication or tenant isolation.
