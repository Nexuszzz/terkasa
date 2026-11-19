import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  outputFileTracingExcludes: {
    '/*': ['./.recovery/**/*', './.verification/**/*', './.git/**/*', './.env*', './integrations/gemini-web/**/*'],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
