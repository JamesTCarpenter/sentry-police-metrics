"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDateFilter } from "@/context/DateFilterContext";

import { LayoutDashboard, Users, Map, Database } from "lucide-react";

const navigation = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Demographics",
    href: "/demographics",
    icon: Users,
  },
  {
    name: "Geography",
    href: "/geography",
    icon: Map,
  },
  {
    name: "Records",
    href: "/records",
    icon: Database,
  },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const { dateFilter } = useDateFilter();

  const params = new URLSearchParams();

  if (dateFilter.startMonth) {
    params.set("startMonth", dateFilter.startMonth);
  }

  if (dateFilter.endMonth) {
    params.set("endMonth", dateFilter.endMonth);
  }

  const queryString = params.toString();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy md:hidden"
    >
      <ul className="grid grid-cols-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          const href = queryString ? `${item.href}?${queryString}` : item.href;

          return (
            <li key={item.href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-teal ${
                  isActive
                    ? "bg-white/10 font-semibold text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={20} aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
