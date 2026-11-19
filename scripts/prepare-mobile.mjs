import nextEnv from '@next/env'
import { writeFile } from 'node:fs/promises'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const target = new URL(
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  'http://10.0.2.2:3000',
)
if (!['https:', 'http:'].includes(target.protocol) || target.username || target.password) {
  throw new Error('CAPACITOR_SERVER_URL harus URL HTTP(S) tanpa credential.')
}
// This is a public URL only. Never write private environment variables to web assets.
await writeFile(
  new URL('../mobile/www/server-config.js', import.meta.url),
  `window.TERKASA_SERVER_URL = ${JSON.stringify(target.href.replace(/\/$/, ''))};\n`,
)
console.log('Konfigurasi URL publik TERKASA mobile telah dibuat.')
