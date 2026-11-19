# Gemini Web → API untuk TERKASA

Pembaruan 19 November 2026: pengguna mengubah pilihan dari API resmi ke gateway Gemini Web. Gateway sudah dibuat di `integrations/gemini-web`, dihubungkan ke akun Google yang cookie-nya diberikan langsung oleh pemilik, dan diuji nyata. Konfigurasi aplikasi lokal kini memakai `GEMINI_BACKEND=web` dan `POSTER_IMAGE_PROVIDER=gemini-web`.

## Pilihan GitHub

| Proyek | Yang disediakan | Keputusan untuk TERKASA |
| --- | --- | --- |
| [HanaokaYuzu/Gemini-API](https://github.com/HanaokaYuzu/Gemini-API) | Library Python Gemini Web: teks, foto, generated images, model dari akun, refresh cookie | Dipakai sebagai inti; gateway HTTP kecil dibuat khusus untuk kontrak TERKASA |
| [Avasz/gemini-web-to-openai-proxy](https://github.com/Avasz/gemini-web-to-openai-proxy) | Proxy self-hosted OpenAI-compatible dan Gemini native, streaming/tool calling/gambar | Referensi alternatif jika butuh kompatibilitas klien lebih luas; tidak dipasang/dijalankan |
| [Lyumnire/gemini-gateway](https://github.com/Lyumnire/gemini-gateway) | Gateway Go dengan UI dan pengelolaan banyak pengguna | Cakupan lebih besar daripada bridge satu akun TERKASA; tidak dipasang/dijalankan |

Penilaian ini berdasarkan README, struktur, metadata publik, serta source inti yang dibaca; bukan audit keamanan menyeluruh ketiga proyek. Source inti untuk riset disalin ke `.verification/upstream-research/gemini-api` pada commit `f14269ab3271f7d481191610195bd8c9ffee02e4`. Dependency runtime dipatok ke distribusi PyPI `gemini-webapi==2.1.1`, bukan otomatis mengikuti branch utama. Lisensi inti tercatat AGPL-3.0; dua alternatif mencantumkan MIT pada saat riset.

## Alur

```text
Browser pengguna → endpoint TERKASA yang sudah diautentikasi
  → konteks usaha pemilik, prompt dan foto referensi
  → gateway Python 127.0.0.1:8008 memakai Bearer API key server
  → sesi Gemini Web pemilik gateway
  → teks JSON atau hasil gambar generatif
  → validasi TERKASA → media JPEG tersimpan untuk pemilik

Jika gambar gagal dan mode Otomatis aktif → template foto lokal berlabel jelas.
Mode Gambar AI mengembalikan error bila layanan gagal; tidak menyamarkan template sebagai AI.
```

Endpoint caption, parser transaksi, asisten, visi, narasi laporan, dan helper balasan WhatsApp menggunakan adapter teks yang sama. Ini tidak memulihkan koneksi gateway WhatsApp atau Instagram. Publikasi Instagram tetap alur terpisah.

## Hasil uji

| Pemeriksaan | Hasil 19 November 2026 |
| --- | --- |
| Login sesi | Diverifikasi langsung oleh library; `ready=true`, sesi tersimpan lokal |
| Model akun | Empat model ditemukan; konfigurasi tetap `auto`, mengikuti akun |
| Caption nyata dengan foto ilustrasi | HTTP 200, JSON `captions.Instagram` valid, sekitar 46 detik |
| Gambar nyata | HTTP 200, JPEG 1024×1024 valid, sekitar 84 detik; teks TERKASA terbaca pada hasil yang diperiksa |
| TERKASA port 3000 | `/api/ai` menunjukkan `provider=gemini-web`, `configured=true`, `ready=true` |
| Python offline | 16 tes lulus: autentikasi, Origin/Host, redaksi cookie/error, foto, JSON, jenis gambar, sesi restart, serialisasi, retry library dinonaktifkan dan kuota 429 |
| Adapter TypeScript offline | 8 pemeriksaan lulus: tanpa cloud key, model akun, Bearer, deadline, status, kuota, format gambar, URL |
| HTTP Next.js dengan gateway fixture | 8 kelompok lulus: caption/transaksi/poster, akses pemilik, isolasi foto, fallback dan 429; data terpisah, tanpa panggilan Google |
| Regresi | 19 tes inventori dan 6 tes integrasi lama lulus; build/typecheck berhasil |

Bukti privat di `.verification/gemini-web/live-results.json`, `caption.txt`, `poster.jpg`, dan `.verification/gemini-web-http/results.json`. Foto uji caption berasal dari aset ilustrasi landing; tidak mengirim database usaha hasil pemulihan ke Gemini. Gambar contoh ini adalah ilustrasi pemasaran, bukan bukti stok ternak nyata.

Tes langsung gateway dan tes kontrak endpoint aplikasi sengaja dibedakan. Tes HTTP aplikasi memakai upstream fixture agar tidak mengulang generasi Google atau memakai akun hasil pemulihan. Tidak ada posting Instagram atau pengiriman WhatsApp dilakukan.

## Mengoperasikan dan melanjutkan pekerjaan

Ikuti [panduan gateway](../integrations/gemini-web/README.md) untuk instalasi, koneksi, endpoint, state privat, dan pengujian. `scripts/configure-gemini-web.mjs` mencadangkan env sebelum mengubah provider. Untuk kembali ke cloud teks, set `GEMINI_BACKEND=cloud` dan sediakan Google API key yang valid; ini tidak mengubah provider poster secara otomatis. Provider Genity lama masih tersedia dengan `POSTER_IMAGE_PROVIDER=genityboost`, tetapi gangguan lama Genity belum dinyatakan pulih.

Status berhasil di atas adalah hasil satu pengujian sesi saat ini, bukan jaminan bebas biaya/kuota, ketersediaan semua model, atau stabilitas API resmi. Cookie dapat kedaluwarsa, akun dapat tidak memiliki fitur gambar, dan perubahan protokol web dapat memerlukan pembaruan library. Gateway tidak melakukan pemilihan banyak akun atau pengelakan pembatasan.

Repositori tujuan source adalah [Nexuszzz/terkasa](https://github.com/Nexuszzz/terkasa), branch `main`. Publikasi source ke GitHub tidak menjalankan deployment gateway/website dan tidak membawa env/cookie lokal. Konfigurasi satu akun gateway tidak sama dengan akun Gemini per usaha; pemisahan sesi Google per tenant dan hosting privat membutuhkan pekerjaan lanjutan jika TERKASA akan dibuka ke banyak pengguna.
