import { NextResponse } from "next/server"
import { withMikrotik } from "@/lib/mikrotik"

export async function GET() {
  try {
    const activeUsers = await withMikrotik(
      (conn) => conn.write("/ip/hotspot/active/print"),
      20
    )

    const formatted = (activeUsers || []).map((user: any) => ({
      id: user[".id"] || "-",
      user: user.user || "-",
      address: user.address || "-",
      mac: user["mac-address"] || "-",
      uptime: user.uptime || "-",
      bytesIn: formatBytes(Number(user["bytes-in"] || 0)),
      bytesOut: formatBytes(Number(user["bytes-out"] || 0)),
      server: user.server || "-",
    }))

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal mengambil data user aktif",
        data: [],
      },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
