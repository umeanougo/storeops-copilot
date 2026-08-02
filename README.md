# StoreOps Copilot

**An independently built, AI-assisted multi-merchant fulfilment operations prototype inspired by real workflow discovery.**

**Live demo:** [storeops-copilot.vercel.app](https://storeops-copilot.vercel.app)

StoreOps Copilot gives a third-party fulfilment operator one calm workspace for answering: **Across every merchant we support, what does the fulfilment team need to act on today?** It consolidates order work across merchant-owned Shopify stores while preserving the provider → merchant → store boundary on every record, alert, and recommendation.

> Portfolio prototype only. It is not a commissioned client product, production deployment, Shopify-endorsed product, or Shopify App Store listing. The public demo uses synthetic data and performs no Shopify write actions.

## Discovery context and product hypothesis

While helping a third-party fulfilment operator examine its Shopify workflows, I observed a team repeatedly switching between merchant-owned Shopify accounts to review orders, confirm payment and fulfilment readiness, inspect customer and line-item context, identify exceptions, and track unfinished work. The observed operation managed approximately eight merchant accounts and performed approximately 24 recurring account and workflow checks per day. Those figures describe discovery context—not usage of this prototype or measured impact.

**Primary user:** a fulfilment operator or manager processing orders on behalf of multiple client merchants.

**Hypothesis:** a unified, explainable operations queue can help operators identify and prioritize cross-merchant fulfilment work while maintaining the context and trust required to act safely.

## What the MVP supports

- **Operations overview:** cross-merchant workload, ageing, payment blocks, inventory constraints, and an operations brief.
- **Unified order queue:** actionable-first default; filter by merchant, store, payment, fulfilment, age, priority, exception, and date; sort by priority, age, merchant, or value.
- **Merchant backlog view:** open, paid-unfulfilled, ageing, partial, blocked, average age, oldest order, trend, service target, and risk.
- **Order detail:** merchant/store identity, customer, line items, inventory, notes, exceptions, rule-based priority, rationale, and next step.
- **Exceptions and inventory:** supporting data, exact thresholds, and human-reviewed recommendations.
- **Ask StoreOps:** grounded cross-store and merchant-scoped operational questions with linked records and deterministic fallback.

The product model is explicit:

```text
Fulfilment provider
└── Client merchant
    └── Shopify store
        ├── Orders and fulfilment tasks
        ├── Customers (same-store identity/value only)
        ├── Products and inventory
        └── Operational alerts
```

## Demo data

The default public experience contains one fictitious fulfilment provider, eight fictitious merchants, eight simulated Shopify stores, 56 orders, and supporting products and anonymized customers. It includes paid/unfulfilled, fulfilled, partial, payment-blocked, 24-hour and 48-hour ageing, high-value delay, increasing backlog, inventory constraints, repeat customers, and one clear/no-risk merchant. All emails use `.test`; no identity or record represents a real party.

| Operations overview | Unified order queue |
|---|---|
| ![Multi-merchant fulfilment overview](./docs/screenshots/overview-multi-merchant.png) | ![Unified multi-merchant order queue](./docs/screenshots/unified-order-queue.png) |

![Responsive operations overview](./docs/screenshots/mobile-overview-multi-merchant.png)

## Alert and priority logic

Alerts are deterministic. The model does not decide whether a rule was crossed.

| Signal | Prototype rule |
|---|---|
| Paid and unfulfilled | Open order with confirmed payment |
| Age warning / overdue | Open order beyond 24h / 48h |
| High-value delay | Open order value at least 500 in store currency |
| High-value customer delay | Same-store customer value and delay thresholds both crossed |
| Partial fulfilment | Shopify fulfilment state is partial |
| Payment blocked | Open order without paid or authorized status |
| Inventory constraint | Same-store variant availability below required quantity |
| Increasing merchant backlog | Open orders and period-over-period increase cross configured thresholds |

The **operational priority score** combines order age, merchant service-level target, payment readiness, fulfilment state, order value, same-store customer value, merchant backlog, and inventory availability. It is rule-based prioritization—not predictive AI or autonomous decision-making. Defaults live in `lib/domain/config.ts` and require operator validation before production use.

## Grounded AI approach

1. Classify the question into a closed intent registry.
2. determine all-store, merchant, or store scope.
3. Retrieve only records inside that scope.
4. Calculate metrics, alerts, and priority outside the model.
5. Build a source-derived answer and record allowlist.
6. Send minimal structured context to the OpenAI Responses API.
7. Require strict JSON-schema output and validate it with Zod.
8. Reject altered text, values, ordering, links, or record identifiers.
9. Use the deterministic answer on missing credentials or any failure.

The model cannot invent stores, merge unrelated merchant data, change calculations, create alerts, execute GraphQL, or perform a write. Facts and recommendations remain visibly separate.

## Architecture

```mermaid
flowchart LR
  O["Fulfilment operator"] --> UI["Next.js operator workspace"]
  UI --> DATA{"Server-side data mode"}
  DATA --> DEMO["Eight-store synthetic snapshot"]
  DATA --> SHOP["One token per Shopify store"]
  SHOP --> GQL["Admin GraphQL API 2026-07"]
  DEMO --> DOMAIN["Provider → merchant → store domain model"]
  GQL --> DOMAIN
  DOMAIN --> RULES["Deterministic metrics, alerts, priority"]
  RULES --> FALLBACK["Deterministic brief and answers"]
  RULES --> RETRIEVE["Scoped retrieval + record allowlist"]
  RETRIEVE --> OPENAI["OpenAI Responses API (optional)"]
  OPENAI --> VALIDATE["Schema + exact evidence validation"]
  VALIDATE --> UI
  FALLBACK --> UI
```

See [the detailed architecture](./docs/architecture.md).

## Run locally

```bash
git clone https://github.com/umeanougo/storeops-copilot.git
cd storeops-copilot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Explicit demo mode

```bash
cp .env.example .env.local
# Keep STOREOPS_DATA_MODE=demo
npm run dev
```

No credentials are required. Missing live credentials or a failed live request produces a visible demo fallback rather than a broken public experience.

## Optional live Shopify connection

The prototype supports one development store through `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ADMIN_ACCESS_TOKEN`, or multiple server-side connections through `SHOPIFY_STORES_JSON`. Each configured connection includes internal merchant/store IDs, names, domain, token, API version, and connection state. Tokens never enter browser code.

Required read scopes are `read_orders`, `read_customers`, `read_products`, and `read_inventory`; add `read_all_orders` only when approved access beyond Shopify’s default order-history window is required. This portfolio integration uses a development/custom-app token path, not production public-app OAuth.

```bash
STOREOPS_DATA_MODE=live
SHOPIFY_API_VERSION=2026-07
SHOPIFY_STORE_DOMAIN=example.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
```

For multiple stores, see `.env.example`. Never commit credentials. Live multi-store behavior remains credential-dependent and has not been verified against eight real stores.

## Optional OpenAI connection

```bash
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-5.6-terra
```

Without a key, the full product remains usable through deterministic briefs and answers.

## Security, privacy, and tenant separation

- Public data is simulated and clearly labelled; no client, merchant, or customer PII is committed.
- Shopify and OpenAI credentials are server-only and ignored by Git.
- The product is read-only: no fulfilment, inventory, order, customer, or refund mutation routes exist.
- Retrieval and customer value are scoped by merchant and store identifiers.
- The public demo is an internal operator view; it does not imply merchants can see one another’s data.

Production would require Shopify OAuth and merchant authorization, encrypted tenant-scoped token storage and rotation, role-based access, row-level tenant isolation, audit logs, retention/deletion controls, privacy agreements, protected-customer-data review, LLM governance, observability, and incident response. See [security and privacy notes](./docs/security-privacy.md).

## Trade-offs and limitations

- Demo-first proves the workflow without pretending the access model is production-ready.
- Structured retrieval is simpler and safer than a vector database for this bounded dataset.
- A server-side connection list is sufficient for the prototype; production needs encrypted persistence and OAuth lifecycle handling.
- Rules are inspectable but not yet calibrated with external operator testing.
- The snapshot is read-oriented; no webhooks, background sync, carrier events, complete history, location allocation, or fulfilment writes.
- Currency is preserved per store and not summed into a misleading cross-currency revenue metric.
- The system does not know staffing, carrier cutoffs, margin, inbound stock, or merchant-specific exception policy.

## Dogfooding and proposed success metrics

Personal dogfooding covered all-store review, merchant/store filtering, 48-hour ageing, payment readiness, partial fulfilment, inventory blocks, no-risk merchants, scoped questions, invalid references, and deterministic fallbacks. These are personal observations, not external user feedback; see [dogfooding notes](./docs/dogfooding-notes.md).

Future validation would measure time to identify awaiting work, account switches per operator, time to review backlogs, overdue-order recall, alert usefulness and false-positive rate, time from readiness to fulfilment action, orders within service targets, operator confidence, cited-answer support, unsupported-question declines, and repeat use. All are **proposed metrics**; no measured improvement is claimed.

## Quality checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Roadmap if the hypothesis earns investment

1. Observe five fulfilment operators completing a real morning triage and compare the queue with their source-of-truth review.
2. Calibrate per-merchant service levels, alert usefulness, false positives, and exception policy.
3. Add OAuth, encrypted token lifecycle, tenant isolation, roles, and audit logging.
4. Add webhook-driven incremental sync, coverage diagnostics, bulk history, location-aware inventory, and carrier events.
5. Evaluate safe, confirmed handoffs into Shopify Admin before considering any write action.

## Shopify application context

I built this project for an active Shopify Product Manager application to demonstrate direct workflow discovery, merchant/operator empathy, Shopify data-model and API fluency, narrow MVP judgment, AI-assisted implementation, dogfooding, testing, and the ability to move independently from an ambiguous problem to working software. AI coding tools accelerated framing, implementation, debugging, testing, and documentation; I retained responsibility for product scope, rules, safeguards, technical validation, and quality.

## Portfolio artifacts

- [Case study](./app/case-study/page.tsx)
- [Methodology](./app/methodology/page.tsx)
- [Architecture](./docs/architecture.md)
- [Dogfooding notes](./docs/dogfooding-notes.md)
- [Demo scripts](./docs/demo-script.md)
- [Application and resume copy](./docs/application-copy.md)
- [Screenshot plan](./docs/screenshots.md)
- [Security and privacy](./docs/security-privacy.md)

Portfolio source available for review under [PORTFOLIO-LICENSE.md](./PORTFOLIO-LICENSE.md). Built independently by Ugo Umeano; not affiliated with or endorsed by Shopify.
