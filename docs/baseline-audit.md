# Pre-update baseline audit

Captured on August 2, 2026 before the multi-merchant fulfilment update.

## Existing product and deployment

- Production URL: <https://storeops-copilot.vercel.app>
- Repository: <https://github.com/umeanougo/storeops-copilot>
- Baseline branch: `main`
- Implementation branch: `codex/multi-merchant-fulfillment`
- The deployed demo was working and showed a single synthetic Shopify store, North & Pine Supply.
- The overview emphasized one-store orders, order value, inventory alerts, refunds, and customer-value risk.
- The orders route displayed a single table without merchant/store filters or cross-store prioritization.

## Architecture and stack

- Next.js App Router, React, TypeScript, Tailwind CSS, Zod, Vitest, and the OpenAI SDK.
- Server routes expose the demo snapshot, daily brief, and grounded question-answering flow.
- `lib/demo` provides synthetic records; `lib/shopify` provides a server-only Admin GraphQL adapter.
- `lib/domain` owns deterministic metrics, rules, priority, formatting, and fallback brief generation.
- `lib/grounding` classifies a closed set of intents, selects records, and validates exact evidence.
- `lib/ai` optionally uses the OpenAI Responses API and falls back deterministically.

## Existing data model and rules

- One `StoreSnapshot` contained one shop, 13 orders, eight customers, seven products, and refunds.
- Rules covered paid orders unfulfilled beyond 48 hours, low inventory, excess inventory, high-value customers with delayed orders, and increased refund activity.
- Priority was deterministic and based primarily on severity with bounded rule-specific modifiers.
- The model did not represent a fulfilment provider, merchants, multiple stores, fulfilment tasks, merchant service levels, or backlog history.

## Existing AI and Shopify support

- Ask Store used a closed intent registry and exact answer/evidence validation.
- The model could not alter calculated claims, evidence, links, ordering, or recommendations.
- Missing credentials or invalid output used a deterministic fallback.
- Shopify support used read-only Admin GraphQL API `2026-07`, bounded cursor pagination, server-side credentials, optional-field normalization, and visible demo fallback.
- Live configuration supported one store through `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ADMIN_ACCESS_TOKEN`.

## Baseline quality gates

- Tests: 6 files, 50 tests passed.
- Lint: passed.
- Production build: passed.
- Type check: passed after the production build regenerated stale duplicated `.next` declaration files.
- Public demo: overview, orders, and grounded Ask Store flow loaded successfully with simulated data.

This audit records the starting point only. It does not claim external adoption, measured outcomes, or production use.
