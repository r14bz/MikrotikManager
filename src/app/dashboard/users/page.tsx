"use client"

import { useEffect, useState } from "react"
import { Users, RefreshCw, WifiOff, Loader2 } from "lucide-react"

type ActiveUser = {
  id: string
  user: string
  address: string
  mac: string
  uptime: string
  bytesIn: string
  bytesOut: string
  server: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/mikrotik/active")
      const data = await res.json()

      if (data.success) {
        setUsers(data.data || [])
        setLastUpdate(new Date().toLocaleTimeString("id-ID"))
      } else {
        setError(data.message || "Gagal mengambil data")
        setUsers([])
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-signal" />
          <span className="text-text-secondary">
            Online: <strong className="font-mono text-text-primary">{users.length}</strong>
          </span>
          {lastUpdate && (
            <span className="hidden sm:inline text-text-muted">· update {lastUpdate}</span>
          )}
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 bg-signal hover:bg-signal-dark disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-danger-soft border border-danger/20 text-danger rounded-xl p-3.5 flex items-start gap-3 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Tidak dapat terhubung ke MikroTik</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
            <p className="text-xs mt-1.5 opacity-75">
              Pastikan MikroTik online dan koneksi VPN ke router aktif.
            </p>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-line">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Username</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">IP Address</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">MAC Address</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Uptime</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Download</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Upload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Mengambil data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    {error ? "Tidak ada data" : "Tidak ada user yang sedang online"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3 font-medium text-text-primary">{user.user}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{user.address}</td>
                    <td className="px-4 py-3 font-mono text-text-muted text-xs">{user.mac}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{user.uptime}</td>
                    <td className="px-4 py-3 font-mono text-signal-dark">{user.bytesIn}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{user.bytesOut}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden">
          {loading ? (
            <div className="px-4 py-12 text-center text-text-muted text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Mengambil data...
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-12 text-center text-text-muted text-sm">
              {error ? "Tidak ada data" : "Tidak ada user yang sedang online"}
            </div>
          ) : (
            <div className="divide-y divide-line">
              {users.map((user) => (
                <div key={user.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-text-primary text-sm">{user.user}</span>
                    <span className="font-mono text-text-secondary text-xs">{user.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-text-muted">{user.address}</span>
                    <span className="font-mono text-text-muted">{user.mac}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-1.5">
                    <span className="font-mono text-signal-dark">↓ {user.bytesIn}</span>
                    <span className="font-mono text-text-secondary">↑ {user.bytesOut}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
