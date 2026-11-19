# TERKASA Gemini Web gateway

Gateway lokal FastAPI menggunakan [HanaokaYuzu/Gemini-API](https://github.com/HanaokaYuzu/Gemini-API), package `gemini-webapi==2.1.1`. Ini integrasi sesi Gemini Web, bukan Google API resmi. Model, fitur gambar, dan kuota mengikuti akun yang dihubungkan. Perubahan situs Google atau kedaluwarsa cookie dapat memutus sambungan.

## Menjalankan di Windows

Butuh Python 3.11+ dan akses Gemini Web dengan akun milik sendiri.

```powershell
cd D:\projkwblampung\terkasa\integrations\gemini-web
.\start.ps1
```

Script membuat `.venv`, memasang versi dependency yang dipatok, lalu menjalankan server pada **127.0.0.1:8008**. Jalankan gateway satu proses; state dan penguncian permintaan berada pada satu proses. Hentikan dengan Ctrl+C di terminal pemiliknya.

Setelah gateway pertama kali menyala, buka terminal lain:

```powershell
cd D:\projkwblampung\terkasa
node scripts/configure-gemini-web.mjs
```

Script menyalin API key lokal ke `.env.local`, memilih backend `web` serta provider gambar `gemini-web`, dan mencadangkan env lama ke `.recovery`. Tidak menampilkan nilai rahasia. Restart Next.js jika proses yang sedang berjalan belum membaca env baru.

## Menghubungkan akun

Buka [setup lokal](http://127.0.0.1:8008/setup). Masuk ke Gemini sendiri di browser, lalu ikuti petunjuk dua cookie pada halaman itu. Masukkan nilainya hanya di formulir lokal. Cookie tidak diambil otomatis dari profil browser. Gateway memeriksa sesi sebelum menyimpannya; sesi anonim tidak dianggap berhasil.

Jika pemilik akun secara eksplisit menyediakan file ekspor cookie Google, impor file tersebut dari terminal, tanpa menempelkan isinya ke chat:

```powershell
node scripts/import-gemini-web-session.mjs 'C:\path\ekspor-yang-Anda-pilih.json'
```

Importir hanya mengambil dua cookie pada domain Google yang diizinkan. File ekspor asli tetap di lokasi pemiliknya. `.state/session.json`, `.state/api-key`, dan cache refresh adalah data privat lokal, diabaikan Git. `start.ps1` membatasi ACL folder state ke pemilik Windows, SYSTEM, dan Administrators. Jangan membagikan folder `.state`, `.venv`, atau file ekspor. Pada restart, gateway mencoba memuat sesi tersimpan; sesi basi memerlukan penghubungan ulang.

## Kontrak endpoint

| Endpoint | Fungsi |
| --- | --- |
| `GET /healthz` | Proses hidup; bukan bukti sesi Google valid |
| `GET /setup` | Formulir koneksi pada laptop |
| `GET /setup/status` | Indikator sesi untuk halaman setup; hanya loopback, tanpa data cookie |
| `POST /setup/session` | Verifikasi/simpan sesi; hanya loopback dan Origin yang sama |
| `GET /v1/status` | Status sesi; Bearer API key wajib |
| `GET /v1/models` | Daftar model yang ditemukan pada akun; Bearer wajib |
| `POST /v1beta/models/{model}:generateContent` | Adapter teks/visi berformat Gemini native; Bearer wajib |
| `POST /v1/images/generations` | Gambar generatif berformat base64; Bearer wajib |

Gunakan `Authorization: Bearer <GEMINI_WEB_API_KEY>` dari server. Key tidak dimasukkan ke URL/frontend. `model=auto` mengikuti model default akun; gunakan ID hasil `/v1/models` untuk pilihan eksplisit. Endpoint teks menyertakan instruksi sistem, konteks percakapan, maksimal tiga foto raster, serta instruksi/schema JSON bila diminta. JSON schema merupakan instruksi prompt, bukan jaminan constrained decoding; TERKASA tetap memvalidasi hasil.

Endpoint gambar menerima `prompt`, `model`, `aspect_ratio`, `reference_image` base64 opsional, `n=1`, dan `response_format=b64_json`. Hanya objek `GeneratedImage` dari library yang diterima. Gambar hasil pencarian ditolak, bukan diberi label hasil generatif. Referensi JPEG/PNG/WebP maksimal 8 MB per gambar; output maksimal 20 MB dan harus terverifikasi sebagai raster. Referensi sementara dihapus setelah permintaan selesai.

Satu generasi diproses pada satu waktu; permintaan lain menerima 429. Tidak ada retry generasi otomatis, rotasi akun, atau pengelakan kuota. Timeout generasi 150 detik. HTTP 401/503 berkaitan dengan konfigurasi/sesi; 502 kegagalan upstream/hasil; 504 timeout. Pesan error generik menyembunyikan input cookie dan detail upstream.

## Pengujian offline

```powershell
cd D:\projkwblampung\terkasa\integrations\gemini-web
.venv\Scripts\python.exe -m unittest test_gateway -v
cd ..\..
npm run test:gemini-web
# Sesudah npm run build; memakai port 8009/3017 dan data fixture, lalu berhenti:
npm run test:gemini-web:http
```

Tes tidak menghubungi Google dan tidak membaca akun/data usaha hasil pemulihan. Uji nyata Google terpisah dan dicatat di `docs/GEMINI-WEB-GATEWAY.md`.

## Batas pemakaian dan deployment

Setup ini satu akun milik pemilik TERKASA pada laptop lokal. Tidak menyediakan streaming chat OpenAI, tool calling, pool akun, atau admin publik. Ini sengaja berupa adapter kebutuhan TERKASA, bukan implementasi lengkap seluruh API OpenAI/Google. Cookie akun tidak otomatis terkait per pengguna/usaha TERKASA; setiap permintaan AI menggunakan akun gateway yang sama, dengan konteks usaha dari server TERKASA.

Saat Next.js dipindahkan ke hosting, `127.0.0.1` berarti mesin hosting itu, bukan laptop. Gateway perlu dijalankan pada mesin yang dapat dijangkau backend melalui koneksi privat yang sesuai. Konfigurasi sekarang hanya mendengarkan loopback dan tidak dipublikasikan ke internet. Folder gateway/state dikecualikan dari tracing deployment Next.js.

Dependency `gemini-webapi` menggunakan lisensi **AGPL-3.0** menurut [repositori upstream](https://github.com/HanaokaYuzu/Gemini-API/blob/master/LICENSE). Sumber library tidak disalin ke source TERKASA; package dipasang di virtual environment. Pertahankan atribusi dan berkas lisensi dependency saat mendistribusikan paket yang menyertakannya.
