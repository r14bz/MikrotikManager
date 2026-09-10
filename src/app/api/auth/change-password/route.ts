import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { hashPassword, verifyPassword } from "@/lib/password"
import { verifySessionToken } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get("admin_session")?.value
    const validSession = await verifySessionToken(session)

    if (!validSession) {
      return NextResponse.json(
        { success: false, message: "Tidak diizinkan" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const currentPassword = body.currentPassword || ""
    const newPassword = body.newPassword || ""

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Password lama dan baru wajib diisi" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password baru minimal 6 karakter" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: config } = await supabase
      .from("admin_config")
      .select("password_hash")
      .eq("id", 1)
      .maybeSingle()

    // Verifikasi password lama
    let valid = false
    if (config?.password_hash) {
      valid = await verifyPassword(currentPassword, config.password_hash)
    } else {
      // Belum pernah diganti → pakai env
      const envPass = process.env.ADMIN_PASSWORD || ""
      valid = currentPassword === envPass
    }

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Password lama salah" },
        { status: 401 }
      )
    }

    const newHash = await hashPassword(newPassword)

    const { error } = await supabase.from("admin_config").upsert({
      id: 1,
      password_hash: newHash,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password berhasil diganti",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal ganti password" },
      { status: 500 }
    )
  }
}
