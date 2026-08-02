# Security and privacy notes

## Confirmed prototype boundaries

- The repository contains no client data, real merchant data, or real customer PII.
- Every public record is fictitious, labelled simulated, and uses reserved `.test` emails where needed.
- Shopify and OpenAI secrets are read only in server code; ignored environment files are not committed.
- Admin API tokens are never returned by browser routes or logged.
- Shopify access is read-only and there are no mutation or action endpoints.
- Merchant and store IDs are required on orders, customers, products, alerts, recommendations, and tasks.
- Customer value and retrieval filters remain inside the same merchant/store boundary.
- AI receives only scoped records relevant to the question; output is schema-validated and checked against an exact record allowlist.
- Unsupported questions and provider failures decline or fall back deterministically.

The demo is an internal fulfilment-operator view across client stores. It does not represent a merchant-facing tenancy model and does not imply one merchant can access another merchant’s records.

## Data minimization

The Shopify adapter avoids addresses, phone numbers, payment details, and full contact records. Notes are retrieved only to support simulated operational context; a production design should redact or exclude them from model input by default. The model should receive no field that cannot change the answer.

## Why write actions are excluded

Fulfilment, order, inventory, customer, and refund writes can create financial and customer impact. This prototype lacks the authorization, confirmation, idempotency, audit, rollback, and merchant-policy controls required to perform them safely. “Recommended next step” is advice for human review, never an executed action.

## Production requirements

- Shopify OAuth, merchant authorization, scoped reauthorization, and token revocation
- encrypted tenant-scoped token storage and rotation
- role-based access, least privilege, and row-level tenant isolation
- immutable audit logs for record access, recommendations, and confirmed actions
- encryption in transit and at rest, secrets management, and sanitized observability
- retention, export, deletion, and legal/privacy agreement workflows
- protected-customer-data review and regional/data-residency controls
- webhook signature verification, replay protection, incremental sync, and coverage diagnostics
- LLM vendor assessment, data-processing controls, redaction, retention settings, prompt-injection tests, and systematic factuality evals
- incident response, backup, disaster recovery, and operator-access review

This is a portfolio design note, not a production security certification.
