"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Loader2,
  Ticket,
  Trash2,
  Printer,
  CheckSquare,
  Square,
  RefreshCw,
  Ban,
  CheckCircle,
} from "lucide-react"

type Voucher = {
  id: string
  username: string
  password: string
  profile_name: string
  price: number
  status: string
  limit_uptime?: string
  uptime?: string
  comment?: string
}

export default function VoucherListPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [profile, setProfile] = useState("all")
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const profileOptions = [
    "2jam/2k",
    "5jam/3rb",
    "10jam/5rb",
    "24jam/10rb",
    "MINGGUAN",
    "BULANAN",
    "TRIAL-USER",
    "default",
  ]

  const fetchVouchers = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/mikrotik/vouchers")
      const json = await res.json()

      if (json.success) {
        let data: Voucher[] = json.data || []

        if (profile !== "all") {
          data = data.filter((v) => v.profile_name === profile)
        }
        if (status !== "all") {
          data = data.filter((v) => v.status === status)
        }
        if (search) {
          data = data.filter((v) =>
            v.username.toLowerCase().includes(search.toLowerCase())
          )
        }

        setVouchers(data)
        setSelected([])
      } else {
        setError(json.message || "Gagal memuat data dari MikroTik")
      }
    } catch (err: any) {
      setError(err.message || "Tidak dapat terhubung ke MikroTik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [status, profile])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchVouchers()
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === vouchers.length) {
      setSelected([])
    } else {
      setSelected(vouchers.map((v) => v.id))
    }
  }

  const getSelectedVouchers = () => {
    return vouchers.filter((v) => selected.includes(v.id))
  }

  const handlePrintSelected = () => {
    const items = getSelectedVouchers()
    if (items.length === 0) {
      alert("Pilih voucher terlebih dahulu")
      return
    }

    const forPrint = items.map((v) => ({
      username: v.username,
      password: v.password,
      profile: v.profile_name,
      price: v.price || 0,
      validity: v.limit_uptime || "1d",
      timelimit: v.limit_uptime || "1d",
    }))

    localStorage.setItem("print_vouchers", JSON.stringify(forPrint))
    router.push("/print")
  }

  const handlePrintOne = (v: Voucher) => {
    const forPrint = [
      {
        username: v.username,
        password: v.password,
        profile: v.profile_name,
        price: v.price || 0,
        validity: v.limit_uptime || "1d",
        timelimit: v.limit_uptime || "1d",
      },
    ]
    localStorage.setItem("print_vouchers", JSON.stringify(forPrint))
    router.push("/print")
  }

  const handleDelete = async (ids?: string[]) => {
    const targetIds = ids || selected
    if (targetIds.length === 0) {
      alert("Pilih voucher terlebih dahulu")
      return
    }

    const confirmMsg =
      targetIds.length === 1
        ? "Yakin hapus voucher ini dari MikroTik?"
        : "Yakin hapus " + targetIds.length + " voucher dari MikroTik?"

    if (!confirm(confirmMsg)) return

    setActionLoading(true)

    try {
      const targetVouchers = vouchers.filter((v) => targetIds.includes(v.id))
      const usernames = targetVouchers.map((v) => v.username)

      const res = await fetch("/api/vouchers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targetIds, usernames }),
      })

      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        alert("Gagal menghapus: respons server tidak valid")
        return
      }

      const json = await res.json()

      if (json.success) {
        alert(json.message || "Berhasil dihapus")
        fetchVouchers()
      } else {
        alert(json.message || "Gagal menghapus")
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (v: Voucher) => {
    const willDisable = v.status !== "disabled"
    const msg = willDisable
      ? "Disable voucher " + v.username + "?"
      : "Enable voucher " + v.username + "?"

    if (!confirm(msg)) return

    setActionLoading(true)
    try {
      const res = await fetch("/api/vouchers/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: v.username,
          disabled: willDisable,
        }),
      })
      const json = await res.json()
      if (json.success) {
        fetchVouchers()
      } else {
        alert(json.message || "Gagal mengubah status")
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan")
    } finally {
      setActionLoading(false)
    }
  }

  const statusColor = (s: string) => {
    if (s === "online") return "bg-blue-100 text-blue-700"
    if (s === "used") return "bg-green-100 text-green-700"
    if (s === "disabled") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Voucher</h1>
          <p className="text-gray-500 text-sm mt-1">
            Data langsung dari MikroTik
          </p>
        </div>
        <button
          onClick={fetchVouchers}
          disabled={loading}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white px-3 py-2 rounded-lg text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari username..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Cari
            </button>
          </form>

          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">Semua Profile</option>
            {profileOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">Semua Status</option>
            <option value="unused">Unused</option>
            <option value="used">Used</option>
            <option value="online">Online</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">
              {selected.length} dipilih
            </span>
            <button
              onClick={handlePrintSelected}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => handleDelete()}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-500">
                    {selected.length === vouchers.length && vouchers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-violet-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Username
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Profile
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Harga
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Uptime
                </th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Mengambil data dari MikroTik...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Tidak ada voucher di MikroTik
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleSelect(v.id)}>
                        {selected.includes(v.id) ? (
                          <CheckSquare className="w-4 h-4 text-violet-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-mono font-medium text-gray-800">
                      {v.username}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{v.profile_name}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {v.price ? "Rp " + v.price.toLocaleString("id-ID") : "Gratis"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium " +
                          statusColor(v.status)
                        }
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">
                      {v.uptime || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePrintOne(v)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggle(v)}
                          disabled={actionLoading}
                          className={
                            "p-1.5 rounded " +
                            (v.status === "disabled"
                              ? "text-green-600 hover:bg-green-50"
                              : "text-orange-600 hover:bg-orange-50")
                          }
                          title={v.status === "disabled" ? "Enable" : "Disable"}
                        >
                          {v.status === "disabled" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete([v.id])}
                          disabled={actionLoading}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
