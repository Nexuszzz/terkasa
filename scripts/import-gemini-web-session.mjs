// Explicitly supplied cookie export only. Never reads browser profiles or prints cookies.
import { readFile } from 'node:fs/promises'

const file = process.argv[2]
if (!file) throw new Error('Berikan path file ekspor cookie Google yang Anda pilih sendiri.')
const data = JSON.parse(await readFile(file, 'utf8'))
const rows = Array.isArray(data) ? data : data.cookies
if (!Array.isArray(rows)) throw new Error('Format ekspor harus berupa array cookie atau objek cookies.')
const find = name => rows.find(c => c.name === name && typeof c.value === 'string' && c.value && ['.google.com', 'google.com', 'gemini.google.com', '.gemini.google.com'].includes(c.domain))?.value
const sid = find('__Secure-1PSID'), sidts = find('__Secure-1PSIDTS')
if (!sid || !sidts) throw new Error('Dua cookie sesi Google yang diperlukan tidak ditemukan pada domain Google.')
const response = await fetch('http://127.0.0.1:8008/setup/session', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:8008' },
  body: JSON.stringify({ secure_1psid: sid, secure_1psidts: sidts }), signal: AbortSignal.timeout(45_000),
})
const result = await response.json().catch(() => ({}))
console.log(JSON.stringify({ status: response.status, ready: result.ready === true, message: typeof result.message === 'string' ? result.message : 'Sesi belum diverifikasi. Periksa halaman setup.' }))
if (!response.ok) process.exitCode = 1
