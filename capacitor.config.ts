import type { CapacitorConfig } from '@capacitor/cli'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

/**
 * TERKASA mobile shell (Capacitor).
 *
 * Mode: remote URL → WebView memuat production Next.js di Vercel.
 * Backend (API, auth, AI, Blob) tetap di Vercel; DB/GOWA di Railway.
 * Capacitor TIDAK menambah server load di luar traffic user biasa.
 *
 * Override URL:
 *   CAPACITOR_SERVER_URL=https://your-domain.example npm run cap:sync
 *   CAPACITOR_SERVER_URL=http://10.0.2.2:3000  (emulator → Next lokal)
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  'http://10.0.2.2:3000'

const config: CapacitorConfig = {
  appId: 'id.umkman.app',
  appName: 'TERKASA',
  webDir: 'mobile/www',
  // Bundled index.html hanya splash/fallback; runtime load server.url
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    allowNavigation: [
      new URL(serverUrl).hostname,
      '*.vercel.app',
      'wa.me',
      'api.whatsapp.com',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      'generativelanguage.googleapis.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0b141a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b141a',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0b141a',
  },
}

export default config
