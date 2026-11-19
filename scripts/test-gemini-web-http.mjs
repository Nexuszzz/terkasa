// Full Next.js route contracts against an isolated stub gateway and disposable app data.
// Real Google sessions and recovered business data are never used by this test.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd(), output = path.join(root, '.verification/gemini-web-http')
await mkdir(output, { recursive: true })
const photo = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#375939' } }).png().toBuffer()
let ready = true, upstreamStatus = 200, generated = 0, nativeCalls = 0, lastImage
const gateway = createServer(async (req, res) => {
  const reply = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
  if (req.headers.authorization !== 'Bearer http-test-only') return reply(401, {})
  if (req.url === '/v1/status') return reply(200, { ready })
  const chunks = []; for await (const chunk of req) chunks.push(chunk)
  const body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
  if (req.url === '/v1/images/generations') {
    generated++; lastImage = body
    return reply(upstreamStatus, upstreamStatus === 200 ? { model: 'fixture-model', data: [{ b64_json: photo.toString('base64') }] } : { detail: 'Fixture gateway unavailable' })
  }
  nativeCalls++
  assert.ok(body.contents[0].parts.some(p => p.text))
  const text = JSON.stringify({ captions: { Instagram: 'Caption fixture TERKASA' }, product: 'Sapi Limousin', qty: 2, price: 25000000 })
  reply(upstreamStatus, { candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] })
})
await new Promise((resolve, reject) => { gateway.once('error', reject); gateway.listen(8009, '127.0.0.1', resolve) })
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3017'], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, TERKASA_DATA_DIR: path.join(output, 'data'), DATABASE_URL: '', GEMINI_BACKEND: 'web', GEMINI_API_KEY: '', GEMINI_WEB_API_KEY: 'http-test-only', GEMINI_WEB_BASE_URL: 'http://127.0.0.1:8009', GEMINI_WEB_MODEL: 'auto', POSTER_IMAGE_PROVIDER: 'gemini-web', POSTER_TEMPLATE_FALLBACK: 'true' },
})
let logs = ''; app.stdout.on('data', d => { logs += d }); app.stderr.on('data', d => { logs += d })
const base = 'http://127.0.0.1:3017', checks = []
let cookie = ''
async function call(url, body, expected = 200) {
  const response = await fetch(base + url, { headers: { ...(cookie ? { Cookie: cookie } : {}), 'Content-Type': 'application/json' }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) })
  assert.equal(response.status, expected, `${url}: HTTP ${response.status}`)
  const set = response.headers.getSetCookie()
  if (set.length) cookie = set.map(v => v.split(';')[0]).join('; ')
  return response.json()
}
try {
  let online = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + '/api/ai')).ok) { online = true; break } } catch {}
    if (app.exitCode !== null) throw new Error('Fixture Next.js exited before becoming ready.')
    await new Promise(r => setTimeout(r, 250))
  }
  assert.ok(online, 'Fixture app did not become ready')
  await call('/api/ai', { task: 'assistant', message: 'Sapi' }, 401)
  await call('/api/ai/poster', { productName: 'Sapi' }, 401)
  checks.push('AI and poster routes require app authentication')
  const register = async suffix => call('/api/auth/register', { email: `web-${Date.now()}-${suffix}@terkasa.test`, password: 'Fixture-only-2026', name: 'Penguji Gateway', business: 'Peternakan Uji' })
  await register('owner')
  const config = await call('/api/ai')
  assert.equal(config.provider, 'gemini-web'); assert.equal(config.ready, true)
  const caption = await call('/api/ai', { task: 'caption', productName: 'Sapi', style: 'Profesional', platforms: ['Instagram'], image: `data:image/png;base64,${photo.toString('base64')}` })
  assert.equal(caption.captions.Instagram, 'Caption fixture TERKASA')
  checks.push('authenticated caption route uses web mode without a Google API key')
  const transaction = await call('/api/ai', { task: 'transaction', text: 'Jual dua sapi' })
  assert.equal(transaction.qty, 2)
  checks.push('transaction parsing keeps the existing JSON contract')
  const poster = await call('/api/ai/poster', { productName: 'Sapi', posterMode: 'ai', referenceImage: `data:image/png;base64,${photo.toString('base64')}` })
  assert.equal(poster.provider, 'gemini-web'); assert.equal(poster.generatedImage, true); assert.equal(poster.usedOriginalPhoto, true)
  assert.equal((await sharp(Buffer.from(lastImage.reference_image, 'base64')).metadata()).format, 'jpeg')
  const download = await fetch(base + poster.url, { headers: { Cookie: cookie } })
  assert.equal(download.status, 200)
  assert.equal((await sharp(Buffer.from(await download.arrayBuffer())).metadata()).format, 'jpeg')
  assert.equal((await fetch(base + poster.url)).status, 401)
  checks.push('poster references are sent and valid JPEG output stays behind owner authentication')
  const ownerCookie = cookie, before = generated
  cookie = ''; await register('other')
  await call('/api/ai/poster', { productName: 'Sapi', posterMode: 'ai', referenceImage: poster.url }, 403)
  assert.equal(generated, before); cookie = ownerCookie
  checks.push('another account cannot submit the owner private photo as a generation reference')
  ready = false
  const fallback = await call('/api/ai/poster', { productName: 'Sapi', posterMode: 'auto' })
  assert.equal(fallback.provider, 'template'); assert.equal(fallback.generatedImage, false)
  await call('/api/ai/poster', { productName: 'Sapi', posterMode: 'ai' }, 503)
  checks.push('an inactive session produces a labeled template in auto mode and 503 in forced AI mode')
  ready = true; upstreamStatus = 429
  await call('/api/ai', { task: 'assistant', message: 'Sapi' }, 429)
  checks.push('web quota errors remain 429 through the authenticated app endpoint')
  upstreamStatus = 502
  const failed = await call('/api/ai/poster', { productName: 'Sapi', posterMode: 'auto' })
  assert.equal(failed.generatedImage, false); assert.equal(failed.provider, 'template')
  checks.push('failed image generation falls back without falsely claiming AI image success')
  const result = { passed: checks.length, checks, externalGoogleCalls: 0, generatedFixtureRequests: generated, nativeFixtureRequests: nativeCalls }
  await writeFile(path.join(output, 'results.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  app.kill()
  await new Promise(resolve => gateway.close(resolve))
  await writeFile(path.join(output, 'server.log'), logs)
}
