# Architecture

StoreOps Copilot is a read-only retrieval-and-decision prototype. Shopify or demo records remain the source of truth; domain rules create findings and priority; AI is an optional constrained communication layer.

```mermaid
flowchart TD
  subgraph Sources["Server-side sources"]
    D["Synthetic provider + 8 merchant stores"]
    C["Per-store connection configuration"]
    C --> S["Shopify Admin GraphQL 2026-07"]
  end
  D --> N["Normalized OperationsSnapshot"]
  S --> N
  N --> B["Explicit provider → merchant → store boundaries"]
  B --> M["Deterministic metrics + merchant backlogs"]
  B --> R["Deterministic alerts"]
  M --> P["Rule-based operational priority"]
  R --> P
  P --> Q["Unified order queue + details"]
  P --> F["Deterministic brief / answer"]
  P --> T["Typed question intent + scoped retrieval"]
  T --> A["Record and answer allowlists"]
  A --> O["OpenAI Responses API (optional)"]
  O --> V["JSON schema + Zod + exact evidence validation"]
  V --> UI["Next.js operator workspace"]
  F --> UI
  Q --> UI
```

## Domain and separation

- `FulfilmentProvider` owns the internal operations workspace.
- `Merchant` belongs to one provider and carries its service-level target.
- `ShopifyStore` belongs to one merchant and carries domain, currency, timezone, mode, and connection state.
- Every order, customer, product, variant, alert, recommendation, and task carries both `merchantId` and `storeId`.
- Customer identity, lifetime value, products, and inventory are never joined across stores.

This explicit separation is a prototype guardrail, not a substitute for production row-level tenant controls.

## Ask StoreOps sequence

```mermaid
sequenceDiagram
  participant U as Fulfilment operator
  participant API as Ask API
  participant R as Typed intent registry
  participant D as Domain rules
  participant O as OpenAI (optional)
  U->>API: Cross-store or merchant-specific question
  API->>R: Classify and detect merchant/store scope
  R->>D: Retrieve same-scope records and calculate facts
  D-->>API: Exact answer + allowed record IDs
  API->>O: Minimal facts + exact allowed answer
  O-->>API: Strict schema response
  API->>API: Compare every field and citation
  API-->>U: Validated output or deterministic fallback
```

## Code boundaries

- `lib/demo`: simulated multi-store source records.
- `lib/shopify`: server-only per-store GraphQL transport and normalization.
- `lib/domain`: types, thresholds, alerts, backlog metrics, priority, and deterministic brief.
- `lib/grounding`: intent classification, scope detection, retrieval, answer allowlists, and evidence validation.
- `lib/ai`: optional Responses API calls and exact output validation.
- `app/api`: read-only brief, Ask StoreOps, and demo diagnostic routes.
- `app` and `components`: operator workflow presentation.
- `tests`: domain boundaries, rules, grounding, normalization, and failure behavior.

## Live integration boundaries

- One server-side token per installed store; none reaches the browser.
- API version `2026-07` is pinned.
- Queries use verified Admin GraphQL fields and read-only scopes.
- Cursor pagination is capped for the prototype; throttle metadata and top-level errors are handled.
- Demo fallback is visible if a live connection is incomplete or fails.
- Production needs OAuth, encrypted credential persistence/rotation, tenant roles, webhook sync, retry/backoff, coverage diagnostics, and Bulk Operations for deep history.

The architecture keeps the highest-risk behavior inspectable: facts, alerts, and ranking are deterministic; record scope is explicit; invalid or unavailable model output cannot change the operational answer.
