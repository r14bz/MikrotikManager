import { NextResponse } from "next/server"
import { withMikrotik } from "@/lib/mikrotik"

export async function GET() {
  try {
    const [identity, resource] = await withMikrotik(
      (conn) =>
        Promise.all([
          conn.write("/system/identity/print"),
          conn.write("/system/resource/print"),
        ]),
      20
    )

    return NextResponse.json({
      success: true,
      message: "Berhasil terhubung ke MikroTik",
      data: {
        identity: identity?.[0]?.name || "Unknown",
        version: resource?.[0]?.version || "-",
        uptime: resource?.[0]?.uptime || "-",
        cpu: resource?.[0]?.["cpu-load"] || "-",
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal terhubung ke MikroTik",
      },
      { status: 500 }
    )
  }
}
