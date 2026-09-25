import type { LucideIcon } from "lucide-react";

export function MetricCard({ icon: Icon, label, value, note, tone = "neutral" }: { icon: LucideIcon; label: string; value: string; note: string; tone?: "neutral" | "attention" | "good" }) {
  const style = tone === "attention" ? "border-[#efd9cd] bg-[#fffaf6]" : tone === "good" ? "border-[#d7e3d8] bg-[#f7fbf7]" : "border-[var(--line)] bg-white";
  return <div className={`rounded-[18px] border p-5 ${style}`}><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#526158] shadow-[0_2px_10px_rgba(25,40,30,.06)]"><Icon size={16}/></span><span className="text-[11px] font-medium text-[#879088]">{note}</span></div><p className="mt-5 text-[32px] font-bold tracking-[-.05em]">{value}</p><p className="mt-1 text-[13px] text-[#667169]">{label}</p></div>;
}
