import Link from "next/link";
import { ArrowRight, Code2, Gauge, HeartHandshake, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaseSection } from "@/components/case-section";
import { getStoreResult } from "@/lib/data/store";

export const dynamic = "force-dynamic";

const proposedMetrics = [
  "Time required to identify all orders awaiting action",
  "Shopify account switches per operator per day",
  "Time required to review merchant backlogs",
  "Percentage of overdue orders identified correctly",
  "Percentage of alerts judged useful",
  "False-positive alert rate",
  "Time from order readiness to fulfilment action",
  "Orders processed within merchant service-level targets",
  "Operator confidence in prioritization",
  "AI answers supported by cited records",
  "Unsupported questions correctly declined",
  "Repeat operator usage",
];

const tradeOffs = [
  "Demo-first access instead of an onboarding dependency.",
  "Structured filtering instead of a vector database.",
  "Deterministic answer construction before optional model output.",
  "One server adapter that can aggregate multiple connections, without building full OAuth or persistence.",
  "Read-only review steps instead of fulfilment mutations.",
  "Bounded pagination and snapshots instead of background synchronization.",
];

const validationSteps = [
  "Ask a fulfilment operator to reconstruct the last three cross-store decisions and account switches.",
  "Run a task test: find every ready, blocked, and overdue order without explanation from the builder.",
  "Compare the operator’s priority order with the rule score and inspect disagreements.",
  "Review alert usefulness, false positives, merchant boundaries, and confidence in evidence.",
  "Test whether the brief changes team-focus decisions before expanding the product.",
];

export default async function CaseStudyPage() {
  const result = await getStoreResult();
  const snapshot = result.snapshot;

  return (
    <AppShell
      source={snapshot.source}
      storeName={snapshot.provider.name}
      storeCount={snapshot.stores.length}
      warning={result.liveError}
    >
      <main className="mx-auto max-w-[1050px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[26px] bg-[#1f2d26] px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="small-caps text-[11px] font-bold text-[#efc976]">
            Product case study · Independent portfolio work
          </p>
          <h1 className="mt-5 max-w-[820px] text-[40px] font-bold leading-[1.04] tracking-[-.05em] sm:text-[58px]">
            One fulfilment queue across merchant-owned Shopify stores.
          </h1>
          <p className="mt-6 max-w-[740px] text-[16px] leading-7 text-[#cbd6cf]">
            A rules-first operations prototype based on observed workflow friction. It explores how a
            fulfilment team could prioritize work across client stores without losing merchant context.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/orders"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#efc976] px-5 py-3 text-[13px] font-bold text-[#263229]"
            >
              Open order queue <ArrowRight size={15} />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 py-3 text-[13px] font-bold"
            >
              Review methodology
            </Link>
          </div>
        </section>

        <section className="grid gap-3 py-6 sm:grid-cols-3" aria-label="Case study summary">
          <SummaryFact
            icon={HeartHandshake}
            label="Primary user"
            value="Third-party fulfilment operator"
          />
          <SummaryFact
            icon={Gauge}
            label="Focused MVP"
            value="Queue, backlogs, and explainable priority"
          />
          <SummaryFact
            icon={ShieldCheck}
            label="Trust model"
            value="Scoped records → rules → validated output"
          />
        </section>

        <section className="mb-8 rounded-[22px] border border-[#dfe2dc] bg-[#fffefa] p-6 sm:p-8">
          <p className="small-caps text-[11px] font-bold text-[#a65438]">Executive summary</p>
          <h2 className="mt-3 text-[28px] font-bold tracking-[-.04em] text-[#1f2a23]">
            The product judgment in three decisions
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <SummaryDecision
              number="01"
              title="Unify the decision, not the data"
              body="The operator needs one ranked view of work while every record retains its merchant and store boundary."
            />
            <SummaryDecision
              number="02"
              title="Make priority inspectable"
              body="Typed rules calculate backlog, ageing, blockers, and priority. The prototype makes no predictive claim."
            />
            <SummaryDecision
              number="03"
              title="Validate value before automation"
              body="The MVP is read-only and uses synthetic data. The next test is operator behavior, not more infrastructure."
            />
          </div>
        </section>

        <ChapterIntro
          label="Problem framing"
          title="Start with the operator’s decision"
          description="The discovery evidence points to reconciliation across stores—not access to another dashboard—as the useful problem to test."
        />

        <CaseSection number="01" title="Discovery context">
          <p>
            While helping a third-party fulfilment operator examine its Shopify workflows, I observed
            the team repeatedly switch between merchant-owned Shopify accounts to review orders and
            complete fulfilment on each merchant’s behalf. I mapped that workflow and independently
            built StoreOps Copilot to test whether one explainable queue could improve cross-merchant
            prioritization.
          </p>
          <p>
            The operator managed approximately eight merchant accounts and performed approximately 24
            recurring account and workflow checks per day. Those figures describe discovery context
            only; this prototype does not serve those merchants or process production orders.
          </p>
        </CaseSection>

        <CaseSection number="02" title="User">
          <p>
            The primary user is a fulfilment operator or team lead working across client-owned Shopify
            stores—not a merchant managing one store. They need to protect merchant context while
            checking readiness, assigning work, and tracking exceptions.
          </p>
        </CaseSection>

        <CaseSection number="03" title="Existing workflow">
          <p>
            Operators switched account context, reviewed orders store by store, checked payment and line
            items, judged fulfilment readiness, processed work on the merchant’s behalf, and tracked what
            remained. The repeated reconciliation—not access to raw data—was the core friction.
          </p>
        </CaseSection>

        <CaseSection number="04" title="Core problem">
          <p>
            There was no cross-merchant answer to: “Across every merchant we support, what does the
            fulfilment team need to act on today?” Work could age while attention was divided across
            separate admin sessions.
          </p>
        </CaseSection>

        <CaseSection number="05" title="Product hypothesis">
          <p>
            If paid open orders, blocks, ageing, inventory constraints, and merchant backlogs are
            consolidated into one explainable queue, operators can identify the right work with less
            account switching and stronger context.
          </p>
          <p>This remains a hypothesis. No external outcome or time-saving claim has been measured.</p>
        </CaseSection>

        <ChapterIntro
          label="Product design"
          title="A narrow, read-only MVP"
          description="The prototype prioritizes the morning-triage workflow and defers operational writes until the workflow proves useful."
        />

        <CaseSection number="06" title="MVP definition">
          <p>
            The MVP includes an eight-store simulated dataset, unified order queue, merchant and store
            filters, merchant backlog view, order detail, deterministic exceptions and priority, a daily
            operations brief, and grounded cross-store questions. It remains read-only.
          </p>
        </CaseSection>

        <CaseSection number="07" title="Why a unified queue">
          <p>
            The queue optimizes for actionable fulfilment work rather than total commerce reporting.
            Every row carries merchant, store, payment, fulfilment, age, items, priority, exceptions, and
            a next step. Operators can filter without losing ownership context.
          </p>
        </CaseSection>

        <CaseSection number="08" title="Multi-merchant data model">
          <p>
            The domain makes the hierarchy explicit: fulfilment provider → merchant → Shopify store →
            order, customer, product, alert, and task. Customer value is calculated only inside one
            merchant and store boundary. The public demo represents an internal operator view;
            production would require strict tenant isolation and role-based access.
          </p>
        </CaseSection>

        <CaseSection number="09" title="Prioritization logic">
          <p>
            Operational priority is a deterministic score using order age, payment confirmation,
            fulfilment state, partial fulfilment, order value, same-store customer value, merchant
            service-level target, backlog risk, inventory availability, and manual exception signals.
          </p>
          <p>It is rule-based prioritization—not prediction, machine-learning risk, or autonomous decision-making.</p>
        </CaseSection>

        <ChapterIntro
          label="Trust and architecture"
          title="Keep the model non-authoritative"
          description="Source records and deterministic functions produce the operational answer. The optional model layer cannot alter it."
        />

        <CaseSection number="10" title="AI approach">
          <p>
            Typed retrieval first determines whether a question applies to one merchant, one store, or
            the full portfolio. Domain functions select same-scope records, calculate the facts, and
            construct the complete allowed answer. The OpenAI Responses API is optional and
            non-authoritative: the model may return only that exact answer. Any changed schema, sentence,
            value, ordering, link, merchant ID, store ID, or cited record is rejected, and the
            deterministic answer is shown instead.
          </p>
        </CaseSection>

        <CaseSection number="11" title="Product and technical trade-offs">
          <ul className="space-y-3">
            {tradeOffs.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c95a36]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CaseSection>

        <CaseSection number="12" title="Privacy and tenant isolation">
          <p>
            No client data, real merchant data, or real customer information is present. Demo identities
            are synthetic. Tokens remain server-side, and the public data route returns demo records
            only. A production version would require OAuth, encrypted per-store token storage,
            role-based access, audit logs, retention controls, merchant authorization, and LLM
            governance.
          </p>
        </CaseSection>

        <ChapterIntro
          label="Validation"
          title="Separate evidence from ambition"
          description="The build is tested; the product outcome is not. The next milestone is observed operator behavior."
        />

        <CaseSection number="13" title="Dogfooding">
          <p>
            I tested cross-merchant workload review, merchant and store filters, 48-hour orders, payment
            blocks, partially fulfilled orders, no-risk merchants, cross-store questions,
            merchant-specific questions, invalid references, and deterministic fallback. These are
            personal product tests—not external user feedback.
          </p>
        </CaseSection>

        <CaseSection number="14" title="Proposed success metrics">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {proposedMetrics.map((metric) => (
              <div
                key={metric}
                className="rounded-xl border border-[#e1e4df] bg-white p-3.5 text-[13px] leading-5 text-[#4e5a52]"
              >
                {metric}
              </div>
            ))}
          </div>
          <p>All measures are proposed until a real operator validation session occurs.</p>
        </CaseSection>

        <CaseSection number="15" title="Next validation steps">
          <ol className="space-y-4">
            {validationSteps.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="font-mono text-[11px] text-[#a65438]">0{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </CaseSection>

        <CaseSection number="16" title="What I learned">
          <p>
            The largest correction was product framing: the valuable unit of work is not one store’s
            health but an operator decision across many client stores. Making merchant and store identity
            mandatory throughout the data model improved the queue, rules, explanations, and model
            safeguards at the same time.
          </p>
          <div className="flex items-start gap-3 rounded-xl border border-[#d7e1d8] bg-[#f3f8f3] p-4">
            <Code2 size={18} className="mt-0.5 shrink-0 text-[#3f6d50]" />
            <p className="text-[13px] leading-6">
              AI coding tools supported exploration, implementation, testing, debugging, and
              documentation. I retained responsibility for problem framing, scope, rule design,
              validation, and release quality.
            </p>
          </div>
        </CaseSection>
      </main>
    </AppShell>
  );
}

function SummaryFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HeartHandshake;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe2dc] bg-[#fffefa] p-5">
      <Icon size={18} className="text-[#b75436]" />
      <p className="small-caps mt-5 text-[11px] font-bold text-[#7b857d]">{label}</p>
      <p className="mt-1.5 text-[15px] font-bold leading-6 text-[#263029]">{value}</p>
    </div>
  );
}

function SummaryDecision({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] text-[#a65438]">{number}</p>
      <h3 className="mt-2 text-[16px] font-bold tracking-[-.02em] text-[#263029]">{title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-[#657068]">{body}</p>
    </div>
  );
}

function ChapterIntro({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="border-t-2 border-[#26362d] pb-2 pt-12">
      <p className="small-caps text-[11px] font-bold text-[#a65438]">{label}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] sm:items-end">
        <h2 className="text-[30px] font-bold tracking-[-.045em] text-[#1f2a23]">{title}</h2>
        <p className="text-[13px] leading-6 text-[#657068]">{description}</p>
      </div>
    </div>
  );
}
