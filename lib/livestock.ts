import type {
  CatalogProduct,
  LivestockDetails,
  LivestockSpecies,
} from '@/lib/types'

export const LIVESTOCK_SPECIES: {
  id: LivestockSpecies
  label: string
  emoji: string
  color: string
}[] = [
  { id: 'sapi', label: 'Sapi', emoji: '🐄', color: '#d6ff4a' },
  { id: 'domba', label: 'Domba', emoji: '🐑', color: '#b5a4f5' },
  { id: 'kambing', label: 'Kambing', emoji: '🐐', color: '#ffb17b' },
  { id: 'ayam', label: 'Ayam', emoji: '🐔', color: '#7dd3c0' },
  { id: 'bebek', label: 'Bebek', emoji: '🦆', color: '#89bdf5' },
  { id: 'kerbau', label: 'Kerbau', emoji: '🐃', color: '#e9b3cf' },
  { id: 'lainnya', label: 'Lainnya', emoji: '🐾', color: '#a3b1a0' },
]

export function speciesInfo(id: LivestockSpecies) {
  return (
    LIVESTOCK_SPECIES.find((item) => item.id === id) ?? LIVESTOCK_SPECIES[6]
  )
}

export function normalizeLivestock(
  value: unknown,
): LivestockDetails | undefined {
  if (value == null) return undefined
  if (typeof value !== 'object') throw new Error('Detail ternak tidak valid.')
  const item = value as Record<string, unknown>
  if (!LIVESTOCK_SPECIES.some((species) => species.id === item.species)) {
    throw new Error('Pilih jenis ternak yang tersedia.')
  }
  const text = (input: unknown) =>
    typeof input === 'string' ? input.trim().slice(0, 80) : ''
  return {
    species: item.species as LivestockSpecies,
    breed: text(item.breed),
    pen: text(item.pen),
  }
}

export function assertStock(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000) {
    throw new Error('Jumlah ternak harus bilangan bulat 0–1.000.000 ekor.')
  }
}

export function assertStockDelta(delta: number) {
  if (
    !Number.isSafeInteger(delta) ||
    delta === 0 ||
    Math.abs(delta) > 1_000_000
  ) {
    throw new Error('Perubahan stok harus bilangan bulat 1–1.000.000.')
  }
}

export function assertLivestockPrice(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2_147_483_647) {
    throw new Error(
      'Harga per ekor harus rupiah bulat antara 0 dan 2.147.483.647.',
    )
  }
}

export function inventorySummary(catalog: CatalogProduct[]) {
  const animals = catalog.filter((item) => item.livestock)
  return {
    animals,
    total: animals.reduce((sum, item) => sum + item.stock, 0),
    value: animals.reduce((sum, item) => sum + item.stock * item.unitPrice, 0),
    lowStock: animals.filter((item) => item.stock <= item.lowStockAt).length,
    species: LIVESTOCK_SPECIES.map((item) => ({
      ...item,
      stock: animals
        .filter((animal) => animal.livestock?.species === item.id)
        .reduce((sum, animal) => sum + animal.stock, 0),
    })),
  }
}
