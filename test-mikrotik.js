// Script bantu untuk tes koneksi ke MikroTik secara manual.
// Jalankan dengan environment variables sudah diset, contoh:
//   MIKROTIK_HOST=xxx MIKROTIK_PORT=2573 MIKROTIK_USER=xxx MIKROTIK_PASSWORD=xxx node test-mikrotik.js
// Atau taruh di file .env lalu jalankan lewat: node -r dotenv/config test-mikrotik.js
const { RouterOSAPI } = require("node-routeros");

async function test() {
  const host = process.env.MIKROTIK_HOST;
  const port = Number(process.env.MIKROTIK_PORT) || 8728;
  const user = process.env.MIKROTIK_USER;
  const password = process.env.MIKROTIK_PASSWORD;

  if (!host || !user || !password) {
    console.error(
      "MIKROTIK_HOST, MIKROTIK_USER, dan MIKROTIK_PASSWORD wajib diset sebagai environment variable."
    );
    process.exit(1);
  }

  const conn = new RouterOSAPI({ host, port, user, password, timeout: 15 });

  try {
    console.log("Connecting...");
    await conn.connect();
    console.log("Connected!");

    const identity = await conn.write("/system/identity/print");
    console.log("Identity:", identity);

    const active = await conn.write("/ip/hotspot/active/print");
    console.log("Active users:", active.length);

    conn.close();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
