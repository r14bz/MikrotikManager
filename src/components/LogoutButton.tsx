"use client"

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-red-500 hover:underline"
    >
      Logout
    </button>
  )
}
