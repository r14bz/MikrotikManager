import { NextRequest, NextResponse } from "next/server"
import { syncVouchersFromMikrotik } from "@/lib/sync"

export async function GET(req: NextRequest) {
  const routerId = req.nextUrl.searchParams.get("router_id")
  if (!routerId) {
    return NextResponse.json(
      { success: false, message: "router_id wajib disertakan", data: [] },
      { status: 400 }
    )
  }

  try {
    const result = await syncVouchersFromMikrotik(routerId)

    return NextResponse.json({
      success: true,
      count: result.count,
      data: result.data,
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
