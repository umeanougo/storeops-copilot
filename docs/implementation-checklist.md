# Implementation checklist

## Product model

- [x] Provider → merchant → store model
- [x] One simulated provider, eight merchants, eight stores, 56 orders
- [x] Merchant/store context on records, alerts, answers, recommendations, and tasks
- [x] Persistent simulated-data and read-only labels
- [x] Unified actionable order queue with required filters and sorting
- [x] Merchant backlog list and detail
- [x] Multi-merchant order, inventory, exception, and detail workflows

## Rules and AI

- [x] Paid/unfulfilled, 24h, 48h, high-value, customer-delay, partial, unusual, payment-block, inventory, and backlog rules
- [x] Deterministic operational priority model
- [x] Cross-store and merchant/store-scoped retrieval
- [x] Exact record/answer allowlists and schema validation
- [x] Unsupported-question and deterministic provider-failure behavior
- [x] No Shopify write path

## Portfolio artifacts

- [x] Corrected case study and methodology
- [x] README and architecture
- [x] Application copy under 700 and 1,500 characters
- [x] 30-second, 90-second, and three-minute scripts
- [x] LinkedIn and three-bullet resume copy
- [x] Dogfooding and security notes
- [ ] Refresh screenshots from validated multi-merchant deployment

## Quality and release gate

- [ ] Domain and resilience tests pass
- [ ] Lint passes without warnings
- [ ] Type check passes
- [ ] Production build passes
- [ ] Desktop and mobile preview QA
- [ ] Keyboard and filter path review
- [ ] `git diff --check`
- [ ] Secret scan
- [ ] Terminology, ownership, and unsupported-claim scan
- [ ] Preview deployment validated
- [ ] Existing production URL updated and validated

## Credential-dependent verification

- [x] Server-only single/multi-store connection architecture
- [x] Pinned API version and read-only query fields
- [x] Missing-credential and failed-live fallback
- [ ] Credential-backed multi-store development-shop test
