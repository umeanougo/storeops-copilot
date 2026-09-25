"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Database, ExternalLink, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import type { AskStoreAnswer } from "@/lib/grounding/ask-store";

const prompts = [
  "Which merchant has the most overdue orders?",
  "Show all paid orders that are still unfulfilled.",
  "Which orders have been waiting longer than 48 hours?",
  "What should the fulfilment team process first?",
  "Show blocked orders by merchant.",
  "Which products may prevent today’s orders from being fulfilled?",
];

export function AskStore({ initialQuestion = "" }: { initialQuestion?: string }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(initialQuestion);
  const [answer, setAnswer] = useState<AskStoreAnswer | null>(null);
  const [loading, setLoading] = useState(Boolean(initialQuestion));
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function ask(value: string) {
    if (!value.trim() || loading) return;
    setAsked(value);
    setAnswer(null);
    setError("");
    setLoading(true);
    setQuestion("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not answer that question");
      setAnswer(data);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not answer that question");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialQuestion) return;
    let active = true;

    fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: initialQuestion }),
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) setAnswer(data);
      })
      .catch(issue => {
        if (active) setError(issue instanceof Error ? issue.message : "Could not answer that question");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialQuestion]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  function reset() {
    setAsked("");
    setAnswer(null);
    setError("");
    input.current?.focus();
  }

  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[22px] border border-[#dce1da] bg-[#fffefa] panel-shadow">
      <header className="flex items-center justify-between border-b border-[#e7eae5] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6eee8] text-[#315c49]">
            <Sparkles size={17} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#26342c]">Ask StoreOps</h2>
            <p className="mt-0.5 text-xs text-[#737d75]">Scoped records · deterministic calculations</p>
          </div>
        </div>
        {asked && (
          <button
            type="button"
            onClick={reset}
            className="grid h-10 w-10 place-items-center rounded-xl text-[#667269] transition hover:bg-[#f1f2ef] hover:text-[#26342c]"
            aria-label="Start a new question"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col p-5 sm:p-7">
        {!asked && !loading && (
          <div className="my-auto py-4">
            <div className="mx-auto max-w-[560px] text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#244f40] text-[#f4d77e]">
                <Sparkles size={20} />
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-[-.04em] text-[#1f2c24]">
                Ask a focused operations question
              </h3>
              <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-[#657068]">
                The assistant selects records within the detected merchant or store scope, applies transparent rules, and links matching findings to their source records. Unsupported questions are declined.
              </p>
            </div>

            <div className="mx-auto mt-7 grid max-w-[760px] gap-2.5 sm:grid-cols-2">
              {prompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void ask(prompt)}
                  className="min-h-12 rounded-xl border border-[#e0e4de] bg-[#faf9f6] px-4 py-3 text-left text-[13px] font-semibold leading-5 text-[#4b5850] transition hover:border-[#a8b6aa] hover:bg-[#f4f6f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b64d2f]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {asked && (
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#244f40] px-4 py-3 text-sm leading-6 text-white sm:max-w-[72%]">
            {asked}
          </div>
        )}

        {loading && (
          <div className="mt-4 max-w-[90%] rounded-2xl rounded-bl-md border border-[#e1e5df] bg-white p-5" role="status">
            <div className="flex items-center gap-2.5 text-[13px] text-[#5f6b63]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#c95a36]" />
              Retrieving same-scope records and applying rules…
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl bg-[#fff0eb] p-4 text-sm text-[#8d422f]" role="alert">
            {error}
          </div>
        )}

        {answer && (
          <article className="mt-4 max-w-full rounded-2xl rounded-bl-md border border-[#dce2db] bg-[#fbfcf9] p-5 sm:p-6" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${
                  answer.supported ? "bg-[#e7f0e8] text-[#3e684b]" : "bg-[#fff0e8] text-[#99523a]"
                }`}
              >
                {answer.supported ? "Record-supported" : "Not supported"}
              </span>
              <span className="text-xs text-[#7d867f]">
                {answer.generatedBy === "openai" ? "Validated model output" : "Deterministic answer"}
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold tracking-[-.03em] text-[#1f2c24]">{answer.heading}</h3>
            <p className="mt-2 text-sm leading-6 text-[#56625a]">{answer.answer}</p>

            {answer.evidence.length > 0 && (
              <div className="mt-6">
                <p className="small-caps mb-2 text-[10px] font-bold text-[#758078]">Source records</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {answer.evidence.map(item => (
                    <Link
                      key={`${item.recordType}-${item.recordId}`}
                      href={item.href as never}
                      className="group rounded-xl border border-[#e1e5df] bg-white p-4 transition hover:border-[#aebbb0]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[.08em] text-[#858f87]">{item.recordType}</span>
                        <ExternalLink size={13} className="text-[#969f98] group-hover:text-[#b64d2f]" />
                      </div>
                      <p className="mt-2 text-sm font-bold text-[#26342c]">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6d776f]">{item.value}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl bg-[#eef3e8] p-4">
              <p className="small-caps text-[10px] font-bold text-[#5d735f]">Recommended next step</p>
              <p className="mt-1.5 text-[13px] leading-5 text-[#4f5f54]">{answer.recommendation}</p>
            </div>

            <div className="mt-5 border-t border-[#e6e9e4] pt-4 text-xs leading-5 text-[#737d75]">
              <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-semibold text-[#5c685f]">
                <span className="inline-flex items-center gap-1.5"><Database size={13} />Scoped records</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} />Read-only</span>
              </div>
              {answer.caveat}
            </div>
          </article>
        )}
      </div>

      <form
        onSubmit={submit}
        className="m-4 flex items-center gap-3 rounded-2xl border border-[#d5dbd4] bg-white px-4 py-2.5 shadow-[0_8px_25px_rgba(20,40,25,.05)] focus-within:border-[#829c89] focus-within:ring-2 focus-within:ring-[#829c89]/20 sm:m-5"
      >
        <input
          ref={input}
          value={question}
          onChange={event => setQuestion(event.target.value)}
          maxLength={500}
          placeholder="Ask about workload, orders, blocks, or inventory…"
          aria-label="StoreOps question"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-[#929a94] sm:text-sm"
        />
        <button
          disabled={!question.trim() || loading}
          aria-label="Ask question"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#244f40] text-white transition hover:bg-[#1d4436] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowUp size={17} />
        </button>
      </form>
    </section>
  );
}
