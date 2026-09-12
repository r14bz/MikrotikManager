import { createClient } from "@/lib/supabase/server"
import { withMikrotik } from "@/lib/mikrotik"
import { defaultSettings, resolvePrice } from "@/lib/settings"

// Dipakai bersama oleh /api/mikrotik/vouchers (dipanggil browser saat buka
// halaman Kelola Voucher) dan /api/cron/sync (dipanggil scheduler otomatis),
// supaya logikanya cuma ada di satu tempat.
export async function syncVouchersFromMikrotik() {
  const { users, active } = await withMikrotik(async (conn) => {
    const [users, active] = await Promise.all([
      conn.write("/ip/hotspot/user/print"),
      conn.write("/ip/hotspot/active/print"),
    ])
    return { users, active }
  })

  const activeNames = new Set((active || []).map((u: any) => u.user || u.name))

  // Ambil harga dari Supabase (diatur admin di halaman Pengaturan).
  // Kalau baris settings belum ada / gagal diambil, fallback ke default.
  let prices = defaultSettings.prices
  try {
    const supabase = await createClient()
    const { data: settingsRow } = await supabase
      .from("app_settings")
      .select("prices")
      .eq("id", 1)
      .maybeSingle()

    if (settingsRow?.prices) {
      prices = { ...defaultSettings.prices, ...settingsRow.prices }
    }
  } catch {
    // pakai default
  }

  const list = (users || []).map((u: any) => {
    const username = u.name || ""
    const profileName = u.profile || "-"
    const isOnline = activeNames.has(username)
    const disabled = u.disabled === "true" || u.disabled === true
    const uptime = u.uptime || "0s"
    const bytesIn = Number(u["bytes-in"] || 0)
    const bytesOut = Number(u["bytes-out"] || 0)

    const hasTraffic = bytesIn > 0 || bytesOut > 0
    const hasUptime = uptime && uptime !== "0s" && uptime !== "00:00:00" && uptime !== "0"

    let status = "unused"
    if (disabled) status = "disabled"
    else if (isOnline) status = "online"
    else if (hasUptime || hasTraffic) status = "used"

    return {
      id: u[".id"],
      username,
      password: u.password || username,
      profile_name: profileName,
      // Harga di sini cuma fallback saat sync otomatis. Voucher yang dibuat
      // lewat halaman Generate sudah punya harga sendiri di Supabase dan
      // TIDAK akan ketiban nilai ini (lihat logika "wasAlreadyUsed" di bawah).
      price: resolvePrice(profileName, prices),
      limit_uptime: u["limit-uptime"] || "",
      uptime,
      disabled,
      comment: u.comment || "",
      status,
      bytesIn,
      bytesOut,
    }
  })

  let synced = false
  try {
    const supabase = await createClient()

    const usernames = list.map((v) => v.username).filter(Boolean)
    const existingByUsername = new Map<
      string,
      { status: string | null; used_at: string | null; price: number | null }
    >()

    if (usernames.length > 0) {
      const { data: existing } = await supabase
        .from("vouchers")
        .select("username, status, used_at, price")
        .in("username", usernames)

      for (const row of existing || []) {
        existingByUsername.set(row.username, row)
      }
    }

    // Bangun semua payload dulu, baru kirim SATU KALI sebagai batch upsert.
    // Sebelumnya ini upsert satu-per-satu per voucher (bisa ratusan request
    // berurutan) — jadi sangat lambat dan gampang timeout saat dipanggil
    // dari cron. `used_at` SELALU disertakan (walau null) di tiap baris,
    // supaya semua objek dalam satu batch punya kolom yang sama persis —
    // kalau tidak, PostgREST bisa menganggap baris yang tidak menyertakan
    // kolom itu sebagai NULL dan menimpa used_at yang sudah benar.
    const payloads = list.map((v) => {
      const existing = existingByUsername.get(v.username)
      const wasAlreadyUsed =
        existing?.status === "used" || existing?.status === "online" || !!existing?.used_at
      const isUsedNow = v.status === "used" || v.status === "online"

      return {
        username: v.username,
        password: v.password,
        profile_name: v.profile_name,
        // Jangan timpa harga yang sudah tercatat sebelumnya.
        price: existing?.price ?? v.price,
        limit_uptime: v.limit_uptime,
        status: v.status === "online" ? "used" : v.status,
        comment: v.comment,
        used_at:
          isUsedNow && !wasAlreadyUsed
            ? new Date().toISOString()
            : existing?.used_at ?? null,
      }
    })

    if (payloads.length > 0) {
      const { error } = await supabase
        .from("vouchers")
        .upsert(payloads, { onConflict: "username" })

      if (error) throw error
    }

    synced = true
  } catch (e) {
    console.error("Sync Supabase failed:", e)
  }

  return { count: list.length, data: list, synced }
}
