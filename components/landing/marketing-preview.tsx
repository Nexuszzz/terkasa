'use client'

import Image from 'next/image'
import { Check, Copy, ImageIcon, Sparkles } from 'lucide-react'
import { InstagramIcon } from '@/components/dashboard/brand-icons'
import { useState } from 'react'
import s from './landing.module.css'

const caption =
  'Kenalan dengan Domba Garut dari Peternakan Makmur. Ingin tahu stok yang tersedia dan informasi pemesanan? Hubungi kami untuk detailnya.\n\n#PeternakanLokal #DombaGarut #TERKASA'

export function MarketingPreview() {
  const [view, setView] = useState('poster')
  const [copyStatus, setCopyStatus] = useState('')
  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopyStatus('Caption berhasil disalin.')
    } catch {
      setCopyStatus('Pilih teks caption untuk menyalinnya secara manual.')
    }
  }
  return (
    <div className={s.marketingDemo}>
      <div
        className={s.marketingTabs}
        role="tablist"
        aria-label="Contoh konten promosi"
      >
        <button
          id="poster-tab"
          role="tab"
          aria-selected={view === 'poster'}
          aria-controls="poster-panel"
          tabIndex={view === 'poster' ? 0 : -1}
          onClick={() => setView('poster')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              setView('caption')
              document.getElementById('caption-tab')?.focus()
            }
          }}
        >
          <ImageIcon size={16} aria-hidden="true" /> Poster
        </button>
        <button
          id="caption-tab"
          role="tab"
          aria-selected={view === 'caption'}
          aria-controls="caption-panel"
          tabIndex={view === 'caption' ? 0 : -1}
          onClick={() => setView('caption')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              setView('poster')
              document.getElementById('poster-tab')?.focus()
            }
          }}
        >
          <Sparkles size={16} aria-hidden="true" /> Caption
        </button>
        <span>Contoh hasil</span>
      </div>
      {view === 'poster' ? (
        <div
          id="poster-panel"
          role="tabpanel"
          aria-labelledby="poster-tab"
          className={s.posterPanel}
        >
          <div className={s.poster}>
            <Image
              src="/assets/landing/generated/sheep-pasture-v1.webp"
              alt="Ilustrasi domba di padang rumput, dibuat dengan AI"
              width={900}
              height={900}
              sizes="(max-width: 600px) 82vw, 400px"
            />
            <div className={s.posterShade} />
            <span className={s.posterBrand}>
              TERKASA <span>×</span> PETERNAKAN MAKMUR
            </span>
            <div className={s.posterCopy}>
              <span>DARI PETERNAK LOKAL</span>
              <h3>
                Kenali ternaknya.
                <br />
                Temukan pilihanmu.
              </h3>
              <p>Informasi stok & pemesanan</p>
              <span className={s.posterCta}>Hubungi peternak</span>
            </div>
          </div>
          <p className={s.previewNote}>
            Contoh desain promosi · foto ilustrasi AI
          </p>
        </div>
      ) : (
        <div
          id="caption-panel"
          role="tabpanel"
          aria-labelledby="caption-tab"
          className={s.captionPanel}
        >
          <span className={s.captionPlatform}>
            <InstagramIcon className="size-5" aria-hidden="true" /> Caption
            Instagram
          </span>
          <p>{caption}</p>
          <button
            className={`${s.button} ${s.buttonDark}`}
            onClick={copyCaption}
          >
            {copyStatus.startsWith('Caption berhasil') ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Copy size={17} aria-hidden="true" />
            )}{' '}
            Salin contoh caption
          </button>
          <span className={s.copyStatus} role="status">
            {copyStatus}
          </span>
          <p className={s.captionFootnote}>
            Contoh untuk usaha demo. Tinjau fakta, stok, dan informasi kontak
            sebelum membagikan konten Anda.
          </p>
        </div>
      )}
    </div>
  )
}
