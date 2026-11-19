import assert from 'node:assert/strict'
import { fetchGemini } from '../lib/server/gemini-client.ts'
import { buildPosterPrompt, gentyReachable } from '../lib/server/genty.ts'
import { aiograpiVerifySession } from '../lib/server/aiograpi-client.ts'
import { renderPosterTemplate } from '../lib/server/poster-template.ts'
import sharp from 'sharp'

const originalFetch = globalThis.fetch
const originalKey = process.env.GEMINI_API_KEY
const originalPosterKey = process.env.GENTY_API_KEY
const originalBackend = process.env.GEMINI_BACKEND
process.env.GEMINI_BACKEND = 'cloud'
const passed = []
process.env.GEMINI_API_KEY = 'integration-test-key-only'
process.env.GENTY_API_KEY = 'integration-test-poster-key-only'
try {
  let calls = 0
  globalThis.fetch = async (url, init) => {
    calls++
    assert.ok(!String(url).includes('integration-test-key-only'))
    assert.equal(new Headers(init.headers).get('x-goog-api-key'), 'integration-test-key-only')
    return new Response('{}', { status: calls === 1 ? 503 : 200 })
  }
  assert.equal((await fetchGemini('test-model', { method: 'POST', body: '{}' })).status, 200)
  assert.equal(calls, 2)
  passed.push('one transient Gemini failure is retried; credential stays out of the URL')

  for (const status of [403, 429]) {
    calls = 0
    globalThis.fetch = async () => { calls++; return new Response('{}', { status }) }
    assert.equal((await fetchGemini('test-model', {})).status, status)
    assert.equal(calls, 1)
  }
  passed.push('permission and quota failures are not retried')

  globalThis.fetch = async () => new Response('', { status: 522 })
  assert.equal(await gentyReachable(), false)
  passed.push('unavailable Genity origin is detected without creating a generation job')

  globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'login_required' }), { status: 500 })
  const session = await aiograpiVerifySession('test-session-only')
  assert.equal(session.ok, false)
  assert.ok(session.error.includes('login_required'))
  passed.push('expired Instagram session is reported as disconnected')

  const prompt = buildPosterPrompt({ productName: 'Sapi Limousin', category: 'Peternakan', hasProductPhoto: true })
  assert.ok(prompt.includes('livestock marketing'))
  assert.ok(!prompt.includes('Design premium packaging'))
  assert.ok(prompt.includes('Do not invent breed certifications'))
  passed.push('livestock poster prompt preserves the animal instead of inventing packaging')

  const originalPhoto = await sharp({ create: { width: 480, height: 360, channels: 3, background: '#49a962' } }).png().toBuffer()
  const poster = await renderPosterTemplate({ productName: 'Sapi Limousin', image: { mimeType: 'image/png', base64: originalPhoto.toString('base64'), isPublicRemote: false, source: 'data-url' } })
  const metadata = await sharp(poster).metadata()
  assert.equal(metadata.format, 'png')
  assert.equal(metadata.width, metadata.height)
  await assert.rejects(renderPosterTemplate({ productName: 'Invalid', image: { mimeType: 'image/png', base64: Buffer.from('<svg>invalid input</svg>').toString('base64'), isPublicRemote: false, source: 'data-url' } }))
  passed.push('automatic template accepts the original raster photo and rejects disguised SVG input')
} finally {
  if (originalBackend === undefined) delete process.env.GEMINI_BACKEND; else process.env.GEMINI_BACKEND = originalBackend
  globalThis.fetch = originalFetch
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = originalKey
  if (originalPosterKey === undefined) delete process.env.GENTY_API_KEY
  else process.env.GENTY_API_KEY = originalPosterKey
}
console.log(JSON.stringify({ passed: passed.length, checks: passed, externalRequests: 0 }, null, 2))
