"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  RefreshCw,
  Loader2,
  Server,
  AlertCircle,
  HardDrive,
  Wifi,
  Users,
} from "lucide-react"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/mikrotik/dashboard")
      const json = await res.json()

      if (json.success) {
        setData(json.data)
      } else {
        setError(json.message || "Gagal mengambil data")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {data?.identity || "MikroTik"} • {data?.version || ""} • Uptime: {data?.uptime || "-"}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-start gap-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Gagal terhubung ke MikroTik</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Row 1: System Info + Resource Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Info */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                <Server className="w-4 h-4 text-violet-600" />
                System Info
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Identity</span>
                  <span className="font-medium text-gray-800">{data.identity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Model</span>
                  <span className="font-medium text-gray-800">{data.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">RouterOS</span>
                  <span className="font-medium text-gray-800">{data.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Architecture</span>
                  <span className="font-medium text-gray-800">{data.architecture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Serial</span>
                  <span className="font-medium text-gray-800">{data.serial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Firmware</span>
                  <span className="font-medium text-gray-800">{data.firmware}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CPU</span>
                  <span className="font-medium text-gray-800">
                    {data.cpuCount} core • {data.cpuFrequency} MHz • {data.cpu}%
                  </span>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-violet-600" />
                Resource Usage
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Memory</span>
                    <span className="text-gray-800 font-medium">
                      {data.memory?.used} / {data.memory?.total} ({data.memory?.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full"
                      style={{ width: `${data.memory?.percent || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">HDD / Storage</span>
                    <span className="text-gray-800 font-medium">
                      {data.hdd?.used} / {data.hdd?.total} ({data.hdd?.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${data.hdd?.percent || 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 text-xs text-gray-500">
                  Uptime: <span className="font-medium text-gray-700">{data.uptime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Traffic + User Online */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Traffic Internet */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                <Wifi className="w-4 h-4 text-violet-600" />
                Traffic Internet
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Interface</span>
                  <span className="font-medium text-gray-800">{data.traffic?.interface}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Download (RX)</span>
                  <span className="font-medium text-green-600">{data.traffic?.rx}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Upload (TX)</span>
                  <span className="font-medium text-blue-600">{data.traffic?.tx}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">RX Packets</span>
                  <span className="font-medium text-gray-800">{data.traffic?.rxPackets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">TX Packets</span>
                  <span className="font-medium text-gray-800">{data.traffic?.txPackets}</span>
                </div>
              </div>
            </div>

            {/* User Online */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-violet-600" />
                  User Online
                </h3>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                  {data.activeUsers}
                </span>
              </div>
              <div className="p-3 max-h-48 overflow-y-auto">
                {data.users?.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-6">
                    Tidak ada user online
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {data.users.map((u: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs py-1.5 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{u.user}</p>
                          <p className="text-[10px] text-gray-400">{u.address}</p>
                        </div>
                        <span className="text-gray-500">{u.uptime}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-800 text-sm">Log Terbaru</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-24">
                      Waktu
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 w-28">
                      Topics
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Pesan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-gray-400">
                        Tidak ada log
                      </td>
                    </tr>
                  ) : (
                    data.logs.map((log: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">
                          {log.time}
                        </td>
                        <td className="px-3 py-1.5 text-violet-600">
                          {log.topics}
                        </td>
                        <td className="px-3 py-1.5 text-gray-700">{log.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
