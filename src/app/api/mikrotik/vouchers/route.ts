import { NextResponse } from "next/server"
import { syncVouchersFromMikrotik } from "@/lib/sync"

export async function GET() {
  try {
    const result = await syncVouchersFromMikrotik()

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
