export type AppSettings = {
  brandName: string
  waNumber: string
  wifiName: string
  prices: Record<string, number>
}

export const defaultSettings: AppSettings = {
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

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings

  try {
    const raw = localStorage.getItem("app_settings")
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw)
    return {
      ...defaultSettings,
      ...parsed,
      prices: {
        ...defaultSettings.prices,
        ...(parsed.prices || {}),
      },
    }
  } catch {
    return defaultSettings
  }
}

export function getPriceForProfile(profile: string): number {
  const settings = getSettings()
  if (settings.prices[profile] !== undefined) {
    return settings.prices[profile]
  }

  const key = Object.keys(settings.prices).find((k) =>
    profile.toLowerCase().includes(k.toLowerCase())
  )
  return key ? settings.prices[key] : 0
}
