# Demo scripts

## 30-second verbal summary

StoreOps Copilot is an independently built Shopify operations portfolio prototype. It helps a merchant answer “What needs attention today?” by applying transparent rules to orders, inventory, customers, and refunds. The product shows the source data, exact threshold, and a recommended review step for every issue. OpenAI is optional and constrained to a source-derived answer allowlist; it never calculates metrics, creates alerts, or changes Shopify data. The full experience works with simulated data and no credentials.

## 90-second walkthrough

**0:00–0:15 — Problem**

“Merchants often have plenty of data, but still have to reconcile several screens to decide what needs attention. I built StoreOps Copilot to explore whether explainable priorities can shorten that path.”

**0:15–0:35 — Overview**

Open the Overview. Point to the simulated-data label and Daily Operations Brief. Explain that severity and ranking come from deterministic rules.

**0:35–0:55 — Overdue order**

Open order #1052. Show the 76-hour age, paid status, high-value customer context, 48-hour threshold, and recommended review step.

**0:55–1:10 — Inventory**

Open the Linen Throw alert. Show 142 units available, two 30-day sales, the exact excess rule, and the warning that seasonality and margin are missing.

**1:10–1:25 — Ask Store**

Ask “Which three issues should I address first?” Point to linked evidence and the read-only label.

**1:25–1:30 — Close**

“The key product decision was to constrain model output to source-derived claims while keeping operational facts and judgment boundaries testable.”

## Three-minute walkthrough

**0:00–0:25 — Problem and user**

“While helping a business evaluate Shopify fulfilment operations, I observed that access to data did not make daily prioritization easy. A merchant or fulfilment lead still had to decide what mattered, why, and what to do next. I independently built this portfolio prototype to test a narrower hypothesis: transparent rules plus grounded AI can make those decisions easier to inspect.”

**0:25–0:50 — Overview and brief**

Open Overview. Point out the persistent “simulated demo data” label. Show the seven-day metrics and Daily Operations Brief.

“The brief is not a free-form model opinion. Metrics, alerts, severity, and order are calculated before any model call. With no key, the same input produces deterministic fallback copy.”

**0:50–1:20 — Overdue order workflow**

Open the highest-priority delayed order.

“Order #1052 is 76 hours old and still unfulfilled. The detail view separates store facts, the deterministic rule, and the suggested action. The product explains the 48-hour threshold and the high-value customer context. It recommends checking inventory allocation and communicating; it does not edit the order.”

**1:20–1:50 — Inventory workflow**

Return to Overview and open the Linen Throw inventory alert.

“This variant has 142 units available and only two 30-day sales. The rule flags that combination, but the UI explicitly says this is a heuristic: it does not know margin, seasonality, or merchandising plans. The next step is a review or test—not an automatic discount.”

**1:50–2:20 — Grounded natural-language question**

Open Ask Store and select “Which three issues should I address first?”

“The question maps to a closed query registry. The server retrieves only the top rule-based findings. The answer links to the exact alerts. If a model invents an identifier or returns invalid structured output, the app rejects it and uses the deterministic answer.”

Ask an unsupported question such as “What is gross margin by channel?” and show the decline.

**2:20–2:45 — Deterministic versus AI**

Open Methodology.

“Source records are normalized server-side. Rules calculate metrics and findings. The model can return only the exact source-derived answer object; any change falls back. The system has no SQL generation and no Shopify mutation path.”

**2:45–3:00 — Trade-offs and next validation**

“I deferred OAuth, multitenancy, billing, webhooks, and automation because the biggest risk is product value, not infrastructure. Next I would interview five merchants, compare time-to-priority against their current workflow, and measure usefulness, false positives, evidence trust, and unsupported-question handling.”
