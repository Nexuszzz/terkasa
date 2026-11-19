import { fetchGemini, geminiRuntimeConfig, geminiTimeout } from '@/lib/server/gemini-client'
/**
 * Gemini vision helpers — describe product packaging so Genity poster
 * matches the real photo (Genity cannot see localhost / data-URL images).
 *
 * Photo is source of truth. Do not bias toward store catalog (e.g. NUSACID)
 * when the client uploaded a different product.
 */

import type { ResolvedImage } from '@/lib/server/image-source'

function getGeminiConfig() {
  const config = geminiRuntimeConfig()
  return config.configured ? config : null
}

/**
 * Describe product packaging from a photo for poster generation prompts.
 * Returns concise English visual specs Genity can follow.
 */
export async function describeProductPackaging(input: {
  image: ResolvedImage
  productName: string
  brand?: string
  description?: string
  /** Always prefer pixels over catalog text */
  photoIsSourceOfTruth?: boolean
  /** User product is outside the store catalog */
  outsideStoreCatalog?: boolean
  storeBrandHint?: string
}): Promise<string | null> {
  const cfg = getGeminiConfig()
  if (!cfg) return null

  const brand = input.brand || ''
  const product = input.productName || 'product'
  const catalogNote =
    input.description && !input.outsideStoreCatalog
      ? ` Optional catalog note (use ONLY if consistent with the photo): ${input.description.slice(0, 200)}.`
      : ''

  const antiBias = input.outsideStoreCatalog || input.photoIsSourceOfTruth
    ? [
        'The uploaded photo is the ONLY source of truth for the actual subject.',
        'Describe ONLY what is visible in the image.',
        input.storeBrandHint
          ? `Ignore store brand "${input.storeBrandHint}" unless that exact brand text is visible on the pack.`
          : '',
        'Do NOT rewrite the product as a different brand/SKU from the store catalog if the photo shows something else. Photo is source of truth.',
        'If brand text on the pack is readable, use that brand — not a different store brand.',
      ]
        .filter(Boolean)
        .join(' ')
    : ''

  const instruction = [
    'You are a product-photography art director.',
    'Describe ONLY what you see in this photo for an AI image generator that must preserve the SAME subject. For livestock, describe the visible animal, its colors, markings, posture and surroundings. Do not describe a bottle or invent packaging for an animal.',
    'Write 5-8 short English sentences covering:',
    '1) Actual subject type, shape and proportions; animal species when visually identifiable',
    '2) Main colors, distinctive markings and visible details; readable labels only if any',
    '3) Natural setting, posture, lighting and materials that are actually visible',
    '4) Packaging details ONLY if the subject really is a packaged product',
    '5) Do not infer precise breed, age, weight, health, certificates or prices from appearance',
    'Critical rules:',
    product && product !== 'the product shown in the uploaded photo' && product !== 'featured product'
      ? `User named this product "${product}"${brand ? ` (brand hint "${brand}" only if label matches)` : ''}.`
      : 'User did not force a catalog SKU — identify the product from the photo alone.',
    antiBias,
    'Do NOT invent herbal medicine / jamu packaging unless the photo literally shows that.',
    'Prefer concrete colors and shapes over vague words.',
    'Output plain text only, no markdown, max 450 characters.',
    catalogNote,
  ]
    .filter(Boolean)
    .join(' ')

  try {
    const upstream = await fetchGemini(cfg.model, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: instruction },
              {
                inline_data: {
                  mime_type: input.image.mimeType,
                  data: input.image.base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
        },
      }),
      signal: AbortSignal.timeout(geminiTimeout()),
    })

    const payload = await upstream.json()
    if (!upstream.ok) {
      console.error('Gemini vision describe failed', upstream.status, payload?.error?.status)
      return null
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim()

    if (!text) return null
    return text.slice(0, 500)
  } catch (error) {
    console.error('Gemini vision describe error', error instanceof Error ? error.message : error)
    return null
  }
}
