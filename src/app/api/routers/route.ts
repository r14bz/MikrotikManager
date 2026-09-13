import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("routers")
      .select("id, name, local_ip, created_at")
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message, data: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal memuat daftar router", data: [] },
      { status: 500 }
    )
  }
}
