# Personal dogfooding notes

This journal records my own testing of the portfolio prototype. It is **not external operator feedback**, production evidence, or a measured outcome.

## Scenarios exercised

- Reviewed workload across all eight simulated merchant stores.
- Filtered the unified queue to one merchant and then one store.
- Found all open orders older than 48 hours and all paid/unfulfilled orders.
- Compared merchant backlog size, average age, oldest order, trend, and risk.
- Inspected a partially fulfilled order and a payment-blocked order.
- Followed an inventory constraint from order to same-store variant availability.
- Asked cross-store questions and merchant-specific questions.
- Confirmed every answer and evidence label retained merchant/store context.
- Checked the empty/no-risk merchant and no-finding answer state.
- Removed OpenAI and Shopify credentials to verify deterministic/demo fallbacks.
- Tampered with merchant/store references in tests to verify rejection.

## Confusing interactions and changes

- A complete order list looked like reporting rather than operations. The default now surfaces actionable work and keeps “all orders” as an explicit view.
- A priority number alone felt arbitrary. Rows show reasons and a recommended next step; order detail exposes every rule input.
- Store identity was visually secondary in early rows. Merchant and client-store labels are now attached to every operational record and evidence item.
- “AI-generated” overstated the role of the model. Labels now distinguish deterministic fallback from AI-constrained synthesis.
- A recommendation could look executed. Copy now says “recommended next step” and repeats the read-only boundary.
- A silent live failure could hide an integration problem. The source banner states when live mode was requested but simulated fallback is active.

## Prioritization issues found

- Age alone could elevate an unpaid order above ready work. The score now treats payment state as a blocker and recommends merchant review instead of picking.
- Partial fulfilment needed its own signal rather than appearing as generic open work.
- Service-level targets needed to affect urgency, not just a global 48-hour threshold.
- Inventory availability had to be joined only within the same store.
- Alphabetical ties obscured operational intent; deterministic age, value, backlog, customer, and inventory inputs now break ties.

## Cross-merchant leakage checks

- Every domain record and task requires `merchantId` and `storeId`.
- Named merchant/store questions create a scoped record allowlist before synthesis.
- Customer value is never aggregated between unrelated stores.
- AI output with an unknown merchant, store, order, label, value, link, or ordering is rejected.
- The public demo is explicitly an internal provider view, not a merchant portal.

## Weak-answer checks

- Unsupported questions return no evidence and state what data is missing.
- No-finding questions distinguish “zero detected” from missing information.
- Answers link to the record that supports the conclusion rather than citing a generic metric.
- Recommendations are concise, operational, and visibly separate from facts.

## Remaining limitations

- Rule weights and per-merchant targets have not been validated with external operators.
- The simulated backlog trend is a snapshot field, not an event-sourced history.
- There is no staffing, carrier cutoff, warehouse location, inbound stock, or pick-capacity context.
- Live eight-store retrieval and throttling behavior remain credential-dependent.
- There are no conversational follow-ups, write actions, OAuth lifecycle, roles, or production tenant controls.

## Recommended next session

Observe a fulfilment operator completing a real morning triage without the prototype, then replay the same source records in a protected test environment. Compare missed/false alerts, account switches, time to enumerate awaiting work, ranking disagreements, evidence trust, and required merchant-specific exceptions. Treat every metric as proposed until that session occurs.
