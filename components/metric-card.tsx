import type { LucideIcon } from "lucide-react";

export function MetricCard({ icon: Icon, label, value, note, tone = "neutral" }: { icon: LucideIcon; label: string; value: string; note: string; tone?: "neutral" | "attention" | "good" }) {
  const style = tone === "attention" ? "border-[#efd6c8] bg-[#fff9f4]" : tone === "good" ? "border-[#d4e1d5] bg-[#f5faf5]" : "border-[#dfe2dc] bg-[#fffefa]";
  return <div className={`rounded-2xl border p-4 ${style}`}><div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[#526158] shadow-sm"><Icon size={15}/></span><span className="text-[9px] font-medium text-[#879088]">{note}</span></div><p className="mt-4 text-[24px] font-bold tracking-[-.045em]">{value}</p><p className="mt-0.5 text-[10px] text-[#727c74]">{label}</p></div>;
}
