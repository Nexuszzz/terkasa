# Analisis proyek dan pemulihan TERKASA

Tanggal pemeriksaan: 17 November 2026. Sumber kode: https://github.com/Nexuszzz/projekwebumk, branch `main`, commit `dcbd9fd`.

## Keputusan dasar

TERKASA melanjutkan aplikasi UMKMan dengan alur transaksi dan integrasi yang sama, kemudian difokuskan sesuai arahan pengguna pada **manajemen inventori peternakan dan otomatisasi pemasaran digital berbasis AI untuk meningkatkan efisiensi dan daya saing UMKM peternakan**. Pengguna juga meminta fitur jumlah sapi, domba dan jenis ternak lainnya. Nama usaha lama, misalnya NUSACID, tetap menjadi identitas usaha tersebut.

Inventori ternak ditambahkan sebagai tab utama: metadata `livestock` opsional pada produk menyimpan jenis, ras dan kandang. Jumlah tetap menggunakan `Product.stock` sehingga penjualan, stok, dan laporan tidak terpisah menjadi dua sistem. Mode JSON tidak membutuhkan migrasi; PostgreSQL memerlukan kolom `products.livestock` JSONB nullable melalui SQL aditif yang disertakan. Tidak ada perubahan skema pada database produksi yang dijalankan.

Checkout baru berada di `D:\projkwblampung\terkasa`. Folder induknya berisi proyek VERGO/SAP yang berbeda dan tidak dijadikan sumber konfigurasi. Salinan proyek lama tidak diubah. Tidak ada push atau deploy ke layanan produksi dalam pekerjaan ini.

## Hasil pencarian laptop

Pencarian nama proyek mencakup drive D dan profil `C:\Users\NAUFAL`: 171.043 direktori, 25 kecocokan nama, 13 lokasi tidak dapat diakses. Direktori sistem, cache, dependensi, metadata Git, dan riwayat agen dilewati. Hasil ini bukan klaim bahwa setiap file di seluruh disk telah dibaca.

| Lokasi | Temuan | Penggunaan |
| --- | --- | --- |
| `D:\webcv\umkm-an-modal-components` | Checkout `8977df7`, perubahan lokal 8 file; `.env.local` 13 variabel; 3 usaha, 4 akun; 7 file di public/uploads; 2 gambar privat di storage/uploads; APK debug dan dokumen | Sumber pemulihan utama, lebih baru/lengkap daripada salinan D root |
| `D:\umkm-an-modal-components` | Checkout `be6e533`, perubahan lokal 25 file; `.env.local` 8 variabel; 3 usaha, 4 akun; unggahan publik | Cadangan konfigurasi dan patch perubahan lokal |
| `C:\Users\NAUFAL\Downloads\umkm-an-modal-components` | Checkout awal `30f7de2`, modifikasi UI lama, konfigurasi AI saja | Patch cadangan; tidak menimpa kode GitHub terbaru |
| `C:\Users\NAUFAL\Downloads\projekwebumk-main\projekwebumk-main` | Ekstraksi kode lama tanpa data runtime | Referensi historis |
| `D:\umkm-an-modal-components (2).zip` | `.env.local`, 3 usaha dan 4 akun; data identik salinan D root, bertanggal 18 Juli 2026 | Terverifikasi sebagai cadangan lama |
| `D:\umkm-an-modal-components.zip` | Salinan lebih awal dengan konfigurasi AI | Referensi historis |
| ZIP proyek/desain di Downloads | Dua ZIP GitHub; paket landing, dashboard, transaksi, konsistensi data dan modal | Daftar isi diperiksa untuk env/data; tidak ditumpuk ke aplikasi terbaru |
| `D:\umkm-an-modal-components.rar` dan RAR di Downloads | Nama arsip ditemukan | Isi RAR belum diverifikasi |

Data utama sumber webcv memiliki `updatedAt` usaha 19 Juli 2026 10:16:34 UTC dan akun 10:16:45 UTC; cadangan D root bertanggal 18 Juli. Pemilihan tidak hanya berdasarkan waktu modifikasi file. Tidak ada penggabungan otomatis dua database yang bisa menggandakan akun/usaha.

Cadangan `.env`, database, patch lokal dan dokumen ada di `.recovery/` yang diabaikan Git. Manifest lokal mencatat asal file serta SHA-256. Rahasia dan data akun tidak ditampilkan dalam laporan atau disalin ke dokumentasi publik. Keberadaan key tidak membuktikan key masih berlaku.

## Arsitektur dan alur kerja

| Lapisan | Implementasi | Perilaku yang dipertahankan |
| --- | --- | --- |
| Antarmuka | Next.js 16.2.6 App Router, React 19, TypeScript 5.7, Tailwind 4, Framer Motion | Landing, login/daftar, dashboard, konten, transaksi, riwayat, pengaturan, tema terang/gelap |
| HTTP | 28 file route API | Kontrak endpoint dan metode HTTP tetap |
| Autentikasi | bcrypt, JWT HS256 dengan jose, httpOnly cookie, Google OAuth, sessionVersion | Login, logout, ganti sandi, pembatalan sesi, hapus akun |
| Data lokal | `data/business-db.json`, `data/users.json`; antrean tulis dalam satu proses | Akun dan usaha lokal yang dipulihkan dapat dibaca tanpa PostgreSQL |
| Data produksi | Prisma 6, PostgreSQL bila DATABASE_URL tersedia | User → Business → Product/Content/Transaction; FK dan penghapusan berantai |
| Isolasi usaha | ownerUserId di data layer; x-business-id memilih usaha | Satu akun dapat memiliki beberapa usaha; permintaan tidak boleh mengambil usaha akun lain |
| AI teks/visi | Gemini; konteks katalog, profil dan transaksi usaha aktif | Caption lintas platform, parsing transaksi, asisten, narasi laporan |
| AI poster / template | GenityBoost/Genty dan template foto lokal; endpoint `/api/ai/poster` | Poster dari foto/prompt, template transparan saat AI tidak tersedia, penyimpanan hasil ke media |
| Media | Disk lokal, Vercel Blob bila tersedia; fallback /tmp di serverless | Upload, gambar produk, poster; pembacaan unggahan lama |
| Keuangan | Perhitungan deterministik dan ekspor jsPDF | Omzet, estimasi modal/HPP, laba, periode laporan, narasi AI opsional |
| WhatsApp | GOWA per device/usaha, webhook HMAC, konteks Gemini | Pairing QR/kode, status, putus koneksi, balasan sesuai usaha |
| Instagram | Graph API per usaha/fallback env; opsi private gateway; unduh/salin manual | Login/koneksi, simpan draft, publikasi; semua mode tetap ada |
| Android | Capacitor 8, remote WebView ke server Next.js | Shell aplikasi, bukan backend Android terpisah; perlu koneksi internet |

Alur utama: daftar/login → buat/pilih usaha → isi katalog dan stok → buat caption/poster atau catat transaksi → verifikasi transaksi → stok/statistik/laporan diperbarui → simpan/publikasikan konten atau unduh PDF. Publikasi Tokopedia/Lazada bukan integrasi marketplace otomatis: caption dan status lokal tidak berarti sudah dipublikasikan.

## Konfigurasi yang ditemukan

Sumber webcv menyediakan GEMINI_API_KEY, GEMINI_MODEL, AUTH_SECRET, NEXT_PUBLIC_APP_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GENTY_API_KEY, GENTY_BASE_URL, GOWA_BASE_URL, GOWA_BASIC_AUTH, GOWA_WEBHOOK_SECRET, NEXT_PUBLIC_SUPPORT_WA, AIOGRAPI_BASE_URL. Nilai tidak dicantumkan.

DATABASE_URL, BLOB_READ_WRITE_TOKEN/BLOB_STORE_ID, dan fallback token Instagram global tidak ditemukan dalam `.env.local` sumber. Aplikasi lokal memakai JSON dan disk. Token Instagram atau device WhatsApp bisa berada dalam profil usaha; data tersebut diperlakukan sebagai privat. Metadata `.vercel` lama bukan otorisasi untuk mengubah deployment lama dan tidak dipasang ke checkout baru.

URL aplikasi lokal dipisahkan dari URL deployment lama agar OAuth tidak mengembalikan pengguna ke platform lama. Google Console tetap perlu mengizinkan callback URL lokal/produksi yang benar. Konfigurasi gateway dipulihkan apa adanya; ketersediaan gateway tidak diasumsikan.

## Cakupan rebranding

- Teks landing, navbar, login, dashboard, pengaturan dan support menjadi TERKASA.
- Metadata browser, favicon/ikon, nama aplikasi Android dan fallback shell memakai TERKASA.
- Identitas platform pada profil usaha lama dinormalisasi saat dibaca untuk konteks AI; brand produk/usaha tidak diubah.
- Teks PDF, prompt support/laporan, serta nama unduhan baru memakai TERKASA.
- Android dan halaman fallback memakai URL konfigurasi yang sama; tidak menebak domain TERKASA yang belum dimiliki.
- Cookie `umkman_*`, package Android `id.umkman.app`, nama volume/database, ID akun/usaha dan credential gateway tetap untuk kompatibilitas. Ini identifier teknis, bukan nama yang ditampilkan.
- Dokumen deployment historis tetap menyebut sumber UMKMan dan infrastrukturnya; README baru menjadi panduan TERKASA.

## Temuan yang perlu diperhatikan

1. **Persistensi produksi:** tanpa PostgreSQL dan Blob, /tmp serverless dapat hilang saat cold start. File JSON hanya sesuai satu proses lokal; antrean tulis bukan kunci lintas instance.
2. **Sesi:** JWT bertahan 14 hari; sessionVersion diperiksa di handler. Implementasi lama memiliki fallback rehidrasi user/JWT di serverless; ini perlu audit khusus sebelum produksi publik.
3. **Pemilihan usaha lokal:** activeBusinessId global disaring dengan ownerUserId, tetapi pemilihan aktif antarpengguna pada backend file belum setara penyimpanan aktif per user di PostgreSQL. Kode lama menerima businessId asing/basi dengan fallback ke usaha milik sendiri; data akun lain tetap tidak dibuka, tetapi permintaan salah ID bisa memengaruhi usaha sendiri. Alur perubahan jumlah ternak yang baru menolak ID usaha yang tidak cocok.
4. **Rahasia bawaan:** compose/example berisi credential demo gateway/database. Jangan menggunakannya pada instalasi publik. Cadangan ZIP lama juga berisi `.env.local`; arsip perlu diperlakukan sebagai file rahasia.
5. **Seed akun:** repo menyertakan seed user/profil. Identitas seed dan hash password di seed harus ditinjau sebelum produksi, terpisah dari pemulihan akun lokal.
6. **Gateway Instagram private:** alur lama menggunakan gateway tidak resmi dan dapat memicu challenge akun. Peringatan yang sudah ada di UI dipertahankan; Graph API tetap tersedia.
7. **Biaya/ketersediaan:** uji pemulihan membuktikan Gemini teks berhasil pada model pengganti. Genity masih 522 dan percobaan Gemini gambar terkena 429; billing/kuota gambar belum pulih. Template foto asli tersedia secara lokal. Tidak ada pesan WhatsApp atau publikasi Instagram; hasil terbaru ada di `VERIFIKASI.md`.
8. **Tooling:** script lint awal memanggil ESLint yang tidak dideklarasikan; typecheck dan production build menjadi pemeriksaan utama. Middleware dimigrasikan ke konvensi `proxy.ts` sesuai panduan Next 16 yang terpasang, tanpa mengganti matcher atau aturan autentikasinya. Root Turbopack/tracing ditetapkan ke checkout ini; file privat pemulihan/env dikecualikan dari tracing.
9. **Patch lokal:** webcv berisi penanganan error kuota Gemini, penghapusan peringatan private IG, metadata kompetisi, dan script APK. Salinan D root berisi modifikasi UI/OAuth. Semua dicadangkan; tidak ditumpuk otomatis karena scope rebranding harus mempertahankan perilaku sumber GitHub terbaru.

## Verifikasi

Baseline sebelum perubahan: `npm ci` dan `npx tsc --noEmit` berhasil. Hasil build dan pengujian perilaku sesudah rebranding dicatat di `docs/VERIFIKASI.md`.
