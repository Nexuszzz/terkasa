import sharp from 'sharp'
import { envTrim } from '@/lib/server/auth'
import type { ResolvedImage } from '@/lib/server/image-source'

export function geminiWebConfig() {
  const base = (envTrim('GEMINI_WEB_BASE_URL') || 'http://127.0.0.1:8008').replace(/\/$/, '')
  const url = new URL(base)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    throw new Error('Gateway Gemini Web harus memakai HTTPS atau alamat loopback lokal.')
  return { base, key: envTrim('GEMINI_WEB_API_KEY'), model: envTrim('GEMINI_WEB_MODEL') || 'auto' }
}

export async function geminiWebFetch(path: string, init: RequestInit = {}) {
  const config = geminiWebConfig()
  if (!config.key) throw new Error('Gateway Gemini Web belum dikonfigurasi.')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${config.key}`)
  return fetch(`${config.base}${path}`, { ...init, headers, cache: 'no-store', signal: init.signal || AbortSignal.timeout(165_000) })
}

export async function geminiWebReady() {
  try {
    const response = await geminiWebFetch('/v1/status', { signal: AbortSignal.timeout(3000) })
    const status = await response.json()
    return response.ok && status.ready === true
  } catch { return false }
}

export async function generateGeminiWebPoster(input: { prompt: string; aspectRatio?: string; image?: ResolvedImage | null }) {
  let reference: string | undefined
  if (input.image) {
    const raw = Buffer.from(input.image.base64, 'base64')
    const magic = raw.subarray(0, 8).toString('hex')
    if (!magic.startsWith('ffd8ff') && !magic.startsWith('89504e470d0a1a0a') && raw.subarray(8, 12).toString() !== 'WEBP')
      throw new Error('Foto referensi harus JPEG, PNG, atau WebP asli.')
    reference = (await sharp(raw, { limitInputPixels: 32_000_000 }).rotate().resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer()).toString('base64')
  }
  const response = await geminiWebFetch('/v1/images/generations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: input.prompt, model: geminiWebConfig().model, aspect_ratio: input.aspectRatio || '1:1', reference_image: reference, response_format: 'b64_json', n: 1 }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const message = typeof payload.detail === 'string' ? payload.detail : 'Gemini Web belum menghasilkan gambar.'
    throw new Error(message.slice(0, 300))
  }
  const result = await response.json()
  const encoded = result.data?.[0]?.b64_json
  if (typeof encoded !== 'string' || encoded.length > 28_000_000) throw new Error('Hasil gateway bukan gambar yang valid.')
  const buffer = Buffer.from(encoded, 'base64')
  const metadata = await sharp(buffer, { limitInputPixels: 32_000_000 }).metadata()
  if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) throw new Error('Format hasil gateway tidak didukung.')
  return { buffer: await sharp(buffer, { limitInputPixels: 32_000_000 }).jpeg({ quality: 92 }).toBuffer(), model: String(result.model || geminiWebConfig().model) }
}
