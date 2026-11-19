# TERKASA

**Inovasi Platform Manajemen Inventori Peternakan dan Otomatisasi Pemasaran Digital Berbasis Artificial Intelligence untuk Meningkatkan Efisiensi dan Daya Saing UMKM Peternakan.**

Repositori TERKASA: [Nexuszzz/terkasa](https://github.com/Nexuszzz/terkasa), branch `main`. Source dan contoh konfigurasi tersedia di Git; env, akun/usaha lokal, cookie gateway, serta media privat harus disiapkan terpisah pada mesin yang menjalankan aplikasi.

Direbranding dari [Nexuszzz/projekwebumk](https://github.com/Nexuszzz/projekwebumk). Alur sumber tetap: multiusaha, katalog/stok, transaksi, konten AI, laporan PDF, WhatsApp, Instagram, serta shell Android Capacitor. TERKASA menambahkan inventori ternak sebagai bagian dari katalog yang sama.

**Pembaruan AI 19 November 2026:** backend lokal beralih ke gateway Gemini Web sesuai pilihan pengguna. Sesi akun sudah terverifikasi; uji nyata caption dengan foto dan satu poster generatif berhasil. Setup, arsitektur, sumber GitHub, dan batas pengujian ada di [panduan Gemini Web](docs/GEMINI-WEB-GATEWAY.md). Ini tidak mengubah status koneksi Instagram/WhatsApp.

**Pembaruan WhatsApp:** error pairing `Client outdated (405)` ditangani dengan memperbarui GOWA ke `v9.10.0`. QR PNG berhasil dibuat melalui adapter TERKASA. Pemilik tetap perlu menautkan nomor dari HP; login WhatsApp belum dinyatakan berhasil. Instagram gateway `6.0.0` online pada pemeriksaan terakhir, tetapi sesi lama memerlukan login ulang melalui formulir aplikasi.

## Inventori ternak

- Pilih sapi, domba, kambing, ayam, bebek, kerbau, atau lainnya.
- Catat nama kelompok, ras, kandang, jumlah awal dalam ekor, harga per ekor, dan ambang stok rendah.
- Tambah atau kurangi jumlah dengan pratinjau stok sesudah perubahan. Server menolak pengurangan melebihi stok dan jumlah pecahan.
- Cari nama/ras/kandang, filter jenis, serta lihat total ternak, komposisi, kelompok stok rendah dan estimasi nilai jual.
- Penjualan melalui Transaksi mengurangi stok yang sama dan masuk laporan omzet. Koreksi jumlah di inventori tidak dianggap penjualan.
- Data tersimpan per usaha. Produk lama tetap tersedia di katalog; tidak otomatis dianggap ternak.

Pada PostgreSQL yang sudah ada, jalankan SQL aditif [terkasa-livestock.sql](prisma/terkasa-livestock.sql) untuk menambahkan kolom metadata ternak. Untuk database development baru, gunakan `npm run db:push`. Mode JSON lokal tidak membutuhkan migrasi. Database produksi belum dimigrasikan oleh pekerjaan ini.

## Menjalankan lokal

Butuh Node.js 22 atau lebih baru. Jalankan dari direktori ini:

```powershell
npm ci
# Hanya jika .env.local belum ada:
Copy-Item .env.example .env.local
# Isi credential server dalam .env.local, kemudian:
npm run dev
```

Buka http://localhost:3000. Pada checkout hasil pemulihan, `.env.local`, database JSON dan media lokal sudah disalin dari proyek lama. Jangan menimpa `.env.local` tersebut dengan contoh kosong.

Tanpa `DATABASE_URL`, aplikasi memakai `data/business-db.json` dan `data/users.json`. Tanpa token Blob, unggahan baru masuk `storage/uploads`. Data pemulihan, akun dan rahasia diabaikan Git. Salinan asli beserta patch perubahan lokal tersedia di `.recovery/`; manifest-nya mencatat asal dan checksum.

## Fitur dan layanan

| Fitur | Kebutuhan |
| --- | --- |
| Akun email/password, usaha, katalog, stok, transaksi, laporan/PDF | AUTH_SECRET; penyimpanan JSON lokal atau PostgreSQL |
| Login Google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET; callback yang diizinkan: `<NEXT_PUBLIC_APP_URL>/api/auth/google/callback` |
| Caption, parsing transaksi, asisten AI, visi dan narasi AI | `GEMINI_BACKEND=web`: GEMINI_WEB_BASE_URL, GEMINI_WEB_API_KEY, GEMINI_WEB_MODEL; `cloud`: GEMINI_API_KEY, GEMINI_MODEL |
| Poster AI | `POSTER_IMAGE_PROVIDER=gemini-web`: gateway lokal; `genityboost`: GENTY_API_KEY dan GENTY_BASE_URL |
| Poster template foto asli | Berjalan lokal tanpa API gambar; `POSTER_TEMPLATE_FALLBACK=true` untuk fallback otomatis |
| WhatsApp toko | GOWA_BASE_URL, GOWA_BASIC_AUTH, GOWA_WEBHOOK_SECRET; hubungkan device per usaha |
| Instagram | Token Graph API per usaha, atau gateway AIOGRAPI_BASE_URL; mode salin/unduh tetap tersedia |
| Database/media produksi | DATABASE_URL dan BLOB_READ_WRITE_TOKEN atau BLOB_STORE_ID |

Variabel privat tetap di server. Hanya URL aplikasi dan nomor support yang menggunakan `NEXT_PUBLIC_*`. Key yang ditemukan dalam cadangan belum tentu masih aktif. Tidak ada pesan atau publikasi ke akun eksternal selama pengujian.

Pemulihan layanan pada 17 November 2026: caption dan parsing transaksi berhasil memakai `gemini-3.5-flash-lite`. Model lama mengembalikan 503. Genity mengembalikan 522 dan percobaan Gemini gambar mengembalikan 429; generasi gambar AI belum pulih. Generator menyediakan pilihan **Otomatis**, **Gambar AI**, dan **Template foto**. Template menata foto asli dalam layout TERKASA dan diberi label bahwa hasilnya bukan gambar generatif AI. Tanpa foto, hasil ditandai belum memiliki foto ternak. Unggahan besar dikompresi dan disimpan sebelum dipakai sebagai referensi.

Gateway Instagram lokal telah hidup kembali, tetapi sesi akun lama kedaluwarsa. Masuk dengan akun aplikasi lama, pilih usaha yang sesuai, lalu **Pengaturan → Instagram** dan login ulang akun Instagram yang sama melalui formulir. Isi password/2FA langsung di aplikasi, jangan di chat atau dokumentasi. Tombol Refresh memeriksa sesi ke gateway; koneksi berhasil bila muncul **“Sesi Instagram berhasil diverifikasi.”** Kehadiran sesi tersimpan atau gateway online saja tidak dianggap terhubung. Kredensial Graph API resmi belum ditemukan; opsi private API tetap mengikuti keterbatasan demo yang ditampilkan aplikasi.

Gateway WhatsApp juga online, tetapi device lama belum login. Hubungkan kembali melalui **Pengaturan → WhatsApp** dengan QR atau kode pairing dari ponsel pemilik nomor.

Untuk stack Docker lokal, lihat [GOWA](docs/GOWA.md) dan [PostgreSQL](docs/POSTGRES.md). Nama database, volume dan credential lama dipertahankan agar layanan lama tetap kompatibel; ubah credential demo sebelum produksi. Dokumentasi deployment lama di `docs/` adalah referensi historis dan memerlukan penyesuaian URL TERKASA yang benar-benar dimiliki.

## Pemeriksaan

```powershell
npm run typecheck
npm run test:inventory
npm run test:integrations
npm run build
npm start
```

Lihat [analisis dan inventaris pemulihan](docs/ANALISIS-REBRANDING.md) serta [hasil verifikasi](docs/VERIFIKASI.md).

Landing page baru, susunan konten, demo interaktif, dan organisasi visual dijelaskan di [panduan landing page](docs/LANDING-PAGE.md). Sumber PNG, prompt imagegen, dan WebP web dipisahkan di `assets/landing/` serta `public/assets/landing/`.

## Android

```powershell
# .env.local: CAPACITOR_SERVER_URL=http://10.0.2.2:3000 untuk emulator Android
# Perangkat fisik: URL IP LAN laptop; rilis: URL HTTPS server Anda.
npm run cap:sync
npm run cap:android
```

Nama aplikasi adalah TERKASA. ID paket `id.umkman.app` dipertahankan agar kompatibel dengan instalasi dan konfigurasi lama. Script persiapan menyamakan URL fallback dengan target WebView; tidak ada redirect ke deployment UMKMan lama. Shell membutuhkan server Next.js yang aktif dan bukan aplikasi offline.

Tidak ada domain produksi TERKASA yang diasumsikan. Set `NEXT_PUBLIC_APP_URL` dan `CAPACITOR_SERVER_URL` ke deployment yang benar ketika melakukan rilis, lalu sesuaikan callback Google serta webhook GOWA. Rebranding lokal tidak mengubah aplikasi yang sedang online.
