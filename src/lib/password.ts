// Hashing password memakai PBKDF2 (Web Crypto, tersedia native di Node & Edge
// runtime, tanpa dependency tambahan) dengan salt acak per-password dan
// banyak iterasi, sehingga jauh lebih tahan brute-force dibanding SHA-256
// polos dengan salt statis (versi lama).
//
// Format hash baru: "pbkdf2:<iterations>:<saltHex>:<hashHex>"
// verifyPassword tetap bisa memverifikasi hash format LAMA (SHA-256 + AUTH_SECRET)
// agar admin yang sudah pernah ganti password di versi lama tidak langsung
// terkunci — begitu mereka ganti password lagi, otomatis ter-upgrade ke format baru.

const ITERATIONS = 210_000

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("")
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return arr
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  )
  return toHex(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt, ITERATIONS)
  return `pbkdf2:${ITERATIONS}:${toHex(salt)}:${hash}`
}

// Verifikasi hash format lama (peninggalan versi sebelumnya): SHA-256(password + salt)
async function verifyLegacyHash(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + (process.env.AUTH_SECRET || "salt")) as BufferSource
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return toHex(hashBuffer) === hash
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith("pbkdf2:")) {
    const [, iterationsStr, saltHex, hashHex] = hash.split(":")
    const iterations = Number(iterationsStr) || ITERATIONS
    const salt = fromHex(saltHex)
    const computed = await pbkdf2(password, salt, iterations)
    return computed === hashHex
  }

  // Hash lama (belum di-upgrade) — masih didukung supaya tidak mengunci admin.
  return verifyLegacyHash(password, hash)
}
