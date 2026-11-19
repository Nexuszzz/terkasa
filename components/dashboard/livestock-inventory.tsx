'use client'

import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  Layers3,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Warehouse,
  X,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useDashboard } from '@/lib/dashboard-store'
import {
  inventorySummary,
  LIVESTOCK_SPECIES,
  speciesInfo,
} from '@/lib/livestock'
import type { CatalogProduct, LivestockSpecies } from '@/lib/types'

const number = new Intl.NumberFormat('id-ID')
const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
const fieldClass =
  'mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
const primaryClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-50'

function AnimalForm({
  product,
  onClose,
  onSaved,
}: {
  product?: CatalogProduct
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { addProduct, updateProduct } = useDashboard()
  const [species, setSpecies] = useState<LivestockSpecies>(
    product?.livestock?.species ?? 'sapi',
  )
  const [name, setName] = useState(product?.name ?? '')
  const [breed, setBreed] = useState(product?.livestock?.breed ?? '')
  const [pen, setPen] = useState(product?.livestock?.pen ?? '')
  const [stock, setStock] = useState(String(product?.stock ?? 0))
  const [price, setPrice] = useState(String(product?.unitPrice ?? 0))
  const [minimum, setMinimum] = useState(String(product?.lowStockAt ?? 2))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const input = {
        name: name.trim(),
        shortName: name.trim().slice(0, 48),
        variant: breed.trim() || speciesInfo(species).label,
        unitPrice: Number(price),
        lowStockAt: Number(minimum),
        livestock: { species, breed: breed.trim(), pen: pen.trim() },
      }
      if (product) await updateProduct(product.id, input)
      else await addProduct({ ...input, stock: Number(stock) })
      onSaved(
        product
          ? 'Detail ternak berhasil diperbarui.'
          : `${name.trim()} berhasil ditambahkan ke inventori.`,
      )
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Data belum berhasil disimpan.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!saving) onClose()
      }}
      title={product ? 'Edit kelompok ternak' : 'Tambah ternak'}
      subtitle="Catat per jenis, ras, atau kelompok kandang. Jumlah dihitung dalam ekor."
      maxWidth="sm:max-w-xl"
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <fieldset>
          <legend className="text-xs font-medium text-muted-foreground">
            Jenis ternak
          </legend>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {LIVESTOCK_SPECIES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={species === item.id}
                onClick={() => setSpecies(item.id)}
                className={`relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-medium transition-colors ${species === item.id ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-background text-muted-foreground hover:border-accent/40'}`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.emoji}
                </span>
                {item.label}
                {species === item.id && (
                  <Check className="absolute right-2 top-2 size-3 text-accent" />
                )}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="text-xs font-medium text-muted-foreground">
          Nama kelompok ternak
          <input
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={`Contoh: ${speciesInfo(species).label} ${species === 'sapi' ? 'Limousin' : 'kandang A'}`}
            className={fieldClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-muted-foreground">
            Ras / jenis bibit <span className="font-normal">(opsional)</span>
            <input
              maxLength={80}
              value={breed}
              onChange={(event) => setBreed(event.target.value)}
              placeholder="Mis. Limousin"
              className={fieldClass}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Kandang <span className="font-normal">(opsional)</span>
            <input
              maxLength={80}
              value={pen}
              onChange={(event) => setPen(event.target.value)}
              placeholder="Mis. Kandang A"
              className={fieldClass}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {!product && (
            <label className="text-xs font-medium text-muted-foreground">
              Jumlah awal (ekor)
              <input
                required
                type="number"
                min={0}
                max={1000000}
                step={1}
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                className={fieldClass}
              />
            </label>
          )}
          <label className="text-xs font-medium text-muted-foreground">
            Batas stok rendah (ekor)
            <input
              required
              type="number"
              min={0}
              max={1000000}
              step={1}
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <label className="text-xs font-medium text-muted-foreground">
          Harga jual per ekor (Rp)
          <input
            required
            type="number"
            min={0}
            max={2147483647}
            step={1}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={fieldClass}
          />
          <span className="mt-1.5 block text-[11px] font-normal">
            Boleh diisi 0 jika harga belum ditentukan.
          </span>
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="min-h-11 rounded-full border border-border px-5 text-sm"
          >
            Batal
          </button>
          <button disabled={saving} className={primaryClass}>
            <Plus className="size-4" />
            {saving
              ? 'Menyimpan…'
              : product
                ? 'Simpan perubahan'
                : 'Simpan ternak'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function StockForm({
  product,
  mode,
  onClose,
  onSaved,
}: {
  product: CatalogProduct
  mode: 'in' | 'out'
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { adjustStock } = useDashboard()
  const [amount, setAmount] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const quantity = Number(amount)
  const next = product.stock + (mode === 'in' ? quantity : -quantity)
  const valid =
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    quantity <= 1000000 &&
    next >= 0 &&
    next <= 1000000

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    setSaving(true)
    setError('')
    try {
      const updated = await adjustStock(
        product.id,
        mode === 'in' ? quantity : -quantity,
      )
      onSaved(
        `Stok ${updated.name} diperbarui menjadi ${number.format(updated.stock)} ekor.`,
      )
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Stok belum berhasil disimpan.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen
      title={mode === 'in' ? 'Tambah jumlah ternak' : 'Kurangi jumlah ternak'}
      subtitle={product.name}
      onClose={() => {
        if (!saving) onClose()
      }}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-5">
          <div>
            <p className="text-xs text-muted-foreground">Stok saat ini</p>
            <p className="mt-1 font-mono text-2xl font-semibold">
              {number.format(product.stock)}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ekor
              </span>
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Setelah disimpan</p>
            <p
              className={`mt-1 font-mono text-2xl font-semibold ${valid ? 'text-accent' : 'text-destructive'}`}
            >
              {Number.isFinite(next) ? number.format(next) : '—'}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ekor
              </span>
            </p>
          </div>
        </div>
        <label className="block text-xs font-medium text-muted-foreground">
          Jumlah {mode === 'in' ? 'masuk' : 'keluar'} (ekor)
          <input
            autoFocus
            required
            type="number"
            min={1}
            max={mode === 'out' ? product.stock : 1000000 - product.stock}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={fieldClass}
          />
        </label>
        <div className="flex gap-2">
          {[1, 5, 10, 25].map((value) => (
            <button
              key={value}
              type="button"
              disabled={
                mode === 'out'
                  ? value > product.stock
                  : product.stock + value > 1000000
              }
              onClick={() => setAmount(String(value))}
              className="min-h-10 flex-1 rounded-xl border border-border text-xs font-medium hover:border-accent/50 disabled:opacity-30"
            >
              {mode === 'in' ? '+' : '−'}
              {value}
            </button>
          ))}
        </div>
        {mode === 'out' && (
          <p className="rounded-xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
            Untuk penjualan, gunakan menu Transaksi agar omzet dan laporan ikut
            tercatat. Pengurangan di sini hanya mengoreksi jumlah ternak.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          disabled={!valid || saving}
          className={`${primaryClass} w-full`}
        >
          {saving ? 'Menyimpan…' : 'Simpan jumlah ternak'}
        </button>
      </form>
    </Modal>
  )
}

export function LivestockInventory() {
  const {
    catalog,
    profile,
    businessId,
    openContentModal,
    openTransactionModal,
  } = useDashboard()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LivestockSpecies | 'all'>('all')
  const [form, setForm] = useState<{ product?: CatalogProduct } | null>(null)
  const [stockForm, setStockForm] = useState<{
    product: CatalogProduct
    mode: 'in' | 'out'
  } | null>(null)
  const [notice, setNotice] = useState('')
  const summary = useMemo(() => inventorySummary(catalog), [catalog])
  const visible = summary.animals.filter(
    (item) =>
      (filter === 'all' || item.livestock?.species === filter) &&
      `${item.name} ${item.livestock?.breed} ${item.livestock?.pen}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const activeSpecies = summary.species.filter((item) => item.stock > 0)

  return (
    <section className="min-w-0 space-y-5" aria-labelledby="inventory-heading">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            TERKASA FARM MANAGEMENT
          </div>
          <h1
            id="inventory-heading"
            className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Inventori ternak<span className="text-accent">.</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Semua ternak {profile?.brand || 'Anda'}, tercatat dalam satu tempat.
          </p>
        </div>
        <button
          onClick={() => {
            setNotice('')
            setForm({})
          }}
          className={primaryClass}
        >
          <Plus className="size-4" />
          Tambah ternak
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-accent/25 bg-accent/8 px-4 py-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-accent" />
            {notice}
          </span>
          <button
            aria-label="Tutup pemberitahuan"
            onClick={() => setNotice('')}
            className="flex size-8 shrink-0 items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total ternak',
            value: number.format(summary.total),
            unit: 'ekor',
            detail: `${summary.animals.length} kelompok tercatat`,
            icon: Warehouse,
            featured: true,
          },
          {
            label: 'Jenis ternak aktif',
            value: String(activeSpecies.length),
            unit: 'jenis',
            detail: 'Sapi, domba, kambing & lainnya',
            icon: Layers3,
          },
          {
            label: 'Perlu perhatian',
            value: String(summary.lowStock),
            unit: 'kelompok',
            detail: 'Stok mencapai batas minimum',
            icon: CircleAlert,
          },
          {
            label: 'Estimasi nilai jual',
            value: rupiah(summary.value),
            unit: '',
            detail: 'Jumlah × harga jual per ekor',
            icon: ArrowUpRight,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`relative overflow-hidden rounded-2xl border p-5 ${item.featured ? 'border-accent/30 bg-gradient-to-br from-accent/15 to-background' : 'border-border bg-background/50'}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <item.icon
                className={`size-4 ${item.featured ? 'text-accent' : 'text-muted-foreground'}`}
              />
            </div>
            <p
              className={`mt-5 break-words font-mono text-2xl font-semibold tracking-tight ${item.featured ? 'text-accent' : ''}`}
            >
              {item.value}{' '}
              <span className="font-sans text-xs font-normal text-muted-foreground">
                {item.unit}
              </span>
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      {summary.total > 0 && (
        <div className="rounded-2xl border border-border bg-background/40 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold">Komposisi ternak</h2>
            <span className="text-[11px] text-muted-foreground">
              {number.format(summary.total)} ekor keseluruhan
            </span>
          </div>
          <div
            className="flex h-2.5 gap-1 overflow-hidden rounded-full"
            aria-hidden="true"
          >
            {activeSpecies.map((item) => (
              <div
                key={item.id}
                className="rounded-full"
                style={{
                  width: `${(item.stock / summary.total) * 100}%`,
                  background: item.color,
                }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {activeSpecies.map((item) => (
              <span
                key={item.id}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: item.color }}
                />
                {item.label}{' '}
                <strong className="ml-1 font-mono text-foreground">
                  {number.format(item.stock)}
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex min-w-0 flex-wrap gap-1.5"
          role="group"
          aria-label="Filter jenis ternak"
        >
          {[{ id: 'all', label: 'Semua', emoji: '' }, ...LIVESTOCK_SPECIES].map(
            (item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as typeof filter)}
                aria-pressed={filter === item.id}
                className={`min-h-10 rounded-full border px-3 text-xs font-medium transition-colors ${filter === item.id ? 'border-accent/40 bg-accent/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
        <label className="relative block min-w-0 lg:w-64 lg:shrink-0">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            aria-label="Cari ternak"
            placeholder="Cari nama, ras, kandang…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-accent"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-background/30 px-6 py-14 text-center">
          <span
            className="flex size-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/8 text-3xl"
            aria-hidden="true"
          >
            🐄
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold">
            {summary.animals.length
              ? 'Ternak belum ditemukan'
              : 'Peternakan yang rapi, mulai dari sini.'}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {summary.animals.length
              ? 'Coba nama lain atau ubah filter jenis ternak.'
              : 'Tambahkan sapi, domba, kambing, atau ternak lainnya. Catat jumlah awal, lalu perbarui stok kapan saja.'}
          </p>
          <button
            onClick={() => {
              if (summary.animals.length) {
                setQuery('')
                setFilter('all')
              } else setForm({})
            }}
            className={`${primaryClass} mt-6`}
          >
            {summary.animals.length
              ? 'Tampilkan semua ternak'
              : 'Tambah ternak pertama'}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => {
            const animal = product.livestock!
            const info = speciesInfo(animal.species)
            const low = product.stock <= product.lowStockAt
            return (
              <article
                key={product.id}
                className="group flex min-w-0 flex-col rounded-2xl border border-border bg-background/50 p-5 transition-colors hover:border-accent/30"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary/50 text-3xl"
                    aria-hidden="true"
                  >
                    {info.emoji}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${low ? 'bg-accent-warm/10 text-accent-warm' : 'bg-accent/10 text-accent'}`}
                    >
                      {product.stock === 0
                        ? 'Stok habis'
                        : low
                          ? 'Stok rendah'
                          : 'Stok tersedia'}
                    </span>
                    <button
                      onClick={() => setForm({ product })}
                      aria-label={`Edit ${product.name}`}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {info.label}
                  {animal.breed ? ` · ${animal.breed}` : ''}
                </p>
                <h2 className="mt-1 break-words font-display text-lg font-semibold">
                  {product.name}
                </h2>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {animal.pen || 'Kandang belum diisi'}
                </p>
                <div className="my-5 flex flex-wrap items-end justify-between gap-3">
                  <p className="font-mono text-4xl font-semibold tracking-tight">
                    {number.format(product.stock)}{' '}
                    <span className="font-sans text-sm font-normal text-muted-foreground">
                      ekor
                    </span>
                  </p>
                  <div className="text-right">
                    <p className="font-mono text-xs font-medium">
                      {product.unitPrice > 0
                        ? rupiah(product.unitPrice)
                        : 'Belum ditentukan'}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      harga jual / ekor
                    </p>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-4">
                  <button
                    onClick={() => setStockForm({ product, mode: 'in' })}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 text-xs font-semibold hover:bg-accent/20"
                  >
                    <Plus className="size-3.5 text-accent" />
                    Tambah jumlah
                  </button>
                  <button
                    disabled={product.stock === 0}
                    onClick={() => setStockForm({ product, mode: 'out' })}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-35"
                  >
                    <Minus className="size-3.5" />
                    Kurangi
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-r from-accent/5 via-background to-background p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Sparkles className="size-5 text-accent" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              Dari kandang, ke lebih banyak pelanggan.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Buat promosi dengan AI atau catat penjualan dari stok yang sama.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => openTransactionModal()}
            className="flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium"
          >
            <ArrowDownLeft className="size-3.5" />
            Transaksi
          </button>
          <button
            onClick={() => openContentModal()}
            className="flex min-h-10 items-center gap-1 rounded-full bg-accent px-3 text-xs font-semibold text-accent-foreground"
          >
            Buat promosi
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
      {form && (
        <AnimalForm
          key={`${businessId}-${form.product?.id || 'new'}`}
          product={form.product}
          onClose={() => setForm(null)}
          onSaved={setNotice}
        />
      )}
      {stockForm && (
        <StockForm
          key={`${businessId}-${stockForm.product.id}-${stockForm.mode}`}
          {...stockForm}
          onClose={() => setStockForm(null)}
          onSaved={setNotice}
        />
      )}
    </section>
  )
}
