import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const destination = new URL(
  '../public/assets/landing/generated/',
  import.meta.url,
)
await mkdir(destination, { recursive: true })
for (const [name, width] of [
  ['cattle-pasture-v1', 1536],
  ['sheep-pasture-v1', 900],
]) {
  await sharp(
    fileURLToPath(
      new URL(`../assets/landing/source/${name}.png`, import.meta.url),
    ),
  )
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 84, effort: 6 })
    .toFile(fileURLToPath(new URL(`${name}.webp`, destination)))
  console.log(`${name}.webp prepared`)
}
