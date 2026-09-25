import { AlertTriangle, Bot, Calculator, Database, FlaskConical, LockKeyhole, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getStoreResult } from "@/lib/data/store";
import { DEFAULT_THRESHOLDS } from "@/lib/domain/config";

export const dynamic = "force-dynamic";

const layers = [
  { icon: Database, step: "01", title: "Keep ownership explicit", body: "Every order, customer, product, task, and alert carries a merchant and store ID before analysis begins." },
  { icon: Calculator, step: "02", title: "Calculate before explaining", body: "Typed functions calculate ageing, payment blocks, inventory checks, backlog state, alerts, and operational priority." },
  { icon: Bot, step: "03", title: "Constrain optional model output", body: "The server writes the approved answer first. Any model output that changes a sentence, value, link, record, or order is rejected." },
];

export default async function MethodologyPage() {
  const result = await getStoreResult();
  const snapshot = result.snapshot;
  const currency = snapshot.stores[0]?.currencyCode || "CAD";
  const highValue = new Intl.NumberFormat("en-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(DEFAULT_THRESHOLDS.highValueOrderAmount);
  const rules = [
    ["Paid, still open", "Payment is PAID and fulfilment is not complete"],
    ["Ageing warning", `Open for more than ${DEFAULT_THRESHOLDS.ageingWarningHours} hours`],
    ["Overdue", `Open for more than ${DEFAULT_THRESHOLDS.overdueHours} hours`],
    ["High-value review", `${highValue}+ in the store currency and awaiting fulfilment`],
    ["Partial fulfilment", "Display fulfilment status is PARTIALLY_FULFILLED"],
    ["Payment block", "Payment is neither PAID nor AUTHORIZED"],
    ["Merchant backlog", snapshot.source === "demo" ? `${DEFAULT_THRESHOLDS.backlogOpenOrders}+ open and ${DEFAULT_THRESHOLDS.backlogIncreaseOrders}+ above the seeded demo baseline` : "Current backlog only; trend needs stored history"],
    ["Inventory constraint", "Known same-store availability is below the ordered quantity"],
  ];

  return <AppShell source={snapshot.source} storeName={snapshot.provider.name} storeCount={snapshot.stores.length} warning={result.liveError}>
    <main className="mx-auto max-w-[1040px] px-4 py-7 sm:px-7 lg:px-9 lg:py-10">
      <PageHeader eyebrow="Product and technical methodology" title="How the prototype earns trust" description="StoreOps separates source records, deterministic decisions, and optional model output so a reviewer can inspect where every conclusion came from." />

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Decision pipeline">
        {layers.map(layer => <article key={layer.title} className="rounded-[20px] border border-[var(--line)] bg-white p-6">
          <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf1ec] text-[#425d4c]"><layer.icon size={18} /></span><span className="font-mono text-xs text-[#8a948c]">{layer.step}</span></div>
          <h2 className="mt-6 text-lg font-bold tracking-[-.03em]">{layer.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#667169]">{layer.body}</p>
        </article>)}
      </section>

      <section className="mt-8 rounded-[22px] border border-[var(--line)] bg-white p-5 sm:p-7" aria-labelledby="rulebook-heading">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#758078]">Inspectable defaults</p>
        <h2 id="rulebook-heading" className="mt-2 text-2xl font-bold tracking-[-.04em]">Operational rulebook</h2>
        <p className="mt-2 max-w-[720px] text-sm leading-6 text-[#667169]">These thresholds are prototype inputs for operator review, not validated policy or machine-learning predictions.</p>
        <dl className="mt-6 divide-y divide-[var(--line)]">{rules.map(([rule, threshold]) => <div key={rule} className="grid gap-1 py-4 sm:grid-cols-[200px_1fr] sm:gap-6"><dt className="text-sm font-bold">{rule}</dt><dd className="text-sm leading-6 text-[#667169]">{threshold}</dd></div>)}</dl>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <TrustCard icon={ShieldCheck} title="Grounding safeguards" items={["Question scope detected before retrieval", "Merchant and store IDs retained in context", "Same-store customer and inventory joins only", "Metrics calculated outside the model", "Exact schema and evidence validation", "Deterministic fallback on any mismatch"]} />
        <TrustCard icon={AlertTriangle} title="Deliberate limits" items={["No unrestricted SQL or GraphQL generation", "No merged customer histories across merchants", "No causal or measured-outcome claims", "No prediction or autonomous decisions", "No write or fulfilment actions", "Insufficient-information responses are explicit"]} />
        <TrustCard icon={FlaskConical} title="Demo and live boundaries" items={["Eight fictitious merchants and stores", "Every public identity is synthetic", "Public production builds force demo mode", "Local live connections stay server-side", "One token per authorized development store", "Visible demo fallback when retrieval fails"]} />
        <TrustCard icon={LockKeyhole} title="What production would require" items={["Strict tenant isolation", "Role-based operator access", "Shopify OAuth and merchant authorization", "Encrypted token storage and rotation", "Audit logs and retention controls", "LLM data governance and evaluation"]} />
      </section>

      <section className="mt-8 rounded-[22px] bg-[#26362d] p-6 text-white sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#e9c875]">Priority model</p>
        <h2 className="mt-3 text-2xl font-bold tracking-[-.04em]">A review ranking, not a prediction</h2>
        <p className="mt-3 max-w-[800px] text-sm leading-6 text-[#c5d2c9]">The 0–100 score combines order age, payment confirmation, fulfilment state, partial fulfilment, order value, same-store customer value, merchant service-level target, backlog state, known inventory availability, and manual exception signals. Operators still own the decision.</p>
      </section>
    </main>
  </AppShell>;
}

function TrustCard({ icon: Icon, title, items }: { icon: typeof ShieldCheck; title: string; items: string[] }) {
  return <article className="rounded-[20px] border border-[var(--line)] bg-white p-6">
    <div className="flex items-center gap-2.5"><Icon size={17} className="text-[#a95337]" /><h2 className="text-base font-bold">{title}</h2></div>
    <ul className="mt-4 space-y-2.5">{items.map(item => <li key={item} className="flex gap-3 text-[13px] leading-5 text-[#667169]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8fa094]" />{item}</li>)}</ul>
  </article>;
}
