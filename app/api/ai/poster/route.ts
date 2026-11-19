/**
 * Poster from the configured Gemini Web / Genity provider, or a TERKASA photo template.
 * Generated files are stored privately by user and business.
 *
 * Caption / teks TIDAK lewat sini.
 * Teks → POST /api/ai task=caption (Gemini).
 *
 * Multi-tenant / anti-leak:
 *  - Jangan default ke catalog[0] saat user upload foto/produk lain.
 *  - Katalog hanya dipakai jika nama produk BENAR-BENAR cocok.
 *  - Foto upload user = sumber kebenaran kemasan.
 *
 * Genity HANYA fetch reference_image_urls PUBLIC (bukan localhost).
 * Foto lokal → Gemini vision deskripsikan → prompt Genity.
 */
import { envTrim, getSessionUser, unauthorized } from '@/lib/server/auth'
import { getSnapshot } from '@/lib/server/db'
import { describeProductPackaging } from '@/lib/server/gemini-vision'
import {
  buildPosterPrompt,
  generatePosterImage,
  gentyConfigured,
  gentyReachable,
  type PosterAspect,
  type PosterResolution,
} from '@/lib/server/genty'
import {
  isGenityFetchableUrl,
  resolveImageSource,
  type ResolvedImage,
} from '@/lib/server/image-source'
import {
  ensureUploadsScaffold,
  saveBufferImage,
  saveRemoteImage,
  mediaKeyOwnerUserId,
  parseMediaKey,
} from '@/lib/server/media-store'
import { renderPosterTemplate } from '@/lib/server/poster-template'
import { geminiWebConfig, geminiWebReady, generateGeminiWebPoster } from '@/lib/server/gemini-web'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const selectedProvider = () => envTrim('POSTER_IMAGE_PROVIDER') === 'gemini-web' ? 'gemini-web' : 'genityboost'
const IMAGE_MODEL = 'nano-banana' as const

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status })
}

function catalogProductMatches(
  productName: string,
  p: { name: string; shortName: string },
): boolean {
  const name = productName.trim().toLowerCase()
  if (!name || name.length < 2) return false
  const full = p.name.toLowerCase()
  const short = p.shortName.toLowerCase()
  // Cocok jelas saja — hindari match lemah yang nyasar ke SKU toko
  return (
    full === name ||
    short === name ||
    full.includes(name) ||
    name.includes(short) ||
    short.includes(name)
  )
}

export async function GET() {
  const web = selectedProvider() === 'gemini-web'
  const aiConfigured = web ? Boolean(geminiWebConfig().key) : gentyConfigured()
  return jsonResponse({
    configured:
      aiConfigured || process.env.POSTER_TEMPLATE_FALLBACK !== 'false',
    provider: selectedProvider(),
    model: web ? geminiWebConfig().model : IMAGE_MODEL,
    templateFallback: process.env.POSTER_TEMPLATE_FALLBACK !== 'false',
    aiConfigured,
    storage: '/storage/uploads + /api/media/file (auth)',
    docs: web ? 'https://github.com/HanaokaYuzu/Gemini-API' : 'https://api.genityboost.site/docs/nano-banana',
    note: web ? 'Poster melalui gateway Gemini Web lokal; perlu sesi akun aktif. Template foto menjadi cadangan.' : 'Poster AI memakai Genity; template otomatis memakai foto asli.',
  })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const userId = user.id

  let body: {
    posterMode?: 'auto' | 'ai' | 'template'
    productName?: string
    style?: string
    platform?: string
    description?: string
    resolution?: PosterResolution
    aspectRatio?: PosterAspect
    /** Public URL, relative path, localhost URL, or data URL */
    referenceImageUrl?: string
    /** Foto yang di-upload user di modal (prioritas tertinggi) */
    referenceImage?: string
    userPrompt?: string
  }

  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Permintaan tidak valid.' }, 400)
  }

  const businessId = request.headers.get('x-business-id')
  const mode =
    body.posterMode === 'ai'
      ? 'ai'
      : body.posterMode === 'template'
        ? 'template'
        : 'auto'
  const fallbackAllowed =
    mode === 'template' ||
    (mode === 'auto' && process.env.POSTER_TEMPLATE_FALLBACK !== 'false')
  const useWeb = selectedProvider() === 'gemini-web'
  const aiAvailable = mode !== 'template' && (useWeb ? await geminiWebReady() : await gentyReachable())
  if (!aiAvailable && !fallbackAllowed)
    return jsonResponse(
      {
        error:
          useWeb ? 'Gemini Web belum terhubung. Buka halaman setup gateway atau gunakan Template foto.' : 'Layanan gambar AI belum dapat dijangkau. Gunakan mode Template atau periksa koneksi GenityBoost.',
        code: 'IMAGE_AI_UNAVAILABLE',
      },
      503,
    )
  const userProductName = (body.productName || '').trim()
  const userPrompt = (body.userPrompt || '').trim()
  const userPhoto = (body.referenceImage || body.referenceImageUrl || '').trim()
  const hasUserPhoto = Boolean(userPhoto)
  const hasUserDirection = Boolean(
    userProductName || userPrompt || hasUserPhoto,
  )

  let storeBrand = ''
  let storeCategory = ''
  let resolvedBusinessId = businessId
  let catalogDescription = (body.description || '').trim()
  let catalogImage: string | undefined
  let catalogMatched = false
  let matchedProductName = ''

  let defaultStyle = 'Promo'
  try {
    const db = await getSnapshot(businessId, user.id)
    storeBrand = db.profile.brand || ''
    storeCategory = db.profile.category || ''
    defaultStyle = db.profile.ai?.tone || defaultStyle
    resolvedBusinessId = db.id

    // HANYA pakai katalog jika user mengetik nama yang cocok — JANGAN catalog[0]
    if (userProductName && db.catalog.length) {
      const match = db.catalog.find((p) =>
        catalogProductMatches(userProductName, p),
      )
      if (match) {
        catalogMatched = true
        matchedProductName = match.name
        if (!catalogDescription) catalogDescription = match.description
        catalogImage = match.image
      }
    }
  } catch {
    storeBrand = ''
  }

  // Nama produk di poster:
  // 1) yang user ketik  2) match katalog  3) dari foto/prompt  — JANGAN default brand toko
  let productHint = userProductName || matchedProductName
  if (!productHint && hasUserPhoto) {
    productHint = 'the product shown in the uploaded photo'
  } else if (!productHint && userPrompt) {
    productHint = userPrompt.slice(0, 80)
  } else if (!productHint) {
    productHint = 'featured product'
  }

  // Brand di poster: tegas hanya jika cocok katalog.
  // Upload produk luar → jangan tempel merek toko ke kemasan yang berbeda.
  const brandForPrompt = catalogMatched
    ? storeBrand
    : !hasUserPhoto && storeBrand
      ? storeBrand
      : ''
  const categoryForPrompt = catalogMatched
    ? storeCategory
    : hasUserPhoto
      ? ''
      : storeCategory
  // Deskripsi katalog hanya jika match; selain itu hanya teks yang dikirim client (bukan inject SKU toko)
  const descriptionForPrompt = catalogMatched
    ? catalogDescription
    : (body.description || '').trim()

  // Prioritas gambar: foto user dulu. Catalog image HANYA jika match + user tidak upload foto lain.
  const imageCandidates: string[] = []
  if (body.referenceImage?.trim())
    imageCandidates.push(body.referenceImage.trim())
  if (
    body.referenceImageUrl?.trim() &&
    body.referenceImageUrl !== body.referenceImage
  ) {
    imageCandidates.push(body.referenceImageUrl.trim())
  }
  if (catalogMatched && catalogImage && !hasUserPhoto) {
    imageCandidates.push(catalogImage)
  }

  let visualDescription: string | null = null
  let hasProductPhoto = false
  const refs: string[] = []
  let originalPhoto: ResolvedImage | null = null

  for (const candidate of imageCandidates) {
    // The catalog's empty-photo illustration is not an original product photo.
    if (candidate.split(/[?#]/)[0] === '/placeholder.svg') continue
    if (candidate.startsWith('/api/media/file')) {
      const key = parseMediaKey(candidate)
      const owner = key && mediaKeyOwnerUserId(key)
      const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
      if (!owner || owner !== safeUser) return jsonResponse({ error: 'Akses foto referensi ditolak.' }, 403)
    }
    if (isGenityFetchableUrl(candidate) && !refs.includes(candidate)) {
      refs.push(candidate)
    }

    if (visualDescription) continue

    const resolved = await resolveImageSource(candidate)
    if (!resolved) continue

    originalPhoto ||= resolved
    hasProductPhoto = true
    if (aiAvailable && !useWeb)
      visualDescription = await describeProductPackaging({
        image: resolved,
        productName: userProductName || productHint,
        // Jangan bias vision dengan brand toko jika foto diluar katalog
        brand: catalogMatched ? storeBrand : undefined,
        description: catalogMatched ? catalogDescription : undefined,
        photoIsSourceOfTruth: true,
        outsideStoreCatalog: !catalogMatched,
        storeBrandHint: storeBrand || undefined,
      })

    if (
      resolved.isPublicRemote &&
      resolved.publicUrl &&
      !refs.includes(resolved.publicUrl)
    ) {
      refs.push(resolved.publicUrl)
    }
  }

  const prompt = buildPosterPrompt({
    productName: productHint,
    brand: brandForPrompt || undefined,
    style: body.style || defaultStyle,
    platform: body.platform,
    description: descriptionForPrompt || undefined,
    userPrompt: userPrompt || undefined,
    visualDescription: visualDescription || undefined,
    category: categoryForPrompt || undefined,
    hasProductPhoto,
    outsideStoreCatalog: hasUserDirection && !catalogMatched,
    storeBrand: storeBrand || undefined,
  })

  async function createTemplate(reason: string) {
    try {
      const buffer = await renderPosterTemplate({
        productName:
          userProductName || matchedProductName || 'Produk Peternakan',
        brand: catalogMatched ? storeBrand : undefined,
        description: descriptionForPrompt || undefined,
        aspectRatio: body.aspectRatio,
        image: originalPhoto,
      })
      const saved = await saveBufferImage(
        buffer,
        'image/png',
        'terkasa-template',
        {
          userId,
          businessId: resolvedBusinessId,
          kind: 'posters',
          filenamePrefix: 'template',
        },
      )
      return jsonResponse({
        url: saved.publicPath,
        localPath: saved.publicPath,
        bytes: saved.bytes,
        saved: true,
        permanent: Boolean(saved.permanent),
        provider: 'template',
        model: 'terkasa-template',
        generatedImage: false,
        usedOriginalPhoto: Boolean(originalPhoto),
        warning: `${reason} ${originalPhoto ? 'Menggunakan foto asli.' : 'Foto belum ditambahkan; unggah foto ternak sebelum dipublikasikan.'}`,
        productUsed:
          userProductName || matchedProductName || 'Produk Peternakan',
      })
    } catch {
      return jsonResponse(
        {
          error:
            'Poster template belum berhasil dibuat. Gunakan foto JPEG, PNG, atau WebP yang valid lalu coba lagi.',
        },
        400,
      )
    }
  }

  if (!aiAvailable)
    return createTemplate(
      mode === 'template'
        ? 'Poster template otomatis TERKASA. Bukan gambar generatif AI.'
        : 'Layanan gambar AI sedang tidak tersedia. Poster dibuat dengan template TERKASA, bukan gambar generatif AI.',
    )

  try {
    if (useWeb) {
      const generated = await generateGeminiWebPoster({ prompt, aspectRatio: body.aspectRatio, image: originalPhoto })
      const saved = await saveBufferImage(generated.buffer, 'image/jpeg', 'gemini-web', { userId, businessId: resolvedBusinessId, kind: 'posters', filenamePrefix: 'poster' })
      return jsonResponse({ url: saved.publicPath, localPath: saved.publicPath, provider: 'gemini-web', model: generated.model, generatedImage: true, bytes: saved.bytes, permanent: Boolean(saved.permanent), saved: true, productUsed: userProductName || matchedProductName || 'Produk Peternakan', usedOriginalPhoto: Boolean(originalPhoto) })
    }
    const result = await generatePosterImage({
      prompt,
      resolution: body.resolution || '1K',
      aspectRatio: body.aspectRatio || '1:1',
      referenceImageUrls: refs.length ? refs : undefined,
      model: IMAGE_MODEL,
    })

    await ensureUploadsScaffold()
    const saved = await saveRemoteImage(result.url, {
      userId: user.id,
      businessId: resolvedBusinessId,
      kind: 'posters',
      filenamePrefix: 'poster',
    })

    return jsonResponse({
      url: saved.publicPath,
      localPath: saved.publicPath,
      remoteUrl: result.url,
      jobId: result.jobId,
      model: result.model,
      provider: 'genityboost',
      generatedImage: true,
      bytes: saved.bytes,
      permanent: Boolean(saved.permanent),
      prompt,
      saved: true,
      usedVision: Boolean(visualDescription),
      usedPublicReference: refs.length > 0,
      catalogMatched,
      productUsed: productHint,
      referenceNote: refs.length
        ? 'Genity memakai URL referensi publik.'
        : hasProductPhoto
          ? 'Foto produk (upload/lokal) dideskripsikan Gemini — tidak memaksa produk katalog toko.'
          : catalogMatched
            ? 'Mengikuti produk katalog yang cocok dengan nama yang diminta.'
            : 'Tidak ada foto & tidak cocok katalog — poster dari teks user saja (bukan default SKU toko).',
    })
  } catch (error) {
    console.error(
      'Poster generation failed',
      error instanceof Error ? error.message : error,
    )
    if (fallbackAllowed)
      return createTemplate(
        'Generasi gambar AI gagal. Poster dibuat dengan template TERKASA, bukan gambar generatif AI.',
      )
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal membuat poster. Coba lagi atau cek kuota GenityBoost.',
      },
      502,
    )
  }
}
