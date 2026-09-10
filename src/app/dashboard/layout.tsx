import LogoutButton from "@/components/LogoutButton"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  BarChart3, 
  Settings,
  Wifi
} from "lucide-react"

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "User Aktif", href: "/dashboard/users", icon: Users },
  { name: "Generate Voucher", href: "/dashboard/vouchers", icon: Ticket },
  { name: "Kelola Voucher", href: "/dashboard/vouchers/list", icon: Ticket },
  { name: "Laporan", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Pengaturan", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-violet-700 text-white flex flex-col">
        <div className="p-5 border-b border-violet-600">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg">
              <Wifi className="w-6 h-6 text-violet-700" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">MAMANAIY</h1>
              <p className="text-xs text-violet-200">Hotspot Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-violet-600 transition-colors text-sm font-medium"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-violet-600 text-xs text-violet-200">
          © 2026 MAMANAIY.NET
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
          <div className="flex items-center gap-3">
  <span className="text-sm text-gray-600">Admin</span>
  <LogoutButton />
</div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
