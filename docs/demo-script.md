# Demo scripts

## 90-second walkthrough

**0:00–0:15 — Discovery and user**

“I observed a third-party fulfilment team repeatedly switching between merchant-owned Shopify accounts to find and process work. I independently built StoreOps Copilot to explore a unified, explainable workflow.”

**0:15–0:35 — Operations overview**

Open the overview. Point to the simulated-data label, cross-merchant workload, ageing metrics, and operations brief. Explain that approximately eight accounts and 24 recurring checks describe discovery context, not prototype adoption.

**0:35–0:58 — Unified queue**

Open Unified Order Queue. Show the actionable-first default, merchant/store identity on every row, then filter to one merchant and sort oldest first. Point out payment, fulfilment, priority, exception, and recommended action.

**0:58–1:15 — Explainability**

Open the highest-priority order. Show line-item inventory, service target, current exceptions, the rule-based score, why it was flagged, and the read-only recommendation.

**1:15–1:27 — Ask StoreOps**

Ask “Which merchant has the most overdue orders?” Open a cited merchant record. Explain that metrics are calculated before the model and invalid output falls back.

**1:27–1:30 — Close**

“The core product judgment is one operational view without erasing merchant boundaries.”

## Three-minute walkthrough

**0:00–0:30 — Problem**

“While helping a third-party fulfilment operator examine its Shopify workflows, I saw a team move store by store to confirm payment, inspect line items, identify exceptions, and remember what still needed action. The observed operation managed approximately eight accounts and performed approximately 24 recurring checks per day. I mapped that workflow and independently built this prototype; it is not their deployed product.”

**0:30–0:58 — Overview and brief**

Show the simulated label, today’s workload, immediate priorities, backlogs, blocked orders, and inventory constraints. “Facts, alerts, and ordering are deterministic. OpenAI is optional and cannot change the calculations.”

**0:58–1:28 — Unified queue**

Show actionable-first work across eight stores. Filter to one merchant, then a store; select paid/unfulfilled and older than 48 hours; sort oldest. “Every order keeps provider, merchant, and store context so an operator can prioritize without confusing client work.”

**1:28–1:55 — Merchant and order drill-down**

Open the highest-risk merchant, compare backlog and service target, then open a delayed order. Show customer context, line items, availability, notes, partial/payment state, exceptions, priority inputs, and recommended next step. “The app does not fulfil or edit anything.”

**1:55–2:25 — Grounded question**

Ask “Which merchant backlog increased the most?” Then ask a merchant-specific paid/unfulfilled question. Show cited merchant/store/order records. Ask an unsupported margin question and show the decline. “Retrieval is scoped before the model; output must exactly match source-derived text and identifiers.”

**2:25–2:45 — Methodology**

Show the three-layer architecture: normalized records, deterministic rules, constrained synthesis. Point out tenant boundaries and production requirements including OAuth, encrypted tokens, roles, isolation, and audit logs.

**2:45–3:00 — Validation**

“I deferred writes, billing, webhooks, and public OAuth because the next risk is workflow value. I would observe five operators performing morning triage and measure account switches, time to identify work, overdue recall, alert usefulness, false positives, and trust in cited answers.”
