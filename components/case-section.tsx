export function CaseSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="grid gap-3 border-t border-[#dfe3dc] py-8 sm:grid-cols-[110px_minmax(0,1fr)]"><p className="font-mono text-[9px] text-[#929a93]">{number}</p><div><h2 className="text-[20px] font-bold tracking-[-.04em]">{title}</h2><div className="mt-4 space-y-4 text-[11px] leading-6 text-[#5f6b63]">{children}</div></div></section>;
}
