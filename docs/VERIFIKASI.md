# Verifikasi TERKASA

## Pemeriksaan sebelum publikasi source — 20 November 2026

Target repositori adalah `Nexuszzz/terkasa`, branch `main`; sumber lama dipertahankan sebagai remote `upstream`. Build produksi berhasil, termasuk pemeriksaan TypeScript. Pengujian ulang meloloskan 19 pemeriksaan inventori, 6 integrasi, 8 adapter Gemini Web, serta 16 tes Python gateway. Tes ini memakai fixture dan tidak mengirim pesan/publikasi atau membuat generasi AI baru. Peringatan tracing media dinamis, deprecation Prisma, dan transport TestClient Python yang sudah dicatat tetap ada.

Pemeriksaan 245 file source dan riwayat Git terhadap 8 nilai privat yang dikonfigurasi serta pola credential tidak menemukan rahasia. Dua nilai contoh GOWA yang sudah publik pada sumber lama dibedakan dari credential privat. File env, database runtime, folder recovery/verifikasi, cookie/state dan virtual environment gateway dikecualikan dari source. Bukti lokal privat: `.verification/prepush-audit.json`. GitHub menyimpan source; database/sesi laptop dan deployment tidak dipindahkan oleh push.

## Pembaruan GOWA dan pemeriksaan Instagram terakhir — 19 November 2026

Log GOWA lama menunjukkan `Client outdated (405)` saat pairing. Sesudah backup privat container/volume dan pembaruan ke image resmi `v9.10.0`, adapter `loginWithQr` TERKASA berhasil memperoleh PNG 512×512 dalam sekitar satu detik. Volume lama tetap digunakan; kedua device belum login pada pemeriksaan terakhir. Bukti privat: `.verification/gowa-restart/pairing-test.json`. Tidak ada pesan dikirim.

Gateway Instagram `6.0.0` merespons OpenAPI HTTP 200; pemeriksaan sesi lama mengembalikan `login_required`/`session_expired`. Pemilik diminta login ulang akun lama di Pengaturan → Instagram → Demo Private API. Belum ada bukti login ulang sukses atau publikasi. Bukti tanpa nilai sesi: `.verification/instagram-recovery/status.json`.

## GOWA dihidupkan kembali — 19 November 2026, 22.54 WIB

Atas permintaan pengguna, Docker Desktop/engine dinyalakan kembali. Container `umkman-gowa` kembali running dengan volume sesi lama `umkm-an-modal-components_umkman_gowa`; tidak dibuat ulang dan tidak dihapus. Health serta daftar device GOWA mengembalikan HTTP 200. Dua device tersimpan diperiksa melalui endpoint status: keduanya `connected=false`, `loggedIn=false`, sehingga pemilik perlu menghubungkan nomor melalui QR atau kode pairing pada Pengaturan → WhatsApp. Endpoint webhook TERKASA juga HTTP 200; ini hanya bukti endpoint hidup, bukan pengujian pesan masuk/balas. Tidak ada pesan dikirim. Bukti tanpa nomor/cookie/credential: `.verification/gowa-restart/status.json`.

## Gateway Gemini Web — pengujian paling baru, 19 November 2026

Pilihan aktif berganti ke Gemini Web atas permintaan pengguna. Sesi milik pemilik gateway berhasil diverifikasi dari file ekspor yang diberikan secara eksplisit; nilai cookie tidak ditampilkan. Uji nyata caption dengan foto menghasilkan JSON valid HTTP 200 (~46 detik). Satu poster generatif menghasilkan JPEG 1024×1024 HTTP 200 (~84 detik), sudah diperiksa visual. TERKASA :3000 mengembalikan `provider=gemini-web`, `configured=true`, `ready=true`.

16 tes Python gateway, 8 pemeriksaan adapter TypeScript, dan 8 kelompok kontrak HTTP Next.js dengan gateway fixture lulus. Kontrak HTTP memeriksa caption/transaksi, private JPEG untuk pemilik, penolakan referensi foto akun lain, fallback berlabel, forced AI 503, dan kuota 429. Fixture memakai data terpisah; server QA port 3017/8009 dihentikan sesudah tes. Gateway fungsional port 8008 tetap aktif untuk pengguna.

19 tes inventori, 6 tes integrasi lama, typecheck dan build produksi lulus. Peringatan tracing media dinamis/Prisma yang sudah tercatat masih ada. Dependency TestClient Python juga mengeluarkan peringatan deprecation transport httpx; 16 tes tetap lulus.

Sesi tersimpan berhasil dimuat kembali setelah restart, dan smoke test teks sesudah pembatasan retry library menghasilkan HTTP 200. Folder `.state` memiliki ACL privat untuk pemilik Windows, SYSTEM, dan Administrators. Audit 9 nilai credential/cookie terhadap 245 file source dan 29 file frontend tidak menemukan credential privat baru; 34 trace tidak menyertakan env, folder verifikasi/pemulihan, atau gateway/state. Lima file source lama berisi nilai demo GOWA yang memang sudah ada di HEAD sumber; audit mencatatnya terpisah, bukan mengklaim seluruh konfigurasi lama bersifat privat. Database usaha tetap byte-identik dengan salinan pemulihan; seluruh record pengguna identik, sedangkan metadata root `version`/`updatedAt` pada users.json telah berubah. Tidak ada record pengguna dipulihkan ulang atau ditimpa.

Bukti: `.verification/gemini-web/live-results.json`, `caption.txt`, `poster.jpg`, dan `.verification/gemini-web-http/results.json`. Panduan aktif: [Gemini Web gateway](GEMINI-WEB-GATEWAY.md). Hasil lama tentang kegagalan Genity/API cloud di bawah tetap riwayat; gateway baru tidak memulihkan Genity, Instagram atau WhatsApp. Tidak ada posting/pesan sosial dikirim.

## Pemeriksaan ulang layanan — 19 November 2026

Pemeriksaan status setelah pembaruan landing: server TERKASA pada port 3000
mengembalikan HTTP 200. Satu permintaan teks ke model konfigurasi
`gemini-3.5-flash-lite` menerima 503 UNAVAILABLE tanpa teks; hasil sukses
17 November di bawah merupakan bukti historis, bukan jaminan koneksi saat ini.
Origin Genity timeout, sementara gateway lokal Instagram port 8000 dan GOWA
port 3100 tidak dapat dihubungi. Tidak ada permintaan generasi gambar maupun
posting/pesan sosial pada pemeriksaan ini. Google OAuth belum diuji sampai
login akhir; PostgreSQL, Blob, dan fallback credential Graph API pada env
belum dikonfigurasi. Poster template lokal tetap tidak bergantung API gambar;
tidak dijalankan ulang pada cek status ini. Bukti privat:
`.verification/api-status-20261119.json`.

Tanggal: 17 November 2026. Kode dasar: `dcbd9fd`, branch pekerjaan: `rebrand/terkasa`.

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| Instalasi `npm ci` | Berhasil, Prisma Client terbuat |
| `npm run typecheck` | Berhasil |
| `npm run build` | Berhasil dengan Next.js 16.2.6, 28 route API dan 3 halaman aplikasi |
| `npm run test:inventory` | 19 pemeriksaan domain berhasil, data fixture terpisah |
| HTTP terhadap production server lokal | 7 kelompok pemeriksaan berhasil, akun dan usaha demo terpisah |
| Browser | 9 pemeriksaan berhasil, termasuk formulir dan perubahan jumlah tersimpan |
| Android `npm run cap:sync` | Berhasil; 5 plugin terhubung; nama aplikasi TERKASA dan URL fallback sama dengan WebView |
| Ikon | Favicon, ikon Apple, launcher/adaptive icon Android dan splash memakai monogram T |
| Pemeriksaan rahasia | 6 nilai credential privat diperiksa: tidak ditemukan dalam JavaScript/CSS frontend atau diff Git |
| Tracing deployment | `.recovery`, `.verification` dan `.env` tidak ditemukan dalam daftar file trace privat yang diperiksa |
| Pemulihan | SHA-256 database akun/usaha hasil pemulihan tetap sama dengan manifest sumber |

## Pengujian inventori dan regresi

Pengujian domain mencakup registrasi/login, isolasi daftar usaha, normalisasi identitas platform lama, katalog nonternak, stok penjualan, transaksi menunggu verifikasi, verifikasi berulang, pembatalan dan pengembalian stok, stok tidak cukup, perhitungan laporan, serta pembatalan JWT setelah ganti password.

Inventori diuji dengan 12 sapi, 18 domba dan 35 kambing: total 65 ekor dan estimasi nilai jual Rp468.000.000 berdasarkan harga fixture. Jenis, ras dan kandang disimpan; jumlah dapat ditambah/dikurangi. Delapan penambahan bersamaan di data layer dan empat permintaan HTTP bersamaan tidak kehilangan perubahan. Server menolak stok negatif, jumlah pecahan, perubahan stok usaha asing, dan harga ternak negatif. Transaksi sapi memakai stok dan omzet yang sama dengan inventori. Prompt AI menerima konteks jenis/kandang serta jumlah dalam ekor.

Perilaku lama saat menerima businessId asing/basi pada beberapa endpoint tetap memiliki fallback ke usaha sendiri; pengujian membuktikan data usaha akun lain tidak berubah. Jalur perubahan jumlah yang baru menolak businessId yang tidak cocok. Temuan ini dijelaskan dalam analisis, bukan disamakan dengan penolakan ketat semua endpoint lama.

## Pengujian browser

Akun `Peternakan Makmur (Demo)` berada dalam fixture `.verification/browser-data`, terpisah dari akun hasil pemulihan.

1. Login email/password membuka tab Inventori.
2. Form Tambah ternak membuat Domba Garut dengan 18 ekor, ras Garut, Kandang B dan harga Rp3.500.000.
3. Tombol +5 menambah Sapi Limousin dari 12 menjadi 17 ekor.
4. Reload mempertahankan 17 ekor; data dibaca kembali dari server.
5. Memasukkan pengurangan 999 ekor menonaktifkan tombol simpan.
6. Pengurangan 5 ekor mengembalikan sapi ke 12; total kembali 65.
7. Filter Domba menampilkan satu kartu yang sesuai.
8. Edit kandang menjadi B-02 tersimpan dan pencarian B-02 menampilkan domba tersebut.
9. Tidak ditemukan overflow horizontal pada viewport terukur 391 dan 1442 piksel. Form mobile dapat dioperasikan; teks TERKASA tampil tanpa nama platform lama pada dashboard.

Bukti lokal: `.verification/results.json`, `.verification/http-results.json`, `.verification/browser-results.json`, `.verification/terkasa-mobile-form.jpg`, dan `.verification/terkasa-inventory.jpg`. Seluruhnya diabaikan Git.

## Batas verifikasi

- Pada pengujian inventori awal, narasi Gemini mengembalikan 503 dan laporan memakai fallback. Skrip uji HTTP inventori kemudian memakai `ai=0`. Hasil pengujian dan pemulihan layanan berikutnya dicatat di bawah; ketersediaan layanan eksternal tetap bisa berubah.
- Tidak ada pengiriman WhatsApp, publikasi Instagram, atau penyelesaian login Google ke akun eksternal. Callback Google memerlukan konfigurasi Console yang sesuai dengan URL aplikasi.
- PostgreSQL belum diuji dengan server database sungguhan. Prisma Client dan kode PostgreSQL lolos build/typecheck. Kolom `products.livestock` harus ditambahkan menggunakan SQL aditif yang disertakan sebelum memakai database lama.
- Shell Android disinkronkan dan aset direbranding; APK TERKASA baru serta pengujian emulator/perangkat fisik belum dilakukan. APK lama hanya disimpan sebagai cadangan.
- Build masih mengeluarkan peringatan tracing dari akses media dinamis dan deprecation konfigurasi Prisma 6 dalam package.json. Build berhasil; folder pemulihan dan env dikecualikan dari tracing. Migrasi mayor Prisma bukan bagian dari pekerjaan ini.
- Akses Google Fonts sempat gagal. Font asli Inter, Space Grotesk dan JetBrains Mono dipulihkan dari build lokal, disertakan dengan lisensinya, dan sekarang dibundel melalui `next/font/local`.
- Tidak ada push GitHub, deployment, perubahan domain, atau migrasi database produksi yang dijalankan.

## Pemulihan integrasi setelah permintaan “uji dan pulihkan”

Pengujian ini memakai akun dan data buatan di `.verification/recovery-live/data`, bukan akun hasil pemulihan. Server fixture dibatasi ke loopback port 3017 dan dihentikan setelah QA. Server aplikasi dengan data asli disiapkan di loopback port 3000 untuk login ulang pengguna.

| Layanan/perilaku | Bukti dan hasil |
| --- | --- |
| Gemini key/model | Daftar model HTTP 200; model `gemini-3.5-flash` mengembalikan 503. Model `gemini-3.5-flash-lite` berhasil HTTP 200 dan dipasang sebagai konfigurasi/default teks. Env sebelum perubahan dicadangkan privat. |
| Caption dan transaksi | Dua permintaan nyata melalui endpoint aplikasi terautentikasi berhasil: caption Instagram dan parsing penjualan menjadi 2 ekor sapi. Tidak ada transaksi nyata dicatat. |
| Penanganan kegagalan Gemini | Enam pemeriksaan integrasi offline lolos, termasuk satu retry kegagalan sementara dan tanpa retry untuk 403/429. API key dikirim pada header, tidak pada URL. |
| GenityBoost | Satu percobaan generate menerima HTTP 522, tidak menghasilkan job yang diketahui. Tidak diulang setelah kegagalan ini. Generasi gambar AI belum pulih. |
| Alternatif Gemini gambar | Satu percobaan menerima 429 RESOURCE_EXHAUSTED. Tidak ada gambar dihasilkan; kuota tidak diulang terus-menerus. |
| Template otomatis | PNG dari foto raster asli berhasil dibuat, diunduh pemilik dan ditolak untuk pengguna anonim (401). Unggahan melebihi 200 KB dipertahankan. Fallback otomatis saat Genity tidak tersedia menyertakan label template. |
| Browser | Poster template tanpa foto berhasil, pesan foto belum ditambahkan terlihat, dan 3 draft untuk platform yang dipilih tersimpan di Konten. Placeholder katalog sebelumnya menyebabkan kegagalan; regresi ini diperbaiki. Status Instagram demo yang belum login tidak ditampilkan sebagai terhubung. |
| Gateway Instagram | Docker Desktop dan container lama dipulihkan; aiograpi-rest 6.0.0 online. Sesi lama dicek melalui GET /account dan mengembalikan login_required/session_expired. Pengguna memilih akun lama yang sama; login ulang manual masih diperlukan sebelum koneksi akun dapat dinyatakan pulih. |
| WhatsApp | Container/gateway GOWA kembali online. Satu device lama dicek langsung: connected=false dan loggedIn=false, sehingga perlu pairing ulang melalui aplikasi. Tidak ada pairing baru atau pesan WhatsApp dikirim. |
| Pemeriksaan kode | Build produksi dan typecheck kembali berhasil setelah perbaikan terakhir; 19 tes inventori dan 6 tes integrasi offline lolos. |

Enam kelompok pemeriksaan HTTP aplikasi ada di `.verification/recovery-live/app-tests.json`. Bukti browser: `browser-poster-result.jpg` dan `browser-drafts.jpg` pada folder yang sama. Fixture memuat foto pola uji, bukan foto ternak asli. Tidak ada publikasi Instagram, pesan pelanggan, atau pembelian kuota. Jadwal posting dan balas komentar di pengaturan masih berupa saran/draf AI; belum ada scheduler publikasi atau webhook komentar otomatis.

Audit akhir sesudah perbaikan: SHA-256 kedua database lokal masih sama dengan salinan sumber; 6 credential diperiksa terhadap 28 berkas JavaScript/CSS frontend dan diff Git, tanpa temuan. Dari 34 berkas trace server, tidak ditemukan `.env.local`, `.recovery`, atau `.verification`. Hasil privat disimpan di `final-audit.json` tanpa nilai credential.
