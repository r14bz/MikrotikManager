import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { verifyPassword } from "@/lib/password"
import { createSessionToken } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = (body.username || "").trim()
    const password = body.password || ""

    const adminUser = process.env.ADMIN_USERNAME || "admin"

    if (username !== adminUser) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 }
      )
    }

    let valid = false

    try {
      const supabase = await createClient()
      const { data: config } = await supabase
        .from("admin_config")
        .select("password_hash")
        .eq("id", 1)
        .maybeSingle()

      if (config?.password_hash) {
        valid = await verifyPassword(password, config.password_hash)
      } else {
        const envPass = process.env.ADMIN_PASSWORD || ""
        valid = password === envPass
      }
    } catch {
      const envPass = process.env.ADMIN_PASSWORD || ""
      valid = password === envPass
    }

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 }
      )
    }

    const token = await createSessionToken()

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Server belum dikonfigurasi dengan benar (AUTH_SECRET belum diset). Hubungi admin.",
        },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()

    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({ success: true, message: "Login berhasil" })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal login" },
      { status: 500 }
    )
  }
}
