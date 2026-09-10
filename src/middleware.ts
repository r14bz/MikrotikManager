import { NextRequest, NextResponse } from "next/server"
import { verifySessionToken } from "@/lib/session"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Hanya proteksi dashboard
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  const session = req.cookies.get("admin_session")?.value
  const valid = await verifySessionToken(session)

  if (!valid) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
