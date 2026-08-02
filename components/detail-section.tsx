export function DetailSection({ eyebrow, title, description, children, tone = "default" }: { eyebrow: string; title: string; description?: string; children: React.ReactNode; tone?: "default" | "rule" | "suggestion" }) {
  const style = tone === "rule" ? "border-[#d5e1d7] bg-[#f4f8f4]" : tone === "suggestion" ? "border-[#efdcc5] bg-[#fff8ef]" : "border-[#dfe2dc] bg-[#fffefa]";
  return <section className={`rounded-[20px] border p-5 sm:p-6 ${style}`}><p className="small-caps text-[8px] font-bold text-[#7f8981]">{eyebrow}</p><h2 className="mt-2 text-[16px] font-bold tracking-[-.03em]">{title}</h2>{description&&<p className="mt-2 max-w-[720px] text-[10px] leading-5 text-[#68736b]">{description}</p>}<div className="mt-5">{children}</div></section>;
}

export function FactGrid({ facts }: { facts: { label: string; value: string }[] }) {
  return <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{facts.map(fact=><div key={fact.label} className="rounded-xl border border-black/[.06] bg-white/75 p-3"><dt className="text-[8px] font-medium text-[#7f8981]">{fact.label}</dt><dd className="mt-1.5 text-[11px] font-bold">{fact.value}</dd></div>)}</dl>;
}
