import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let month = searchParams.get("month") // diharapkan: 2026-09

    // Validasi format YYYY-MM
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      month = null
    }

    // Default: bulan ini
    if (!month) {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, "0")
      month = `${y}-${m}`
    }

    const start = `${month}-01T00:00:00.000Z`

    // Hitung akhir bulan
    const [yearStr, monthStr] = month.split("-")
    const year = Number(yearStr)
    const mon = Number(monthStr)
    const endDate = new Date(Date.UTC(year, mon, 1)) // bulan berikutnya
    const end = endDate.toISOString()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("vouchers")
      .select("id, username, profile_name, price, status, created_at, sold_at, used_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    const vouchers = data || []

    const totalGenerated = vouchers.length
    const totalUsed = vouchers.filter(
      (v) =>
        v.status === "used" ||
        v.status === "online" ||
        v.sold_at ||
        v.used_at
    ).length
    const totalUnused = vouchers.filter((v) => v.status === "unused").length
    const totalRevenue = vouchers
      .filter(
        (v) =>
          v.status === "used" ||
          v.status === "online" ||
          v.sold_at ||
          v.used_at
      )
      .reduce((sum, v) => sum + (Number(v.price) || 0), 0)

    const byProfile: Record<
      string,
      { count: number; used: number; revenue: number }
    > = {}

    vouchers.forEach((v) => {
      const key = v.profile_name || "unknown"
      if (!byProfile[key]) byProfile[key] = { count: 0, used: 0, revenue: 0 }
      byProfile[key].count += 1
      if (
        v.status === "used" ||
        v.status === "online" ||
        v.sold_at ||
        v.used_at
      ) {
        byProfile[key].used += 1
        byProfile[key].revenue += Number(v.price) || 0
      }
    })

    const byDate: Record<string, { count: number; revenue: number }> = {}
    vouchers.forEach((v) => {
      const date = (v.created_at || "").split("T")[0]
      if (!date) return
      if (!byDate[date]) byDate[date] = { count: 0, revenue: 0 }
      byDate[date].count += 1
      if (
        v.status === "used" ||
        v.status === "online" ||
        v.sold_at ||
        v.used_at
      ) {
        byDate[date].revenue += Number(v.price) || 0
      }
    })

    return NextResponse.json({
      success: true,
      month,
      summary: {
        totalGenerated,
        totalUsed,
        totalUnused,
        totalRevenue,
      },
      byProfile,
      byDate,
      recent: vouchers.slice(0, 30),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil laporan" },
      { status: 500 }
    )
  }
}
