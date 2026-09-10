import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { withMikrotik } from "@/lib/mikrotik"
import { defaultSettings } from "@/lib/settings"

export async function GET() {
  try {
    const { users, active } = await withMikrotik(async (conn) => {
      const [users, active] = await Promise.all([
        conn.write("/ip/hotspot/user/print"),
        conn.write("/ip/hotspot/active/print"),
      ])
      return { users, active }
    })

    const activeNames = new Set(
      (active || []).map((u: any) => u.user || u.name)
    )

    const list = (users || []).map((u: any) => {
      const username = u.name || ""
      const profileName = u.profile || "-"
      const isOnline = activeNames.has(username)
      const disabled = u.disabled === "true" || u.disabled === true
      const uptime = u.uptime || "0s"
      const bytesIn = Number(u["bytes-in"] || 0)
      const bytesOut = Number(u["bytes-out"] || 0)

      const hasTraffic = bytesIn > 0 || bytesOut > 0
      const hasUptime =
        uptime &&
        uptime !== "0s" &&
        uptime !== "00:00:00" &&
        uptime !== "0"

      let status = "unused"
      if (disabled) status = "disabled"
      else if (isOnline) status = "online"
      else if (hasUptime || hasTraffic) status = "used"

      return {
        id: u[".id"],
        username,
        password: u.password || username,
        profile_name: profileName,
        // Catatan: harga di sini hanya dipakai sebagai fallback saat sync
        // otomatis dari MikroTik. Harga sebenarnya untuk voucher yang dibuat
        // lewat halaman Generate sudah disimpan langsung ke Supabase saat
        // voucher dibuat (lihat /api/vouchers/generate), jadi tidak akan
        // ketiban nilai default ini.
        price: defaultSettings.prices[profileName] ?? 0,
        limit_uptime: u["limit-uptime"] || "",
        uptime: uptime,
        disabled,
        comment: u.comment || "",
        status,
        bytesIn,
        bytesOut,
      }
    })

    try {
      const supabase = await createClient()

      // Ambil status & used_at yang SUDAH TERCATAT lebih dulu, supaya sync ini
      // tidak menimpa used_at voucher yang sudah lama dipakai dengan waktu
      // "sekarang" setiap kali endpoint ini dipanggil (bug lama).
      const usernames = list.map((v) => v.username).filter(Boolean)
      const existingByUsername = new Map<string, { status: string | null; used_at: string | null; price: number | null }>()

      if (usernames.length > 0) {
        const { data: existing } = await supabase
          .from("vouchers")
          .select("username, status, used_at, price")
          .in("username", usernames)

        for (const row of existing || []) {
          existingByUsername.set(row.username, row)
        }
      }

      for (const v of list) {
        const existing = existingByUsername.get(v.username)
        const wasAlreadyUsed =
          existing?.status === "used" || existing?.status === "online" || !!existing?.used_at

        const payload: any = {
          username: v.username,
          password: v.password,
          profile_name: v.profile_name,
          // Jangan timpa harga yang sudah tercatat sebelumnya (mis. harga asli
          // saat voucher dibuat) dengan harga default hasil sync.
          price: existing?.price ?? v.price,
          limit_uptime: v.limit_uptime,
          status: v.status === "online" ? "used" : v.status,
          comment: v.comment,
        }

        const isUsedNow = v.status === "used" || v.status === "online"
        if (isUsedNow && !wasAlreadyUsed) {
          // Baru pertama kali terdeteksi terpakai -> catat waktunya sekarang.
          payload.used_at = new Date().toISOString()
        }

        await supabase.from("vouchers").upsert(payload, {
          onConflict: "username",
        })
      }
    } catch (e) {
      console.error("Sync Supabase failed:", e)
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal mengambil data dari MikroTik",
        data: [],
      },
      { status: 500 }
    )
  }
}
