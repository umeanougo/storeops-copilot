# Architecture

StoreOps Copilot is intentionally a small retrieval-and-decision system. Shopify or demo data remains the source of truth; domain rules create findings; AI is an optional writing layer.

```mermaid
flowchart TD
  subgraph Sources
    D["Synthetic demo data"]
    S["Shopify Admin GraphQL API 2026-07"]
  end
  D --> N["Normalized StoreSnapshot"]
  S --> N
  N --> M["Deterministic metrics"]
  N --> R["Deterministic alert rules"]
  M --> P["Priority queue"]
  R --> P
  P --> B["Daily brief input"]
  P --> Q["Typed Ask Store registry"]
  Q --> C["Relevant record context"]
  B --> F["Deterministic fallback"]
  C --> F
  B --> O["OpenAI Responses API"]
  C --> O
  O --> V["Zod + exact claim/evidence validation"]
  V --> UI["Next.js UI"]
  F --> UI
```

## Separation of concerns

- `lib/demo`: realistic synthetic source records.
- `lib/shopify`: server-only GraphQL transport and response normalization.
- `lib/domain`: types, configurable rules, metrics, priority, formatting, and fallback brief.
- `lib/grounding`: intent classification, relevant-record retrieval, fallback answers, and evidence validation.
- `lib/ai`: optional Responses API synthesis with structured output.
- `app/api`: small server endpoints for the brief, Ask Store, and a demo-only diagnostic snapshot.
- `components` and `app`: presentation and route composition only.
- `tests`: business rules, grounding, normalization, date/currency, and credential-free behavior.

## Data flow for Ask Store

```mermaid
sequenceDiagram
  participant M as Merchant
  participant A as Ask API
  participant R as Query registry
  participant D as Domain functions
  participant O as OpenAI (optional)
  M->>A: Operational question
  A->>R: Classify to allowed intent
  R->>D: Select records + calculate facts
  D-->>A: Facts + source-derived answer allowlist
  A->>O: Minimal structured context + allowed answer
  O-->>A: Schema-constrained selection
  A->>A: Validate every sentence, value, link, and record ID
  A-->>M: Grounded answer or deterministic fallback
```

## Live integration boundaries

- Custom-app Admin token only; no browser access.
- `2026-07` is pinned rather than `latest`.
- Queries request only required fields.
- Connections paginate with cursors and a documented prototype cap.
- Top-level GraphQL errors, HTTP failures, optional fields, currency, and throttle metadata are handled.
- A production adapter should split list and detail queries, add retry/backoff for transient throttling, track coverage completeness, and use Bulk Operations for deep history.

## Why this architecture

It makes the riskiest product behavior—the decision logic—easy to inspect and test. It also creates explicit failure boundaries: missing credentials select demo mode, live failure is visible, invalid model output falls back, and unsupported questions never become improvised database access.
