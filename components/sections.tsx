'use client'

import { BrandMark } from '@/components/brand-mark'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  MessageSquareText,
  Warehouse,
  Sparkles,
} from 'lucide-react'
import { CountUp, Reveal, Stagger, StaggerItem } from './motion'

/* ============ Statistik strip ============ */

const stats = [
  { value: 7, suffix: ' jenis', label: 'pilihan kategori ternak' },
  { value: 1, suffix: ' inventori', label: 'stok, transaksi & laporan terhubung' },
  { value: 3, suffix: ' langkah', label: 'mulai dari catat hingga promosi' },
]

export function StatsStrip() {
  return (
    <section className="border-y border-border">
      <Stagger className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-6">
        {stats.map((s) => (
          <StaggerItem key={s.label} className="py-10 text-center">
            <p className="font-mono text-3xl font-bold text-accent md:text-4xl">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

/* ============ Fitur ============ */

const features = [
  {
    icon: Warehouse,
    title: 'Inventori Ternak',
    desc: 'Catat sapi, domba, kambing, dan unggas per kelompok kandang. Tambah jumlah, koreksi stok, dan pantau stok rendah.',
  },
  {
    icon: Sparkles,
    title: 'Konten Otomatis',
    desc: 'Siapkan caption dan poster promosi ternak dari foto produk. Pilih gaya bahasa yang sesuai dengan usaha Anda.',
  },
  {
    icon: MessageSquareText,
    title: 'Asisten Chat Pembeli',
    desc: 'Hubungkan WhatsApp usaha untuk membantu menjawab pertanyaan harga, ketersediaan, dan pemesanan dari katalog Anda.',
  },
  {
    icon: BarChart3,
    title: 'Analisis Penjualan',
    desc: 'Catat transaksi penjualan, ikuti perubahan stok, dan unduh laporan omzet serta estimasi laba dalam PDF.',
  },
]

export function Features() {
  return (
    <section id="fitur" className="mx-auto max-w-6xl px-4 py-16 sm:py-20 md:px-6 md:py-24">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-balance">
          Kandang terkelola. Pemasaran lebih mudah.
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Mulai dari jumlah ternak, stok siap jual, hingga konten promosi.
          TERKASA membantu pekerjaan harian UMKM peternakan dalam satu aplikasi.
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {features.map((f) => (
          <StaggerItem key={f.title}>
            <motion.article
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group h-full rounded-2xl border border-border bg-card p-7 transition-colors hover:border-accent/40"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <f.icon className="size-5 text-accent" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.article>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

/* ============ Cara kerja ============ */

const steps = [
  {
    num: '01',
    title: 'Daftarkan peternakan',
    desc: 'Buat akun dan isi profil peternakan. Setiap usaha memiliki inventori dan laporannya sendiri.',
  },
  {
    num: '02',
    title: 'Catat jumlah ternak',
    desc: 'Tambahkan jenis ternak, ras, kandang, jumlah awal, dan harga. Perbarui jumlah saat ternak masuk atau keluar.',
  },
  {
    num: '03',
    title: 'Promosikan & catat penjualan',
    desc: 'Siapkan konten dengan AI, bagikan ke kanal penjualan, dan catat transaksi agar stok serta laporan ikut diperbarui.',
  },
]

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20 md:px-6 md:pb-24">
      <Reveal>
        <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-balance">
          Mulai dalam 3 langkah
        </h2>
      </Reveal>

      <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
        {/* Connector line draws itself */}
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.3 }}
          className="absolute left-0 right-0 top-6 hidden h-px origin-left bg-gradient-to-r from-accent/60 via-border to-border md:block"
        />
        {steps.map((s, i) => (
          <Reveal key={s.num} delay={i * 0.18} className="relative">
            <motion.span
              whileHover={{ scale: 1.12, rotate: -4 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              className="relative z-10 inline-flex size-12 items-center justify-center rounded-xl border border-accent/30 bg-card font-mono text-sm font-bold text-accent"
            >
              {s.num}
            </motion.span>
            <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.desc}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ============ Studi kasus ============ */

export function CaseStudy() {
  return (
    <section id="studi-kasus" className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20 md:px-6 md:pb-24">
      <Reveal>
        <div className="grid overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl md:grid-cols-2">
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              Contoh Penggunaan
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight md:text-3xl text-balance">
              Dari stok di kandang, hingga promosi yang siap dibagikan.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Kelompokkan sapi Limousin di Kandang A dan domba di Kandang B.
              Saat ada ternak masuk, tambahkan jumlahnya. Ketika terjual, catat
              transaksi dan stok berkurang otomatis. Foto ternak juga bisa menjadi
              bahan caption dan poster promosi yang sesuai dengan usaha Anda.
            </p>
            <a
              href="/login"
              className="group mt-7 inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Mulai kelola peternakan
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="border-t border-border bg-background/50 p-6 sm:p-8 md:border-l md:border-t-0 md:p-12">
            <p className="text-xs text-muted-foreground">
              Simulasi inventori peternakan · bukan data usaha Anda
            </p>
            <p className="mt-3 font-mono text-4xl font-bold text-accent">
              <CountUp value={65} suffix=" ekor" />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              tercatat dalam tiga kelompok ternak
            </p>
            <div className="mt-7 flex flex-col gap-4">
              {[
                { label: 'Sapi · Kandang A', value: '12 ekor' },
                { label: 'Domba · Kandang B', value: '18 ekor' },
                { label: 'Kambing · Kandang C', value: '35 ekor' },
              ].map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.55 }}
                  className="flex items-center justify-between border-b border-border pb-3 text-sm"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-mono font-bold text-foreground">
                    {row.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ============ CTA band ============ */

export function CtaBand() {
  return (
    <section id="harga" className="relative overflow-hidden border-t border-border">
      {/* Ambient glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[100px]"
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:py-20 md:py-24">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl text-balance">
          Siap membawa peternakan Anda naik kelas?
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
          Mulai catat ternak, rapikan stok, dan siapkan promosi digital bersama TERKASA.
        </p>
        <motion.a
          href="/login"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="group mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground shadow-[0_0_36px_-8px_var(--accent)] transition-shadow hover:shadow-[0_0_56px_-4px_var(--accent)]"
        >
          Coba Gratis Sekarang
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </motion.a>
      </Reveal>
    </section>
  )
}

/* ============ Footer ============ */

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row md:px-6">
        <a href="#beranda" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent">
            <BrandMark className="size-3.5 text-accent-foreground" aria-hidden="true" />
          </span>
          <span className="font-display font-bold">TERKASA</span>
        </a>
        <p className="text-xs text-muted-foreground">
          {'© 2026 TERKASA. Semua hak dilindungi.'}
        </p>
      </div>
    </footer>
  )
}
