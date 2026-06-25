"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  CalendarPlus,
  ClipboardList,
  Activity,
  Calculator,
  FileText,
  Leaf,
  Snowflake,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/boxes", label: "Box Availability", icon: Package },
  { href: "/booking", label: "Book Rental", icon: CalendarPlus },
  { href: "/products", label: "Product Registration", icon: ClipboardList },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/calculator", label: "Cost Calculator", icon: Calculator },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/impact", label: "Impact", icon: Leaf },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-100">
          <div className="w-9 h-9 bg-navy-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Snowflake size={18} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-navy-800 text-sm leading-tight">FreshBox AI</p>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Cold Chain Manager
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            Main Menu
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${isActive(href) ? "nav-link-active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {isActive(href) && (
                <ChevronRight size={14} className="ml-auto opacity-60" />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-emerald-50 to-sky-50 rounded-xl p-3 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700">MVP Version 0.1</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Monitoring data is simulated. No real IoT integration.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ───────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-0 ${
                isActive(href)
                  ? "text-navy-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 1.8} />
              <span className="text-[9px] font-semibold truncate max-w-12">{label}</span>
            </Link>
          ))}
          {/* More menu for remaining items */}
          <Link
            href="/impact"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl ${
              ["/calculator", "/reports", "/impact"].includes(pathname)
                ? "text-navy-600"
                : "text-slate-400"
            }`}
          >
            <Leaf size={20} strokeWidth={1.8} />
            <span className="text-[9px] font-semibold">More</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
