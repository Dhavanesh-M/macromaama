"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ClipboardList, Home, UserRound, Utensils } from "lucide-react";

export const navigation = [
  { href: "/", label: "Today", icon: Home },
  { href: "/plan", label: "Plan", icon: Utensils },
  { href: "/checker", label: "Checker", icon: Check },
  { href: "/history", label: "History", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-950/5 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.55rem)] pt-2 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-[480px] justify-around">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[10px] font-semibold transition-colors ${
                active ? "text-emerald-700" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
