import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { defaultSettings, AppSettings } from "@/lib/settings"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("app_settings")
      .select("brand_name, wa_number, wifi_name, prices")
      .eq("id", 1)
      .maybeSingle()

    if (error || !data) {
      // Baris belum ada / tabel belum dimigrasi -> pakai default, jangan gagal total.
      return NextResponse.json({ success: true, data: defaultSettings, fallback: true })
    }

    const settings: AppSettings = {
      brandName: data.brand_name || defaultSettings.brandName,
      waNumber: data.wa_number || defaultSettings.waNumber,
      wifiName: data.wifi_name || defaultSettings.wifiName,
      prices: {
        ...defaultSettings.prices,
        ...(data.prices || {}),
      },
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error: any) {
    return NextResponse.json({ success: true, data: defaultSettings, fallback: true })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const brandName = String(body.brandName || defaultSettings.brandName)
    const waNumber = String(body.waNumber || defaultSettings.waNumber)
    const wifiName = String(body.wifiName || defaultSettings.wifiName)
    const prices =
      body.prices && typeof body.prices === "object" ? body.prices : defaultSettings.prices

    const supabase = await createClient()

    const { error } = await supabase.from("app_settings").upsert({
      id: 1,
      brand_name: brandName,
      wa_number: waNumber,
      wifi_name: wifiName,
      prices,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Pengaturan tersimpan" })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal menyimpan pengaturan" },
      { status: 500 }
    )
  }
}
