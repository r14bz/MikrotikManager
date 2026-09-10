"use client"

import { useEffect, useState } from "react"
import {
  BarChart3,
  DollarSign,
  Ticket,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Download,
} from "lucide-react"

function getCurrentMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const mm = m < 10 ? "0" + m : "" + m
  return y + "-" + mm
}

function buildMonthOptions() {
  const options = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const mm = m < 10 ? "0" + m : "" + m
    const value = y + "-" + mm
    const label = d.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    })
    options.push({ value: value, label: label })
  }

  return options
}

function formatDateLabel(value: string) {
  if (!value || value.length < 8) return value
  const parts = value.split("-")
  if (parts.length !== 3) return value

  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (!year || !month || !day) return value

  const d = new Date(year, month - 1, day)
  if (isNaN(d.getTime())) return value

  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState(getCurrentMonth)
  const [monthOptions] = useState(buildMonthOptions)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const fetchReport = async (m: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/reports/sales?month=" + encodeURIComponent(m))
      const json = await res.json()

      if (json.success) {
        setData(json)
      } else {
        setError(json.message || "Gagal memuat laporan")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport(month)
  }, [month])

  const summary = data?.summary || {}
  const byProfile = data?.byProfile || {}
  const byDate = data?.byDate || {}

  const handleExportCSV = () => {
    if (!data) {
      alert("Belum ada data untuk diexport")
      return
    }

    const lines: string[] = []
    lines.push("Laporan Penjualan Voucher")
    lines.push("Bulan;" + month)
    lines.push("")
    lines.push("Ringkasan")
    lines.push("Total Generate;" + (summary.totalGenerated || 0))
    lines.push("Sudah Dipakai;" + (summary.totalUsed || 0))
    lines.push("Belum Dipakai;" + (summary.totalUnused || 0))
    lines.push("Pendapatan;" + (summary.totalRevenue || 0))
    lines.push("")
    lines.push("Profile;Generate;Dipakai;Pendapatan")

    Object.entries(byProfile).forEach(([name, info]: any) => {
      lines.push(
        name + ";" + info.count + ";" + info.used + ";" + (info.revenue || 0)
      )
    })

    lines.push("")
    lines.push("Tanggal;Generate;Pendapatan")
    Object.entries(byDate)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .forEach(([date, info]: any) => {
        lines.push(date + ";" + info.count + ";" + (info.revenue || 0))
      })

    const csv = "\uFEFF" + lines.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "laporan-voucher-" + month + ".csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportMikhmon = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setImporting(true)
  setImportResult(null)

  try {
    const form = new FormData()
    form.append("file", file)

    const res = await fetch("/api/reports/import-mikhmon", {
      method: "POST",
      body: form,
    })

    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const text = await res.text()
      console.error("Non-JSON response:", text.slice(0, 300))
      setImportResult(
        "Gagal: API import tidak ditemukan atau error server (status " +
          res.status +
          "). Pastikan file route sudah di-deploy."
      )
      return
    }

    const json = await res.json()

    if (json.success) {
      setImportResult(
        "Berhasil import " +
          json.inserted +
          " dari " +
          json.totalParsed +
          " baris" +
          (json.errorCount ? " (" + json.errorCount + " error)" : "")
      )
      fetchReport(month)
    } else {
      setImportResult("Gagal: " + (json.message || "unknown"))
    }
  } catch (err: any) {
    setImportResult("Error: " + (err.message || "gagal upload"))
  } finally {
    setImporting(false)
    e.target.value = ""
  }
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ringkasan generate & pemakaian voucher
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchReport(month)}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white px-3 py-2 rounded-lg text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-2 rounded-lg text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <label className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm cursor-pointer">
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Mikhmon CSV"
            )}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importing}
              onChange={handleImportMikhmon}
            />
          </label>
        </div>
      </div>

      {importResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 text-sm">
          {importResult}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
                <div className="bg-violet-600 p-2.5 rounded-lg text-white">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Generate</p>
                  <p className="text-xl font-bold text-gray-800">
                    {summary.totalGenerated || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
                <div className="bg-green-500 p-2.5 rounded-lg text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sudah Dipakai</p>
                  <p className="text-xl font-bold text-gray-800">
                    {summary.totalUsed || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
                <div className="bg-blue-500 p-2.5 rounded-lg text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Belum Dipakai</p>
                  <p className="text-xl font-bold text-gray-800">
                    {summary.totalUnused || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
                <div className="bg-orange-500 p-2.5 rounded-lg text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendapatan</p>
                  <p className="text-xl font-bold text-gray-800">
                    Rp {(summary.totalRevenue || 0).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-5 py-4 border-b">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                  Berdasarkan Profile
                </h3>
              </div>
              <div className="p-5">
                {Object.keys(byProfile).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    Belum ada data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(byProfile).map(([name, info]: any) => (
                      <div
                        key={name}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{name}</p>
                          <p className="text-xs text-gray-500">
                            {info.count} generate • {info.used} dipakai
                          </p>
                        </div>
                        <p className="font-semibold text-violet-600">
                          Rp {(info.revenue || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm">
              <div className="px-5 py-4 border-b">
                <h3 className="font-semibold text-gray-800">Per Tanggal</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">
                        Tanggal
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">
                        Generate
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600">
                        Pendapatan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(byDate).length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          Belum ada data
                        </td>
                      </tr>
                    ) : (
                      Object.entries(byDate)
                        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                        .map(([date, info]: any) => (
                          <tr key={date} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-700">
                              {formatDateLabel(date)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">
                              {info.count}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-violet-600">
                              Rp {(info.revenue || 0).toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}
