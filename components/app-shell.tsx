"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Boxes, CircleHelp, Code2, LayoutDashboard, MessageSquareText, PackageCheck, Store, TriangleAlert } from "lucide-react";
import { Brand } from "./brand";
import type { DataSource } from "@/lib/domain/types";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/orders", label: "Order queue", icon: PackageCheck },
  { href: "/merchants", label: "Merchants", icon: Store },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/exceptions", label: "Exceptions", icon: TriangleAlert },
  { href: "/ask", label: "Ask StoreOps", icon: MessageSquareText },
] as const;

const portfolio = [
  { href: "/case-study", label: "Case study", icon: BookOpen },
  { href: "/methodology", label: "Methodology", icon: CircleHelp },
  { href: "https://github.com/umeanougo/storeops-copilot", label: "View code", icon: Code2 },
] as const;

export function AppShell({ children, source, storeName, storeCount, warning }: { children: React.ReactNode; source: DataSource; storeName: string; storeCount?: number; warning?: string | null }) {
  const pathname = usePathname();
  return <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-lg focus:not-sr-only">Skip to content</a>
    <aside className="hidden min-h-screen border-r border-[var(--line)] bg-[#f8f8f5] px-4 py-6 lg:sticky lg:top-0 lg:block lg:h-screen">
      <div className="px-2"><Brand /></div>
      <NavGroup label="Workspace" items={navigation} pathname={pathname} className="mt-10" />
      <NavGroup label="Portfolio" items={portfolio} pathname={pathname} className="mt-9" />
      <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${source === "demo" ? "bg-[#d18445]" : "bg-[#4b9a69]"}`} /><span className="text-xs font-semibold">{source === "demo" ? "Simulated data" : "Live store data"}</span></div>
        <p className="mt-2 truncate text-[11px] text-[var(--muted)]">{storeName}</p>
        {storeCount != null && <p className="mt-0.5 text-[11px] text-[#929a93]">{storeCount} {source === "demo" ? "demo store" : "connected store"}{storeCount === 1 ? "" : "s"}</p>}
        {warning && <p className="mt-2 text-[11px] leading-4 text-[#a45b43]">Live connection unavailable</p>}
      </div>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#f8f8f5]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3"><Brand /><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${source === "demo" ? "bg-[#fff0e8] text-[#985035]" : "bg-[#e7f2e9] text-[#346347]"}`}>{source === "demo" ? "DEMO" : "LIVE"}</span></div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Mobile navigation">
          {[...navigation, ...portfolio.slice(0, 2)].map(item => <MobileNavItem key={item.href} item={item} active={isActive(pathname, item.href)} />)}
        </nav>
      </header>
      <div id="main-content">{children}</div>
    </div>
  </div>;
}

function NavGroup({ label, items, pathname, className = "" }: { label: string; items: readonly { href: string; label: string; icon: typeof LayoutDashboard }[]; pathname: string; className?: string }) {
  return <div className={className}><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa19b]">{label}</p><nav className="space-y-1" aria-label={`${label} navigation`}>{items.map(item => <NavItem key={item.href} item={item} active={isActive(pathname, item.href)} />)}</nav></div>;
}

function isActive(pathname: string, href: string) {
  if (href.startsWith("http")) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({ item, active }: { item: { href: string; label: string; icon: typeof LayoutDashboard }; active: boolean }) {
  const Icon = item.icon;
  return <Link href={item.href as never} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? "bg-white text-[var(--ink)] shadow-[0_1px_2px_rgba(20,35,25,.06),0_8px_24px_rgba(20,35,25,.05)]" : "text-[#677169] hover:bg-white/70 hover:text-[var(--ink)]"}`}><Icon size={16} className={active ? "text-[var(--green)]" : "text-[#8a938c]"} />{item.label}</Link>;
}

function MobileNavItem({ item, active }: { item: { href: string; label: string }; active: boolean }) {
  return <Link href={item.href as never} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-medium ${active ? "bg-white text-[var(--ink)] shadow-sm" : "text-[#68736b]"}`}>{item.label}</Link>;
}
