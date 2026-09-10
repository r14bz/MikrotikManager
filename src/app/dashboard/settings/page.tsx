"use client"

import { useEffect, useState } from "react"
import { Save, Loader2, CheckCircle2, KeyRound } from "lucide-react"

type Settings = {
  brandName: string
  waNumber: string
  wifiName: string
  prices: Record<string, number>
}

const defaultSettings: Settings = {
  brandName: "MAMANAIY.NET",
  waNumber: "085212551180",
  wifiName: "MAMANAIY.NET",
  prices: {
    "2jam/2k": 2000,
    "5jam/3rb": 3000,
    "10jam/5rb": 5000,
    "24jam/10rb": 10000,
    "MINGGUAN": 30000,
    "BULANAN": 50000,
    "TRIAL-USER": 0,
    "default": 0,
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMessage, setPwdMessage] = useState("")
  const [pwdError, setPwdError] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("app_settings")
      if (raw) {
        const parsed = JSON.parse(raw)
        setSettings({
          ...defaultSettings,
          ...parsed,
          prices: {
            ...defaultSettings.prices,
            ...(parsed.prices || {}),
          },
        })
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleSave = () => {
    setSaving(true)
    setSaved(false)

    try {
      localStorage.setItem("app_settings", JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert("Gagal menyimpan pengaturan")
    } finally {
      setSaving(false)
    }
  }

  const updatePrice = (profile: string, value: string) => {
    const num = Number(value) || 0
    setSettings((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [profile]: num,
      },
    }))
  }

  const handleChangePassword = async () => {
    setPwdMessage("")
    setPwdError("")

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError("Semua field password wajib diisi")
      return
    }

    if (newPassword.length < 6) {
      setPwdError("Password baru minimal 6 karakter")
      return
    }

    if (newPassword !== confirmPassword) {
      setPwdError("Konfirmasi password tidak cocok")
      return
    }

    setPwdLoading(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const json = await res.json()

      if (json.success) {
        setPwdMessage(json.message || "Password berhasil diganti")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPwdError(json.message || "Gagal ganti password")
      }
    } catch (err: any) {
      setPwdError(err.message || "Terjadi kesalahan")
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Atur identitas, harga profile, dan password admin
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Identitas</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Brand
          </label>
          <input
            type="text"
            value={settings.brandName}
            onChange={(e) =>
              setSettings({ ...settings, brandName: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama WiFi
          </label>
          <input
            type="text"
            value={settings.wifiName}
            onChange={(e) =>
              setSettings({ ...settings, wifiName: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nomor WhatsApp
          </label>
          <input
            type="text"
            value={settings.waNumber}
            onChange={(e) =>
              setSettings({ ...settings, waNumber: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Harga Profile</h3>
        <p className="text-xs text-gray-500">
          Harga ini dipakai saat generate & print voucher
        </p>

        <div className="space-y-3">
          {Object.keys(settings.prices).map((profile) => (
            <div key={profile} className="flex items-center gap-3">
              <div className="flex-1 text-sm font-medium text-gray-700">
                {profile}
              </div>
              <div className="w-36">
                <input
                  type="number"
                  value={settings.prices[profile]}
                  onChange={(e) => updatePrice(profile, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium px-6 py-2.5 rounded-lg"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? "Tersimpan" : "Simpan Pengaturan"}
      </button>

      {/* Ganti Password */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-violet-600" />
          Ganti Password Admin
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password Lama
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password Baru
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {pwdError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {pwdError}
          </div>
        ) : null}

        {pwdMessage ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
            {pwdMessage}
          </div>
        ) : null}

        <button
          onClick={handleChangePassword}
          disabled={pwdLoading}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-medium px-5 py-2.5 rounded-lg text-sm"
        >
          {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Ganti Password
        </button>
      </div>
    </div>
  )
}
