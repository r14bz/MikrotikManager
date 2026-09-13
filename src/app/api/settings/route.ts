import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { defaultSettings, AppSettings } from "@/lib/settings"

export async function GET(req: NextRequest) {
  const routerId = req.nextUrl.searchParams.get("router_id")

  if (!routerId) {
    return NextResponse.json(
      { success: false, message: "router_id wajib disertakan" },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("app_settings")
      .select("brand_name, wa_number, wifi_name, prices")
      .eq("router_id", routerId)
      .maybeSingle()

    if (error || !data) {
      // Baris belum ada untuk router ini -> pakai default, jangan gagal total.
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
    const routerId = body.router_id

    if (!routerId) {
      return NextResponse.json(
        { success: false, message: "router_id wajib disertakan" },
        { status: 400 }
      )
    }

    const brandName = String(body.brandName || defaultSettings.brandName)
    const waNumber = String(body.waNumber || defaultSettings.waNumber)
    const wifiName = String(body.wifiName || defaultSettings.wifiName)
    const prices =
      body.prices && typeof body.prices === "object" ? body.prices : defaultSettings.prices

    const supabase = await createClient()

    const { error } = await supabase.from("app_settings").upsert(
      {
        router_id: routerId,
        brand_name: brandName,
        wa_number: waNumber,
        wifi_name: wifiName,
        prices,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "router_id" }
    )

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
