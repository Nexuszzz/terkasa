import { envTrim } from '@/lib/server/auth'
import { geminiWebConfig, geminiWebFetch } from '@/lib/server/gemini-web'

export const DEFAULT_GEMINI_TEXT_MODEL = 'gemini-3.5-flash-lite'

export function geminiRuntimeConfig() {
  const web = envTrim('GEMINI_BACKEND') === 'web'
  const key = envTrim(web ? 'GEMINI_WEB_API_KEY' : 'GEMINI_API_KEY')
  return {
    web,
    configured: Boolean(key && (web || key.startsWith('AIza'))),
    model: web ? geminiWebConfig().model : envTrim('GEMINI_MODEL') || DEFAULT_GEMINI_TEXT_MODEL,
    provider: web ? 'gemini-web' : 'gemini',
    error: web ? 'Gateway Gemini Web belum dikonfigurasi. Jalankan setup gateway lokal.' : 'GEMINI_API_KEY belum tersedia atau tidak valid. Gunakan API key Google AI Studio.',
  }
}

export const geminiTimeout = () => envTrim('GEMINI_BACKEND') === 'web' ? 165_000 : 30_000

/** Keep credentials out of URLs and retry one transient server failure within the caller's deadline. */
export async function fetchGemini(
  model: string,
  init: RequestInit,
): Promise<Response> {
  if (envTrim('GEMINI_BACKEND') === 'web') {
    const selected = geminiWebConfig().model
    const response = await geminiWebFetch(`/v1beta/models/${encodeURIComponent(selected)}:generateContent`, init)
    if (response.ok) return response
    // Keep the native error shape expected by existing callers. Never forward raw cookies/errors.
    return Response.json({ error: { code: response.status, status: 'WEB_GATEWAY_UNAVAILABLE', message: 'Gemini Web belum siap. Periksa gateway dan sesi akun lokal.' } }, { status: response.status })
  }
  const key = envTrim('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY belum tersedia di server.')
  const headers = new Headers(init.headers)
  headers.set('x-goog-api-key', key)
  const signal = init.signal || AbortSignal.timeout(30_000)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(endpoint, { ...init, headers, signal })
      if (
        attempt === 1 ||
        ![502, 503, 504].includes(response.status) ||
        signal.aborted
      )
        return response
      await response.body?.cancel()
    } catch (error) {
      if (attempt === 1 || signal.aborted) throw error
    }
    await new Promise((resolve) => setTimeout(resolve, 350))
    signal.throwIfAborted()
  }
  throw new Error('Layanan Gemini tidak dapat dijangkau.')
}
