"use client"

import LogoutButton from "@/components/LogoutButton"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Ticket,
  ListChecks,
  BarChart3,
  Settings,
} from "lucide-react"

const menu = [
  { name: "Dashboard", short: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "User Aktif", short: "User", href: "/dashboard/users", icon: Users },
  { name: "Generate Voucher", short: "Buat", href: "/dashboard/vouchers", icon: Ticket },
  { name: "Kelola Voucher", short: "Voucher", href: "/dashboard/vouchers/list", icon: ListChecks },
  { name: "Laporan", short: "Laporan", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Pengaturan", short: "Atur", href: "/dashboard/settings", icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(href)
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const current = menu.find((m) => isActive(pathname, m.href))

  return (
    <div className="min-h-screen bg-paper md:flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-ink text-white">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-ink-line">
          <Image src="/logo/mark.png" alt="MAMANAIY.NET" width={36} height={34} />
          <div>
            <p className="font-semibold text-[15px] leading-tight">MAMANAIY</p>
            <p className="text-[11px] text-white/45">.NET Hotspot Manager</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {menu.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " +
                  (active
                    ? "bg-signal/15 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white")
                }
              >
                <item.icon className={"w-[18px] h-[18px] " + (active ? "text-signal" : "")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-ink-line text-[11px] text-white/35">
          © 2026 MAMANAIY.NET
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-ink md:bg-surface md:border-b md:border-line">
          <div className="flex items-center justify-between px-4 md:px-6 py-3.5">
            <div className="flex items-center gap-2.5 md:gap-0">
              <div className="w-7 h-7 flex items-center justify-center md:hidden">
                <Image src="/logo/mark.png" alt="MAMANAIY.NET" width={26} height={24} />
              </div>
              <h1 className="text-[15px] font-semibold text-white md:text-text-primary md:text-lg">
                {current?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-sm text-text-secondary">Admin</span>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-5 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-ink border-t border-ink-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          {menu.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 py-2.5"
              >
                <item.icon
                  className={"w-5 h-5 " + (active ? "text-signal" : "text-white/45")}
                />
                <span
                  className={
                    "text-[9.5px] leading-none " +
                    (active ? "text-signal font-medium" : "text-white/45")
                  }
                >
                  {item.short}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
