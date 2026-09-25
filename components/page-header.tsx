export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7b857d]">{eyebrow}</p><h1 className="mt-3 max-w-[850px] text-[36px] font-bold leading-[1.04] tracking-[-.05em] sm:text-[44px]">{title}</h1><p className="mt-3 max-w-[720px] text-[15px] leading-6 text-[#667169]">{description}</p></div>{action}</div>;
}
