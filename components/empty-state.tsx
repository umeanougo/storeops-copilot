import { Inbox } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[18px] border border-dashed border-[#d2d8d1] bg-[#faf9f5] p-7 text-center">
    <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#e9eee8] text-[#607065]"><Inbox size={17}/></span>
    <h2 className="mt-4 text-[12px] font-bold">{title}</h2>
    <p className="mx-auto mt-2 max-w-[440px] text-[10px] leading-5 text-[#748078]">{body}</p>
  </div>;
}
