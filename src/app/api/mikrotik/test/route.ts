import { NextRequest, NextResponse } from "next/server"
import { withMikrotik } from "@/lib/mikrotik"

export async function GET(req: NextRequest) {
  const routerId = req.nextUrl.searchParams.get("router_id")
  if (!routerId) {
    return NextResponse.json(
      { success: false, message: "router_id wajib disertakan" },
      { status: 400 }
    )
  }

  try {
    const [identity, resource] = await withMikrotik(
      routerId,
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
