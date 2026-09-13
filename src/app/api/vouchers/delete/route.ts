import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMikrotikConnection } from "@/lib/mikrotik"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { usernames, router_id } = body

    if (!usernames || usernames.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada voucher yang dipilih" },
        { status: 400 }
      )
    }

    if (!router_id) {
      return NextResponse.json(
        { success: false, message: "router_id wajib disertakan" },
        { status: 400 }
      )
    }

    // 1. Hapus dari MikroTik (wajib)
    let conn: Awaited<ReturnType<typeof getMikrotikConnection>>
    try {
      conn = await getMikrotikConnection(router_id, 15)
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          message:
            "MikroTik offline. Tidak bisa menghapus. " + (err?.message || ""),
        },
        { status: 503 }
      )
    }

    let deleted = 0
    const errors: string[] = []

    try {
      for (const username of usernames) {
        try {
          const found = await conn.write("/ip/hotspot/user/print", [
            `?name=${username}`,
          ])

          if (found && found.length > 0) {
            await conn.write("/ip/hotspot/user/remove", [
              `=.id=${found[0][".id"]}`,
            ])
            deleted++
          }
        } catch (err: any) {
          errors.push(`${username}: ${err?.message || "gagal"}`)
        }
      }
    } finally {
      try {
        conn.close()
      } catch (_) {}
    }

    // 2. Hapus dari Supabase (jika ada)
    try {
      const supabase = await createClient()
      await supabase
        .from("vouchers")
        .delete()
        .eq("router_id", router_id)
        .in("username", usernames)
    } catch (e) {
      console.error("Supabase delete failed:", e)
    }

    if (deleted === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada user yang berhasil dihapus dari MikroTik",
          errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deleted} voucher dari MikroTik`,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal menghapus" },
      { status: 500 }
    )
  }
}
