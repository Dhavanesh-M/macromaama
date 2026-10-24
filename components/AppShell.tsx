"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bot, Dumbbell, House, ListChecks, Menu, Salad, Settings2, ShoppingBasket, Sparkles, Utensils, X } from "lucide-react";
import { useState } from "react";

export const navigation = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/checker", label: "Food & Meals", icon: Utensils },
  { href: "/plan", label: "Diet Planner", icon: Salad },
  { href: "/food", label: "Food Database", icon: ListChecks },
  { href: "/workouts", label: "Workout Manager", icon: Dumbbell },
  { href: "/history", label: "Progress & Analytics", icon: BarChart3 },
  { href: "/grocery", label: "Grocery Planner", icon: ShoppingBasket },
  { href: "/assistant", label: "Nutrition Assistant", icon: Bot },
  { href: "/supplements", label: "Supplement Guide", icon: Sparkles },
  { href: "/profile", label: "Settings & Profile", icon: Settings2 },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-amber-400 text-neutral-950"><Activity size={21} strokeWidth={2.5} /></span>
      <span><span className="block text-base font-black tracking-[0.04em] text-white">Macromaama</span><span className="block text-[10px] font-semibold italic tracking-[0.1em] text-amber-300">Kadinama Iru.</span></span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen text-neutral-100">
      <aside className="glass-surface fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-neutral-800 bg-neutral-950/80 px-4 py-6 lg:flex">
        <div className="px-3"><Brand /></div>
        <nav aria-label="Main navigation" className="mt-9 flex-1 space-y-1 overflow-y-auto">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-amber-400 text-neutral-950" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}><Icon size={18} />{label}</Link>;
          })}
        </nav>
        <p className="px-3 pt-5 text-[11px] leading-5 text-neutral-600">Simple, data-driven nutrition and strength progress—personalized for your life.</p>
      </aside>

      <header className="glass-surface sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-800 bg-neutral-950/70 px-4 lg:hidden">
        <Brand />
        <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} className="grid size-11 place-items-center rounded-xl text-neutral-200 hover:bg-neutral-900">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </header>
      {menuOpen && <div className="fixed inset-x-0 top-16 z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-neutral-800 bg-neutral-950 p-3 shadow-2xl lg:hidden"><nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${pathname === href ? "bg-amber-400 text-neutral-950" : "bg-neutral-900 text-neutral-300"}`}><Icon size={16} />{label}</Link>)}</nav></div>}
      <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-[1180px] px-4 pb-12 pt-6 sm:px-6 lg:ml-64 lg:min-h-screen lg:px-10 lg:pt-10">{children}</main>
    </div>
  );
}
