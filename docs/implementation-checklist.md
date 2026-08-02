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
- [x] Refresh screenshots from validated multi-merchant deployment

## Quality and release gate

- [x] Domain and resilience tests pass
- [x] Lint passes without warnings
- [x] Type check passes
- [x] Production build passes
- [x] Desktop and mobile browser QA (local build and public production)
- [x] Keyboard and filter path review
- [x] `git diff --check`
- [x] Secret scan
- [x] Terminology, ownership, and unsupported-claim scan
- [x] Preview deployment built successfully (anonymous browser review blocked by project protection)
- [x] Existing production URL updated and validated

## Credential-dependent verification

- [x] Server-only single/multi-store connection architecture
- [x] Pinned API version and read-only query fields
- [x] Missing-credential and failed-live fallback
- [ ] Credential-backed multi-store development-shop test
