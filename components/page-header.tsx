export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="small-caps text-[9px] font-bold text-[#7b857d]">{eyebrow}</p><h1 className="mt-2 text-[32px] font-bold tracking-[-.05em] sm:text-[38px]">{title}</h1><p className="mt-2 max-w-[680px] text-[13px] leading-6 text-[#6c766f]">{description}</p></div>{action}</div>;
}
