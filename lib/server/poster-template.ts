import sharp from 'sharp'
import type { ResolvedImage } from '@/lib/server/image-source'

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!,
  )

function wrap(value: string, length: number, maxLines: number) {
  const lines: string[] = []
  for (const word of value.trim().replace(/\s+/g, ' ').split(' ')) {
    if (
      !lines.length ||
      lines[lines.length - 1].length + word.length + 1 > length
    )
      lines.push(word)
    else lines[lines.length - 1] += ` ${word}`
  }
  return lines.slice(0, maxLines).map((line) => line.slice(0, length + 8))
}

/** Layout export using the original photo; this is explicitly not a generative image. */
export async function renderPosterTemplate(input: {
  productName: string
  brand?: string
  description?: string
  aspectRatio?: string
  image?: ResolvedImage | null
}): Promise<Buffer> {
  const ratio =
    input.aspectRatio === '9:16'
      ? [9, 16]
      : input.aspectRatio === '16:9'
        ? [16, 9]
        : [1, 1]
  const width = 1080
  const height = Math.round((width * ratio[1]) / ratio[0])
  const landscape = height < 900
  const photoWidth = landscape ? 480 : 968
  const photoHeight = landscape ? 410 : Math.round(height * 0.43)
  const photoX = landscape ? 544 : 56
  const photoY = landscape ? 125 : 265
  const titleX = 56
  const titleY = landscape ? 230 : photoY + photoHeight + 84
  const titleLines = wrap(
    input.productName || 'Produk Peternakan',
    landscape ? 15 : 28,
    2,
  )
  const fontSize = landscape ? 46 : 58
  const copyY = titleY + titleLines.length * (fontSize + 9) + 14
  let photo = ''
  if (input.image) {
    const source = Buffer.from(input.image.base64, 'base64')
    const magic = source.subarray(0, 8).toString('hex')
    if (
      !magic.startsWith('ffd8ff') &&
      !magic.startsWith('89504e470d0a1a0a') &&
      !source.subarray(0, 6).toString().startsWith('GIF8') &&
      source.subarray(8, 12).toString() !== 'WEBP'
    ) {
      throw new Error(
        'Foto poster harus berupa JPEG, PNG, WebP, atau GIF yang valid.',
      )
    }
    const resized = await sharp(source, { limitInputPixels: 32_000_000 })
      .rotate()
      .resize(photoWidth, photoHeight, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer()
    photo = `<image x="${photoX}" y="${photoY}" width="${photoWidth}" height="${photoHeight}" href="data:image/jpeg;base64,${resized.toString('base64')}" clip-path="url(#photo)"/>`
  }
  const description = wrap(
    input.description ||
      'Informasi stok dan pemesanan tersedia melalui peternak.',
    landscape ? 33 : 67,
    2,
  )
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#10251b"/><stop offset="1" stop-color="#07120d"/></linearGradient><clipPath id="photo"><rect x="${photoX}" y="${photoY}" width="${photoWidth}" height="${photoHeight}" rx="30"/></clipPath></defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="1040" cy="70" r="340" fill="#d6ff4a" opacity=".045"/>
    <path d="M56 116H1024" stroke="#c5ddb9" opacity=".18"/>
    <rect x="56" y="44" width="48" height="48" rx="14" fill="#d6ff4a"/><path d="M66 55h28v8H84v20h-8V63H66Z" fill="#10251b"/>
    <text x="120" y="79" font-family="DejaVu Sans,Arial,sans-serif" font-size="30" font-weight="700" fill="#f3f8e9">TERKASA</text>
    <text x="1024" y="76" text-anchor="end" font-family="DejaVu Sans,Arial,sans-serif" font-size="15" letter-spacing="2" fill="#c6d1be">DARI KANDANG, UNTUK ANDA</text>
    ${!landscape ? `<text x="56" y="174" font-family="DejaVu Sans,Arial,sans-serif" font-size="16" letter-spacing="3" fill="#d6ff4a">PROMOSI PETERNAKAN</text><text x="56" y="225" font-family="DejaVu Sans,Arial,sans-serif" font-size="27" font-weight="600" fill="#ecf4e5">${escapeXml((input.brand || 'Usaha Peternakan').slice(0, 52))}</text>` : ''}
    <rect x="${photoX}" y="${photoY}" width="${photoWidth}" height="${photoHeight}" rx="30" fill="#1d3627" stroke="#c2d79e" stroke-opacity=".2"/>
    ${photo || `<path d="M${photoX + 50} ${photoY + photoHeight - 30}q160 -180 330 -80t520 -90" stroke="#d6ff4a" opacity=".15" fill="none" stroke-width="3"/><text x="${photoX + photoWidth / 2}" y="${photoY + photoHeight / 2}" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="22" fill="#c5d5bb">Tambahkan foto ternak Anda</text>`}
    ${titleLines.map((line, index) => `<text x="${titleX}" y="${titleY + index * (fontSize + 9)}" font-family="DejaVu Sans,Arial,sans-serif" font-size="${fontSize}" font-weight="700" fill="#f4f7e9">${escapeXml(line)}</text>`).join('')}
    ${description.map((line, index) => `<text x="56" y="${copyY + index * 27}" font-family="DejaVu Sans,Arial,sans-serif" font-size="${landscape ? 17 : 20}" fill="#bfceb5">${escapeXml(line)}</text>`).join('')}
    <rect x="56" y="${height - 115}" width="310" height="54" rx="27" fill="#d6ff4a"/><text x="211" y="${height - 81}" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="20" font-weight="600" fill="#10251b">Hubungi peternak →</text>
    <text x="1024" y="${height - 39}" text-anchor="end" font-family="DejaVu Sans,Arial,sans-serif" font-size="13" fill="#aebfa3">Template otomatis TERKASA · ${photo ? 'Foto asli' : 'Foto belum ditambahkan'} · Bukan gambar generatif AI</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
