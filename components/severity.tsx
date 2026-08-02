import { AlertCircle, AlertTriangle, CircleAlert, Info } from "lucide-react";
import type { Severity } from "@/lib/domain/types";

const styles: Record<Severity, string> = { critical: "border-[#efc7bb] bg-[#fff0eb] text-[#9e3f27]", high: "border-[#efd6b4] bg-[#fff5e7] text-[#8b5b22]", medium: "border-[#d9ded4] bg-[#f1f3ef] text-[#56635a]", low: "border-[#d6e4d9] bg-[#edf5ee] text-[#3d6b4b]" };
const icons = { critical: AlertCircle, high: AlertTriangle, medium: CircleAlert, low: Info };

export function SeverityBadge({ severity }: { severity: Severity }) {
  const Icon = icons[severity];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] ${styles[severity]}`}><Icon size={11}/>{severity}</span>;
}
