import { RouterOSAPI } from 'node-routeros'

function getConfig() {
  const host = process.env.MIKROTIK_HOST
  const user = process.env.MIKROTIK_USER
  const password = process.env.MIKROTIK_PASSWORD

  if (!host || !user || !password) {
    throw new Error(
      'Konfigurasi MikroTik belum lengkap. Set MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASSWORD di environment variables.'
    )
  }

  return {
    host,
    port: Number(process.env.MIKROTIK_PORT) || 8728,
    user,
    password,
    timeout: 15,
  }
}

// Satu-satunya tempat yang boleh membuat koneksi RouterOSAPI.
// Semua route API HARUS memanggil ini, bukan `new RouterOSAPI(...)` sendiri,
// supaya konfigurasi/kredensial tidak terduplikasi dan tidak ada nilai default
// yang tidak sengaja "aman" tapi sebenarnya kredensial asli.
export async function getMikrotikConnection(timeoutOverride?: number) {
  const config = getConfig()
  const conn = new RouterOSAPI(
    timeoutOverride ? { ...config, timeout: timeoutOverride } : config
  )
  await conn.connect()
  return conn
}

// Jalankan satu atau beberapa perintah dalam satu koneksi, lalu selalu ditutup.
export async function withMikrotik<T>(
  fn: (conn: Awaited<ReturnType<typeof getMikrotikConnection>>) => Promise<T>,
  timeoutOverride?: number
): Promise<T> {
  const conn = await getMikrotikConnection(timeoutOverride)
  try {
    return await fn(conn)
  } finally {
    try {
      conn.close()
    } catch {
      // sudah ditutup / koneksi terputus, aman diabaikan
    }
  }
}

// Helper: ambil user aktif
export async function getActiveUsers() {
  return withMikrotik((conn) => conn.write('/ip/hotspot/active/print'))
}

// Helper: ambil semua profile
export async function getHotspotProfiles() {
  return withMikrotik((conn) => conn.write('/ip/hotspot/user/profile/print'))
}

// Helper: tambah user hotspot / generate voucher
export async function addHotspotUser(params: {
  name: string
  password: string
  profile: string
  limitUptime?: string
  comment?: string
}) {
  return withMikrotik((conn) =>
    conn.write(
      '/ip/hotspot/user/add',
      [
        `=name=${params.name}`,
        `=password=${params.password}`,
        `=profile=${params.profile}`,
        params.limitUptime ? `=limit-uptime=${params.limitUptime}` : '',
        params.comment ? `=comment=${params.comment}` : '',
      ].filter(Boolean)
    )
  )
}
