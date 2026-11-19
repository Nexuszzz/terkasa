import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { CapacitorInit } from '@/components/capacitor-init'
import { ThemeProvider } from '@/components/theme-provider'
import { WhatsAppSupportWidget } from '@/components/whatsapp-support-widget'
import { PROJECT_TITLE } from '@/lib/brand'
import './globals.css'

const inter = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter',
})

const spaceGrotesk = localFont({
  src: './fonts/space-grotesk-latin.woff2',
  weight: '300 700',
  display: 'swap',
  variable: '--font-space-grotesk',
})

const jetbrainsMono = localFont({
  src: './fonts/jetbrains-mono-latin.woff2',
  weight: '100 800',
  display: 'swap',
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'TERKASA — Inventori Peternakan & Pemasaran AI',
  description: PROJECT_TITLE,
  applicationName: 'TERKASA',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'TERKASA — Inventori Peternakan & Pemasaran AI',
    description: 'Kelola stok sapi, domba, kambing, dan ternak lainnya. Catat transaksi dan buat promosi digital dengan AI.',
    siteName: 'TERKASA',
    locale: 'id_ID',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0D09' },
    { media: '(prefers-color-scheme: light)', color: '#F7F9F1' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`bg-background ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.add('light')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh overflow-x-clip antialiased font-sans">
        <ThemeProvider>
          <CapacitorInit />
          {children}
          {/* Bubble support WA — pojok kanan bawah (landing + dashboard) */}
          <WhatsAppSupportWidget />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
