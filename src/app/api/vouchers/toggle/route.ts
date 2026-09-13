import { NextRequest, NextResponse } from "next/server"
import { getMikrotikConnection } from "@/lib/mikrotik"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, disabled, router_id } = body

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username wajib diisi" },
        { status: 400 }
      )
    }

    if (!router_id) {
      return NextResponse.json(
        { success: false, message: "router_id wajib disertakan" },
        { status: 400 }
      )
    }

    let conn: Awaited<ReturnType<typeof getMikrotikConnection>>
    try {
      conn = await getMikrotikConnection(router_id, 12)
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          message: "MikroTik offline. " + (err?.message || ""),
        },
        { status: 503 }
      )
    }

    try {
      const found = await conn.write("/ip/hotspot/user/print", [
        "?name=" + username,
      ])

      if (!found || found.length === 0) {
        return NextResponse.json(
          { success: false, message: "User tidak ditemukan di MikroTik" },
          { status: 404 }
        )
      }

      const id = found[0][".id"]

      if (disabled) {
        await conn.write("/ip/hotspot/user/set", [
          "=.id=" + id,
          "=disabled=yes",
        ])
      } else {
        await conn.write("/ip/hotspot/user/set", [
          "=.id=" + id,
          "=disabled=no",
        ])
      }
    } finally {
      try {
        conn.close()
      } catch (_) {}
    }

    // Update Supabase
    try {
      const supabase = await createClient()
      await supabase
        .from("vouchers")
        .update({ status: disabled ? "disabled" : "unused" })
        .eq("router_id", router_id)
        .eq("username", username)
    } catch (e) {
      console.error("Supabase update failed:", e)
    }

    return NextResponse.json({
      success: true,
      message: disabled
        ? "Voucher berhasil di-disable"
        : "Voucher berhasil di-enable",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal mengubah status" },
      { status: 500 }
    )
  }
}
