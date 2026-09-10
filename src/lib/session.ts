// Session token bertanda tangan (signed), menggantikan pola lama yang
// menyimpan AUTH_SECRET mentah-mentah sebagai isi cookie.
//
// Format token: base64url(payloadJson).base64url(HMAC-SHA256(payloadJson))
// - Tidak bisa dipalsukan tanpa tahu AUTH_SECRET.
// - Punya masa berlaku (exp) sendiri, terpisah dari umur cookie.
// - TIDAK ada fallback secret. Kalau AUTH_SECRET belum diset, semua sesi
//   dianggap tidak valid (fail closed), bukan malah menerima nilai default
//   yang bisa ditebak siapa saja dari kode sumber (fail open).

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 hari

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET
  return secret && secret.length > 0 ? secret : null
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let str = ""
  for (const b of arr) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/")
  const str = atob(padded + "===".slice((padded.length + 3) % 4))
  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i)
  return arr
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data) as BufferSource)
  return toBase64Url(sig)
}

export async function createSessionToken(): Promise<string | null> {
  const secret = getSecret()
  if (!secret) return null

  const payload = JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload))
  const sig = await hmac(secret, payloadB64)
  return `${payloadB64}.${sig}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = getSecret()
  if (!secret || !token) return false

  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [payloadB64, sig] = parts

  const expectedSig = await hmac(secret, payloadB64)
  if (expectedSig.length !== sig.length) return false

  // Perbandingan constant-time sederhana untuk menghindari timing attack.
  let diff = 0
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i)
  }
  if (diff !== 0) return false

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)))
    if (typeof payload.exp !== "number") return false
    return payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
