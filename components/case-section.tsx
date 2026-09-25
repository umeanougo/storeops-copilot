export function CaseSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="grid gap-3 border-t border-[var(--line)] py-9 sm:grid-cols-[90px_minmax(0,1fr)]"><p className="font-mono text-[11px] text-[#7b857d]">{number}</p><div><h2 className="text-[22px] font-bold tracking-[-.04em]">{title}</h2><div className="mt-4 max-w-[760px] space-y-4 text-[14px] leading-7 text-[#58645c]">{children}</div></div></section>;
}
