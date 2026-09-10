"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Ticket, Loader2, CheckCircle2, AlertCircle, Printer } from "lucide-react"
import { getPriceForProfile } from "@/lib/settings"

type Profile = {
  name: string
  sessionTimeout?: string
  rateLimit?: string
}

type GeneratedVoucher = {
  username: string
  password: string
  profile: string
  price: number
  validity?: string
  timelimit?: string
  datalimit?: string
}

export default function VouchersPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profilesError, setProfilesError] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(10)
  const [prefix, setPrefix] = useState("")
  const [profile, setProfile] = useState("")
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count?: number
    vouchers?: GeneratedVoucher[]
  } | null>(null)

  const fetchProfiles = async () => {
    setProfilesLoading(true)
    setProfilesError(null)

    try {
      const res = await fetch("/api/mikrotik/profiles")
      const json = await res.json()

      if (json.success) {
        setProfiles(json.data || [])
        if (json.data && json.data.length > 0) {
          const first = json.data[0].name
          if (!profile) {
            setProfile(first)
            setPrice(getPriceForProfile(first))
          }
        }
      } else {
        setProfilesError(json.message || "Gagal memuat profile")
        setProfiles([])
      }
    } catch (err: any) {
      setProfilesError(err.message || "Tidak dapat terhubung ke MikroTik")
      setProfiles([])
    } finally {
      setProfilesLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleProfileChange = (name: string) => {
    setProfile(name)
    setPrice(getPriceForProfile(name))
  }

  const handleGenerate = async () => {
    if (!profile) {
      setResult({ success: false, message: "Pilih profile terlebih dahulu" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/vouchers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, prefix, profile, price }),
      })

      const data = await res.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Terjadi kesalahan",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!result?.vouchers || result.vouchers.length === 0) return
    localStorage.setItem("print_vouchers", JSON.stringify(result.vouchers))
    router.push("/print")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Generate Voucher</h1>
        <p className="text-gray-500 text-sm mt-1">
          Buat kode voucher massal sesuai profile yang ada di MikroTik
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 max-w-xl">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Profile Hotspot (dari MikroTik)
              </label>
              <button
                type="button"
                onClick={fetchProfiles}
                disabled={profilesLoading}
                className="text-xs text-violet-600 hover:underline"
              >
                {profilesLoading ? "Memuat..." : "Refresh"}
              </button>
            </div>

            {profilesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengambil profile dari MikroTik...
              </div>
            ) : profilesError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {profilesError}
                <p className="text-xs mt-1">Pastikan MikroTik online, lalu klik Refresh.</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 text-sm">
                Tidak ada profile hotspot di MikroTik.
              </div>
            ) : (
              <select
                value={profile}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Pilih Profile --</option>
                {profiles.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                    {p.sessionTimeout ? " (" + p.sessionTimeout + ")" : ""}
                    {p.rateLimit ? " • " + p.rateLimit : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah Voucher
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prefix (opsional)
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="Contoh: A, B, VIP"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Harga Jual (Rp)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Otomatis dari Pengaturan (bisa diubah manual)
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !profile || profilesLoading || !!profilesError}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                Generate Voucher
              </>
            )}
          </button>

          {result && (
            <div
              className={
                "p-4 rounded-lg text-sm " +
                (result.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200")
              }
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{result.message}</p>
                  {result.count ? (
                    <p className="mt-1">Berhasil membuat {result.count} voucher</p>
                  ) : null}
                </div>
              </div>

              {result.success && result.vouchers ? (
                <button
                  onClick={handlePrint}
                  className="mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Voucher ({result.count})
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
