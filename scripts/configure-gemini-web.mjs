import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const key = (await readFile(path.join(root, 'integrations/gemini-web/.state/api-key'), 'utf8')).trim()
if (key.length < 32) throw new Error('Jalankan gateway sekali untuk membuat API key lokal terlebih dahulu.')
const target = path.join(root, '.env.local')
let content = await readFile(target, 'utf8').catch(e => { if (e.code !== 'ENOENT') throw e; return '' })
await mkdir(path.join(root, '.recovery'), { recursive: true })
if (content) await copyFile(target, path.join(root, `.recovery/env-before-gemini-web-${Date.now()}.local`))
const values = { GEMINI_BACKEND: 'web', POSTER_IMAGE_PROVIDER: 'gemini-web', GEMINI_WEB_BASE_URL: 'http://127.0.0.1:8008', GEMINI_WEB_API_KEY: key, GEMINI_WEB_MODEL: 'auto' }
for (const [name, value] of Object.entries(values)) {
  const line = `${name}=${value}`
  const pattern = new RegExp(`^${name}=.*$`, 'm')
  content = pattern.test(content) ? content.replace(pattern, () => line) : `${content.trimEnd()}\n${line}\n`
}
await writeFile(target, content, { mode: 0o600 })
console.log('Konfigurasi Gemini Web disimpan di .env.local; env sebelumnya dicadangkan. Nilai rahasia tidak ditampilkan.')
console.log('Restart server Next.js Anda setelah konfigurasi berubah. Gateway tetap memerlukan sesi Google melalui /setup.')
