import { NextRequest, NextResponse } from "next/server"
import { syncAllRouters } from "@/lib/sync"

// Sync SEMUA router yang terdaftar (bukan cuma satu) — dipanggil oleh
// Vercel Cron dan/atau cron eksternal, tidak terikat router mana yang
// sedang dipilih admin di browser.
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
    const results = await syncAllRouters()
    return NextResponse.json({
      success: true,
      routers: results,
      time: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal sync" },
      { status: 500 }
    )
  }
}
