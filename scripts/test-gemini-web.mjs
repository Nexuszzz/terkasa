import assert from 'node:assert/strict'
import sharp from 'sharp'
import { geminiWebConfig, geminiWebFetch, geminiWebReady, generateGeminiWebPoster } from '../lib/server/gemini-web.ts'
import { fetchGemini, geminiRuntimeConfig, geminiTimeout } from '../lib/server/gemini-client.ts'

const names = ['GEMINI_BACKEND', 'GEMINI_API_KEY', 'GEMINI_WEB_API_KEY', 'GEMINI_WEB_BASE_URL', 'GEMINI_WEB_MODEL']
const original = Object.fromEntries(names.map(n => [n, process.env[n]]))
const originalFetch = globalThis.fetch
const checks = []
try {
  Object.assign(process.env, { GEMINI_BACKEND: 'web', GEMINI_WEB_API_KEY: 'local-test-key', GEMINI_WEB_BASE_URL: 'http://127.0.0.1:8008', GEMINI_WEB_MODEL: 'auto' })
  delete process.env.GEMINI_API_KEY
  assert.equal(geminiRuntimeConfig().configured, true)
  assert.equal(geminiTimeout(), 165000)
  checks.push('web mode works without a cloud API key and has a web generation deadline')
  let calls = 0
  globalThis.fetch = async (url, init) => {
    calls++
    assert.equal(String(url), 'http://127.0.0.1:8008/v1beta/models/auto:generateContent')
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer local-test-key')
    assert.equal(new Headers(init.headers).get('x-goog-api-key'), null)
    assert.ok(!String(url).includes('local-test-key'))
    return Response.json({ candidates: [] })
  }
  assert.equal((await fetchGemini('ignored-cloud-model', { method: 'POST', body: '{}' })).status, 200)
  assert.equal(calls, 1)
  checks.push('native requests use the account model and bearer header, without cloud credentials in URL')
  calls = 0
  globalThis.fetch = async () => { calls++; return Response.json({}, { status: 429 }) }
  assert.equal((await fetchGemini('unused', {})).status, 429)
  assert.equal(calls, 1)
  checks.push('web quota failures are not automatically retried')
  for (const [status, ready, expected] of [[200, true, true], [200, false, false], [401, true, false]]) {
    globalThis.fetch = async () => Response.json({ ready }, { status })
    assert.equal(await geminiWebReady(), expected)
  }
  checks.push('liveness and an unauthorized response cannot masquerade as an active session')
  const photo = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#326133' } }).png().toBuffer()
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body)
    assert.equal(body.aspect_ratio, '9:16')
    assert.equal((await sharp(Buffer.from(body.reference_image, 'base64')).metadata()).format, 'jpeg')
    return Response.json({ model: 'account-model', data: [{ b64_json: photo.toString('base64') }] })
  }
  const image = await generateGeminiWebPoster({ prompt: 'Sapi', aspectRatio: '9:16', image: { base64: photo.toString('base64'), mimeType: 'image/png', source: 'data-url', isPublicRemote: false } })
  assert.equal((await sharp(image.buffer).metadata()).format, 'jpeg')
  assert.equal(image.model, 'account-model')
  checks.push('references are normalized and poster output becomes a valid JPEG for publishing')
  await assert.rejects(generateGeminiWebPoster({ prompt: 'Sapi', image: { base64: Buffer.from('<svg/>').toString('base64'), mimeType: 'image/png', source: 'data-url', isPublicRemote: false } }))
  checks.push('a spoofed reference image is rejected')
  process.env.GEMINI_WEB_BASE_URL = 'http://example.test'
  assert.throws(geminiWebConfig)
  checks.push('unencrypted remote gateway URLs are rejected')
  process.env.GEMINI_WEB_BASE_URL = 'http://127.0.0.1:8008'
  delete process.env.GEMINI_WEB_API_KEY
  await assert.rejects(geminiWebFetch('/v1/status'))
  checks.push('missing gateway credentials fail before network access')
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2))
} finally {
  globalThis.fetch = originalFetch
  for (const name of names) if (original[name] === undefined) delete process.env[name]; else process.env[name] = original[name]
}
