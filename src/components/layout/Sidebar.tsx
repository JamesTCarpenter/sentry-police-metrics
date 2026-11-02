"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDateFilter } from "@/context/DateFilterContext";
import Image from "next/image";

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

export default function Sidebar() {
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-navy text-white md:flex">
      <div className="flex items-center px-6 py-5">
        <Image
          src="/sentry-main-logo.png"
          alt="Sentry"
          width={130}
          height={40}
          priority
          className="h-10 w-auto"
        />
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-4 py-8">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            const href = queryString
              ? `${item.href}?${queryString}`
              : item.href;

            return (
              <li key={item.href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 font-semibold text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon size={18} aria-hidden="true" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-5">
        <p className="text-[10px] font-semibold tracking-[1.5px] text-slate-400">
          DATA SOURCE
        </p>
        <p className="mt-2 text-sm font-medium">Metropolitan Police</p>
        <p className="mt-1 text-xs text-slate-400">Stop & Search Records</p>
      </div>
    </aside>
  );
}
