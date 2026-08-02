# Personal dogfooding notes

This journal records personal testing of the portfolio prototype. It is **not merchant feedback** and does not represent external validation.

## Questions used during testing

- Which orders have been waiting the longest?
- Which products are running low?
- Which products have too much inventory?
- Which three issues should I address first?
- Did refunds increase recently?
- Which customers have the highest lifetime value?
- Why was order #1052 flagged?
- What is gross margin by channel? (unsupported-case test)

## Early interactions that felt confusing

- “AI-generated brief” would have been misleading when no key was present. The UI now labels the result “Rule-generated” or “AI-constrained.”
- An inventory warning without its threshold felt arbitrary. Issue detail now shows the exact rule and configured threshold.
- A recommendation next to a finding could look like an automated action. The product now labels it a suggested review step and repeats the read-only boundary.
- A demo that silently fell back after a live error could hide integration failure. The source banner now states when live mode was requested but demo fallback is active.

## False or weak alerts identified

- High inventory alone was too weak. The excess rule now requires both high availability and low 30-day velocity.
- Customer lifetime value alone was not an operational issue. Customer risk now requires a linked overdue order.
- Refund count alone lacked a baseline. The rule now compares the current seven-day count with the immediately preceding period.
- Two customer-risk alerts originally tied at the maximum priority, allowing alphabetical order to decide the sequence. The score now uses elapsed delay and lifetime-value bands as deterministic tie-breakers.

## Grounding improvements

- Natural-language questions map to a closed intent registry rather than arbitrary database queries.
- Relevant records are selected before the model call instead of sending the entire dataset.
- Every evidence record ID is checked against an allowlist.
- Unsupported questions return no citations and clearly state the missing data.
- Any OpenAI error, invalid schema, or unknown evidence ID uses the deterministic fallback.

## Edge cases exercised

- exactly 48 hours versus one millisecond beyond the threshold
- fulfilled old order versus unfulfilled old order
- inventory exactly at versus below the floor
- zero inventory severity
- high inventory with adequate recent velocity
- missing Shopify customer, fulfilment, variant, and money fields
- empty dataset and no-alert brief
- missing Shopify credentials
- missing OpenAI key
- unknown record reference in a generated answer

## What still feels incomplete

- Prototype defaults need merchant-specific validation.
- The refund baseline is intentionally simple.
- Priority scoring would benefit from merchant feedback on urgency and impact.
- Live history coverage should be explicit at record and metric level.
- The app does not yet support conversational follow-ups or record disambiguation.
- Live development-store behavior still needs credential-backed verification.

## Next dogfooding session

Run the three-minute script without shortcuts. Record every moment that requires explaining around the interface. Any explanation that should be visible in-product becomes a copy or hierarchy candidate; anything that is secondary stays in the case study.
