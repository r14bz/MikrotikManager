import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // unused | used | all
    const search = searchParams.get("search") || ""
    const limit = Number(searchParams.get("limit") || 50)

    const supabase = await createClient()

    let query = supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.ilike("username", `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data" },
      { status: 500 }
    )
  }
}
