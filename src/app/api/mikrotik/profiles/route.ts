import { NextResponse } from "next/server"
import { withMikrotik } from "@/lib/mikrotik"

export async function GET() {
  try {
    const profiles = await withMikrotik(
      (conn) => conn.write("/ip/hotspot/user/profile/print"),
      12
    )

    const formatted = (profiles || []).map((p: any) => ({
      name: p.name,
      sessionTimeout: p["session-timeout"] || "",
      idleTimeout: p["idle-timeout"] || "",
      sharedUsers: p["shared-users"] || "1",
      rateLimit: p["rate-limit"] || "",
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal mengambil profile dari MikroTik",
        data: [],
      },
      { status: 500 }
    )
  }
}
