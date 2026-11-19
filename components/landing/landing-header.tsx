'use client'

import { BrandMark } from '@/components/brand-mark'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import s from './landing.module.css'

const links = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Cara kerja', href: '#cara-kerja' },
  { label: 'Pemasaran AI', href: '#pemasaran' },
  { label: 'Tanya jawab', href: '#tanya-jawab' },
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    const media = window.matchMedia('(min-width: 960px)')
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false)
    }
    media.addEventListener('change', closeOnDesktop)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      media.removeEventListener('change', closeOnDesktop)
    }
  }, [open])
  return (
    <header className={s.header}>
      <a className={s.skipLink} href="#konten-utama">
        Lewati ke konten
      </a>
      <nav className={`${s.container} ${s.nav}`} aria-label="Navigasi utama">
        <a
          className={s.brand}
          href="#beranda"
          aria-label="TERKASA — Beranda"
          onClick={() => setOpen(false)}
        >
          <span className={s.brandMark}>
            <BrandMark />
          </span>
          <span>
            TERKASA<span className={s.brandDot}>.</span>
          </span>
        </a>
        <div className={s.desktopLinks}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className={s.navActions}>
          <a className={s.loginLink} href="/login">
            Masuk
          </a>
          <a
            className={`${s.button} ${s.buttonDark} ${s.navCta}`}
            href="/login"
          >
            <span className={s.navCtaDesktop}>Mulai sekarang</span>
            <span className={s.navCtaMobile}>Mulai</span>
          </a>
          <button
            ref={menuButton}
            className={s.menuButton}
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="landing-menu"
          >
            {open ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>
      {open && (
        <nav
          id="landing-menu"
          className={s.mobileMenu}
          aria-label="Navigasi seluler"
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href="/login">Masuk ke TERKASA</a>
        </nav>
      )}
    </header>
  )
}
