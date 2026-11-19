# WhatsApp Chatbot (GOWA)

Gateway: [go-whatsapp-web-multidevice](https://github.com/aldinokemal/go-whatsapp-web-multidevice)

## Pembaruan pairing — 19 November 2026

Image lama bertanggal Juli 2026 ditolak WhatsApp dengan `Client outdated (405)`, lalu endpoint login mengembalikan `QR channel closed without receiving image`. GOWA diperbarui ke image resmi `ghcr.io/aldinokemal/go-whatsapp-web-multidevice:v9.10.0` dan dipatok pada versi tersebut di Compose. QR PNG 512×512 berhasil dibuat melalui adapter TERKASA dalam sekitar satu detik. Pemilik belum menyelesaikan pairing; tidak ada pesan dikirim.

Konfigurasi container dan seluruh `storages`/`statics` lama dicadangkan secara privat di `.recovery/gowa-before-update-*`; image lama tersedia dengan tag lokal `terkasa-gowa:before-20261119`. Volume sesi `umkm-an-modal-components_umkman_gowa` dipertahankan saat container diperbarui. Folder cadangan, QR, credential dan volume runtime tidak diunggah ke GitHub.

Untuk melanjutkan **stack lama di laptop ini**, pertahankan nama project Compose agar volume yang sama digunakan:

```powershell
docker compose -p umkm-an-modal-components -f D:\projkwblampung\terkasa\docker-compose.yml up -d --no-deps gowa
```

Perintah pada bagian berikut berlaku untuk instalasi baru. Jangan mengganti project/volume stack lama secara sembarang.

## Jalankan gateway

```bash
# Pastikan Docker Desktop nyala
docker compose up -d gowa
```

- Health: http://localhost:3100/health → `OK`
- Dashboard GOWA: http://localhost:3100 (basic auth: `umkman` / `umkman-gowa-secret`)

## Env UMKMan (`.env.local`)

```
GOWA_BASE_URL=http://127.0.0.1:3100
GOWA_BASIC_AUTH=umkman:umkman-gowa-secret
GOWA_WEBHOOK_SECRET=umkman-webhook-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Hubungkan nomor di app

1. `npm run dev` (Next.js :3000)
2. Login → Dashboard → **Pengaturan → WhatsApp**
3. Isi nomor HP toko (08… / 62…)
4. Klik **Hubungkan via Nomor HP**
5. Di HP: WhatsApp → **Perangkat tertaut** → **Tautkan dengan nomor telepon** → masukkan kode
6. Tunggu status **WhatsApp terhubung**

Alternatif: tombol **Atau scan QR**.

## Webhook

GOWA mengirim event ke:

`http://host.docker.internal:3000/api/whatsapp/webhook`

(dikonfigurasi di `docker-compose.yml`)

Header: `X-Hub-Signature-256` (HMAC secret = `GOWA_WEBHOOK_SECRET`)

## Catatan

- GOWA **tidak** jalan di Vercel — butuh Docker/VPS always-on.
- Unofficial WhatsApp Web — cocok demo lomba; production skala besar pertimbangkan Cloud API resmi.
