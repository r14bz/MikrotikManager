"use client"

import { useEffect, useState } from "react"
import { Save, Loader2, CheckCircle2, KeyRound, AlertCircle } from "lucide-react"

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

  const inputClass =
    "w-full border border-line rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal"
  const labelClass = "block text-sm font-medium text-text-primary mb-1.5"

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
        <h3 className="font-semibold text-text-primary text-sm">Identitas</h3>

        <div>
          <label className={labelClass}>Nama Brand</label>
          <input
            type="text"
            value={settings.brandName}
            onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Nama WiFi</label>
          <input
            type="text"
            value={settings.wifiName}
            onChange={(e) => setSettings({ ...settings, wifiName: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Nomor WhatsApp</label>
          <input
            type="text"
            value={settings.waNumber}
            onChange={(e) => setSettings({ ...settings, waNumber: e.target.value })}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">Harga Profile</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Harga ini dipakai saat generate &amp; print voucher
          </p>
        </div>

        <div className="space-y-2.5">
          {Object.keys(settings.prices).map((profile) => (
            <div
              key={profile}
              className="flex items-center justify-between gap-3 py-1.5 border-b border-line last:border-0"
            >
              <span className="text-sm font-medium text-text-primary font-mono truncate">
                {profile}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0 w-32">
                <span className="text-xs text-text-muted">Rp</span>
                <input
                  type="number"
                  value={settings.prices[profile]}
                  onChange={(e) => updatePrice(profile, e.target.value)}
                  className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-signal hover:bg-signal-dark disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
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
      <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2 text-sm">
          <KeyRound className="w-4 h-4 text-signal" />
          Ganti Password Admin
        </h3>

        <div>
          <label className={labelClass}>Password Lama</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
        </div>

        <div>
          <label className={labelClass}>Password Baru</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className={labelClass}>Konfirmasi Password Baru</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        {pwdError ? (
          <div className="flex items-start gap-2 bg-danger-soft border border-danger/20 text-danger rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {pwdError}
          </div>
        ) : null}

        {pwdMessage ? (
          <div className="flex items-start gap-2 bg-signal-soft border border-signal/20 text-signal-dark rounded-lg p-3 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {pwdMessage}
          </div>
        ) : null}

        <button
          onClick={handleChangePassword}
          disabled={pwdLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ink hover:bg-ink-soft disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Ganti Password
        </button>
      </div>
    </div>
  )
}
