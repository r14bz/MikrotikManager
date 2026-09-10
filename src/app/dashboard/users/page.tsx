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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Aktif</h1>
          <p className="text-gray-500 text-sm mt-1">
            Daftar user yang sedang terhubung ke hotspot
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>
            Total Online: <strong className="text-gray-800">{users.length}</strong>
          </span>
        </div>
        {lastUpdate && <span>Update terakhir: {lastUpdate}</span>}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3">
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Tidak dapat terhubung ke MikroTik</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2 text-red-600">
              Pastikan MikroTik online dan koneksi VPN ke router aktif.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">IP Address</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">MAC Address</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uptime</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Download</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Upload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Mengambil data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {error ? "Tidak ada data" : "Tidak ada user yang sedang online"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.user}</td>
                    <td className="px-4 py-3 text-gray-600">{user.address}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{user.mac}</td>
                    <td className="px-4 py-3 text-gray-600">{user.uptime}</td>
                    <td className="px-4 py-3 text-gray-600">{user.bytesIn}</td>
                    <td className="px-4 py-3 text-gray-600">{user.bytesOut}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
