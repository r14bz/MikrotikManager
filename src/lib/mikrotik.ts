import { RouterOSAPI } from 'node-routeros'
import { createClient } from '@/lib/supabase/server'

export type RouterConfig = {
  id: string
  host: string
  port: number
  user: string
  password: string
}

// Kredensial MikroTik sekarang disimpan per-router di Supabase (tabel
// `routers`), BUKAN lagi di environment variables — supaya bisa nambah
// router baru tanpa perlu ubah env var/redeploy.
export async function getRouterConfig(routerId: string): Promise<RouterConfig> {
  if (!routerId) {
    throw new Error('router_id wajib disertakan')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('routers')
    .select('id, host, port, username, password')
    .eq('id', routerId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Router tidak ditemukan')
  }

  return {
    id: data.id,
    host: data.host,
    port: data.port || 8728,
    user: data.username,
    password: data.password,
  }
}

export async function getMikrotikConnection(routerId: string, timeoutOverride?: number) {
  const config = await getRouterConfig(routerId)
  const conn = new RouterOSAPI({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    timeout: timeoutOverride || 15,
  })
  await conn.connect()
  return conn
}

// Jalankan satu atau beberapa perintah dalam satu koneksi, lalu selalu ditutup.
export async function withMikrotik<T>(
  routerId: string,
  fn: (conn: Awaited<ReturnType<typeof getMikrotikConnection>>) => Promise<T>,
  timeoutOverride?: number
): Promise<T> {
  const conn = await getMikrotikConnection(routerId, timeoutOverride)
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
