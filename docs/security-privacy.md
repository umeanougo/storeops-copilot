# Security and privacy notes

## Implemented in this prototype

- Demo mode is the default and requires no credentials.
- All demo records are synthetic; emails use the reserved `.test` domain.
- Shopify and OpenAI secrets are read only in server code.
- `.env*` secrets are ignored; `.env.example` contains placeholders only.
- No browser route receives an Admin API token.
- Shopify access is read-only; there are no GraphQL mutations or action routes.
- Queries request a minimized field set.
- Model inputs contain only records relevant to the selected operational question.
- Model output is schema-validated and checked against an evidence allowlist.
- Unsupported questions and model failures fall back or decline.
- Logs avoid tokens and raw customer payloads.

## Data minimization

The live adapter does not request addresses, phone numbers, notes, or full customer contact details. Customer email is not needed for the product workflows. The model should not receive fields that do not change the operational answer.

## Why write actions are excluded

Order, inventory, fulfilment, refund, and customer writes can create financial or customer impact. The prototype lacks the merchant-specific context, authorization model, confirmation UX, audit trail, rollback handling, and production security required to perform those actions safely.

## Risks of sending store data to an LLM

Store data may contain personal information, commercial performance, and operational patterns. A production implementation would require merchant consent, a data-processing assessment, retention and regional controls, protected-customer-data compliance, strict tenant isolation, encryption, audit logs, vendor review, prompt-injection testing, and a minimized or redacted context policy.

## Production safeguards not implemented

- encrypted per-tenant token storage and rotation
- public OAuth and scoped reauthorization
- role-based access and organization boundaries
- retention and deletion workflows
- webhook signature verification and incremental sync
- complete pagination and coverage diagnostics
- rate-limit retries with jitter and circuit breaking
- centralized audit logging and observability
- systematic model evals and red-team testing
- incident response, backup, and disaster recovery

This document describes a portfolio prototype, not a production security certification.
