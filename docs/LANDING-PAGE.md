# Landing page TERKASA

Pembaruan 19 November 2026. Arah visual: hijau hutan dan lime, tipografi Space Grotesk/Inter lokal, fotografi ilustratif peternakan, permukaan terang untuk penjelasan fitur. Tata letak dan gaya dipisahkan di `components/landing/` agar perubahan pemasaran tidak memengaruhi dashboard.

## Susunan dan alur pengunjung

1. **Pembuka:** mengenalkan TERKASA sebagai tempat mengelola ternak, transaksi, dan promosi. Foto sapi dan kartu inventori demo membantu pengunjung memahami produknya. Ajakan utama menuju login aplikasi.
2. **Jenis ternak dan fitur:** menjelaskan cakupan sapi, domba, kambing, unggas, dan jenis lain. Tiga manfaat utama: inventori, pencatatan penjualan, dan promosi.
3. **Demo inventori:** contoh 24 sapi, 18 domba, 12 kambing. Tombol tambah/kurangi memperbarui jumlah total dan estimasi nilai jual. Filter dan reset dapat dicoba tanpa login; perubahan demo tidak dikirim ke database.
4. **Pemasaran:** pilihan poster dan caption contoh. Caption dapat disalin. Materi promosi dan usaha merupakan ilustrasi; ketersediaan gambar AI serta publikasi Instagram dijelaskan secara akurat.
5. **Cara kerja:** buat profil usaha, catat ternak/penjualan, lalu siapkan dan tinjau materi promosi.
6. **FAQ:** menjawab jenis ternak, pengurangan stok, AI, Instagram, dan pengelolaan beberapa usaha.
7. **Ajakan mulai dan footer:** mengarahkan pengunjung ke aplikasi dengan konteks yang sudah jelas.

Tidak ada statistik pelanggan, testimoni, tarif, atau janji publikasi otomatis yang dibuat-buat. “Plan” pada permintaan ini berarti susunan/alur halaman sesuai klarifikasi pengguna, bukan harga langganan.

## Organisasi aset

- PNG asli: `assets/landing/source/`.
- WebP yang dipakai website: `public/assets/landing/generated/`.
- Prompt dan asal aset: `assets/landing/prompts.json`.
- Pembuatan ulang WebP: `node scripts/prepare-landing-assets.mjs`.

Dua foto dibuat memakai built-in image_gen: sapi di padang rumput dan domba di peternakan tropis. Seluruh visual diberi konteks ilustrasi AI. Poster menggunakan tata letak HTML/CSS agar teks tetap mudah diedit. Total dua WebP sekitar 506 KiB, terpisah dari sumber PNG.

## Verifikasi

- Typecheck berhasil.
- Build produksi berhasil setelah pembetulan sintaks; peringatan tracing media dinamis dan deprecation konfigurasi Prisma yang sudah ada tetap nonfatal.
- Build sempat terhenti oleh dua baris bukan sintaks Prisma (`@@int profil` dan `@usr bisnis`) serta import `java` yang tidak terpakai. Baris tersebut diperbaiki; schema sebelum perbaikan dicadangkan di `.recovery/schema-before-landing-build-fix-20261119.prisma`. Tidak ada migrasi database dijalankan.
- Gambar sapi/domba termuat; tautan jangkar yang diperiksa memiliki target dan halaman hanya memiliki satu h1.
- Demo: tambah dua sapi mengubah 54 menjadi 56 ekor dan Rp711.000.000 menjadi Rp761.000.000; filter domba bekerja; pengurangan berhenti pada nol; reset kembali ke 54 ekor.
- Caption contoh berhasil disalin; FAQ Instagram membuka jawaban yang sesuai.
- Menu ponsel dapat dibuka, ditutup dengan Escape, dan tertutup setelah memilih tautan.
- Tidak ada overflow horizontal pada lebar CSS terukur 320, 391 dan 1440 piksel. Override viewport memperhitungkan skala tampilan IAB 1,74; ukuran akhir diverifikasi melalui DOM, bukan hanya parameter alat.
- Bukti gambar lokal di `.verification/landing-v2/`, diabaikan Git.
- Pemeriksaan produksi lokal: landing/login HTTP 200, tombol mulai membuka formulir login, dan tab poster/caption dapat dipindahkan dengan tombol panah keyboard. Pemeriksaan gambar dan overflow diulang pada versi produksi.
- Audit akhir: database akun dan usaha tetap sama dengan cadangan sumber; 6 credential privat tidak ditemukan di 29 berkas frontend atau diff Git. Tidak ada direktori pemulihan/env dalam 34 trace server yang diperiksa.

Server pratinjau QA dihentikan setelah pemeriksaan. Untuk membuka kembali aplikasi, jalankan `npm run dev` dari direktori proyek lalu buka `http://localhost:3000`.

Perubahan ini lokal; tidak ada push GitHub, perubahan domain, atau deployment.
