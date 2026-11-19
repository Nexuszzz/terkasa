export const PLATFORM_NAME = 'TERKASA'
export const PLATFORM_TAGLINE = 'Inventori Peternakan & Pemasaran Digital Berbasis AI'
export const PROJECT_TITLE = 'TERKASA: Inovasi Platform Manajemen Inventori Peternakan dan Otomatisasi Pemasaran Digital Berbasis Artificial Intelligence untuk Meningkatkan Efisiensi dan Daya Saing UMKM Peternakan.'

/** Update the software identity in old profiles without renaming a user's business. */
export function normalizePlatformName(name?: string | null): string {
  const value = name?.trim()
  return !value || /^(umkman|terkasa)$/i.test(value) ? PLATFORM_NAME : value
}
