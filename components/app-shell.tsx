import Link from "next/link";
import { Archive, BookOpen, Boxes, CircleHelp, Code2, LayoutDashboard, MessageSquareText, PackageCheck, Users } from "lucide-react";
import { Brand } from "./brand";
import type { DataSource } from "@/lib/domain/types";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: PackageCheck },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/ask", label: "Ask Store", icon: MessageSquareText },
] as const;
const learn = [
  { href: "/case-study", label: "Case study", icon: BookOpen },
  { href: "/methodology", label: "Methodology", icon: CircleHelp },
  { href: "https://github.com/umeanougo/storeops-copilot", label: "GitHub", icon: Code2 },
] as const;

export function AppShell({ children, source, storeName, warning }: { children: React.ReactNode; source: DataSource; storeName: string; warning?: string | null }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[228px_minmax(0,1fr)]">
    <aside className="hidden min-h-screen border-r border-[#dce0d9] bg-[#f9f8f4] px-4 py-5 lg:sticky lg:top-0 lg:block lg:h-screen">
      <div className="px-2"><Brand/></div>
      <nav className="mt-9 space-y-1" aria-label="Primary navigation">{navigation.map(item=><NavItem key={item.href} {...item}/>)}</nav>
      <p className="small-caps mb-2 mt-8 px-3 text-[9px] font-bold text-[#98a098]">Project</p>
      <nav className="space-y-1" aria-label="Project navigation">{learn.map(item=><NavItem key={item.href} {...item}/>)}</nav>
      <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-[#e0e3dd] bg-white p-3.5">
        <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${source === "demo" ? "bg-[#d18445]" : "bg-[#4b9a69]"}`}/><span className="text-[11px] font-semibold">{source === "demo" ? "Simulated demo data" : "Live store data"}</span></div>
        <p className="mt-1.5 truncate text-[10px] text-[#7a847d]">{storeName}</p>
        {warning&&<p className="mt-2 text-[9px] leading-4 text-[#a45b43]">Live connection unavailable</p>}
      </div>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-20 border-b border-[#dce0d9] bg-[#f9f8f4]/95 px-4 backdrop-blur lg:hidden"><div className="flex items-center justify-between py-3"><Brand/><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${source === "demo" ? "bg-[#fff0e8] text-[#985035]" : "bg-[#e7f2e9] text-[#346347]"}`}>{source === "demo" ? "DEMO" : "LIVE"}</span></div><nav className="flex gap-1 overflow-x-auto pb-2" aria-label="Mobile navigation">{[...navigation,...learn].map(item=><Link key={item.href} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined} className="whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-medium text-[#566159] hover:bg-white">{item.label}</Link>)}</nav></header>
      {children}
    </div>
  </div>;
}

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Archive }) {
  return <Link href={href as never} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium text-[#5f6a62] transition hover:bg-white hover:text-[#1f2922]"><Icon size={16}/>{label}</Link>;
}
