"use client"

import { LogOut } from "lucide-react"

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white md:text-text-secondary md:hover:text-danger transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  )
}
