import { NextRequest, NextResponse } from "next/server"
import { syncVouchersFromMikrotik } from "@/lib/sync"

// Dipanggil oleh scheduler (Vercel Cron dan/atau cron eksternal gratis
// seperti cron-job.org) supaya data voucher & status online tetap segar
// walau tidak ada admin yang buka halaman Kelola Voucher.
//
// Dilindungi CRON_SECRET: request tanpa secret yang cocok ditolak, supaya
// endpoint ini tidak bisa dipicu sembarang orang dari luar.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!secret) {
    return NextResponse.json(
      { success: false, message: "CRON_SECRET belum diset di environment variables" },
      { status: 500 }
    )
  }

  if (provided !== secret) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await syncVouchersFromMikrotik()
    return NextResponse.json({
      success: true,
      synced: result.synced,
      count: result.count,
      time: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal sync" },
      { status: 500 }
    )
  }
}
