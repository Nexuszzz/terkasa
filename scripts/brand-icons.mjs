import sharp from 'sharp'
import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const nativeRoot = 'android/app/src/main/res'
const source = 'public/icon.svg'
for (const [name, size] of [
  ['apple-icon.png', 180],
  ['icon-dark-32x32.png', 32],
  ['icon-light-32x32.png', 32],
]) {
  await sharp(source).resize(size, size).png().toFile(join('public', name))
}
const foreground = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><path fill="#0a0d09" d="M32 33h44v12H60v30H48V45H32Z"/></svg>',
)
for (const [density, size, layerSize] of [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
]) {
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
    await sharp(source)
      .resize(size, size)
      .png()
      .toFile(join(nativeRoot, `mipmap-${density}`, name))
  }
  await sharp(foreground)
    .resize(layerSize, layerSize)
    .png()
    .toFile(join(nativeRoot, `mipmap-${density}`, 'ic_launcher_foreground.png'))
}
for (const folder of await readdir(nativeRoot, { withFileTypes: true })) {
  if (!folder.isDirectory() || !folder.name.startsWith('drawable')) continue
  const target = join(nativeRoot, folder.name, 'splash.png')
  const metadata = await sharp(target)
    .metadata()
    .catch(() => null)
  if (!metadata?.width || !metadata?.height) continue
  const size = Math.round(Math.min(metadata.width, metadata.height) * 0.22)
  const icon = await sharp(source).resize(size, size).png().toBuffer()
  const image = await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: '#0a0d09',
    },
  })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toBuffer()
  await writeFile(target, image)
}
await writeFile(
  join(nativeRoot, 'values/ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#D6FF4A</color></resources>\n',
)
await writeFile(
  join(nativeRoot, 'drawable-v24/ic_launcher_foreground.xml'),
  '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#0A0D09" android:pathData="M32,33h44v12H60v30H48V45H32Z"/></vector>\n',
)
await writeFile(
  join(nativeRoot, 'drawable/ic_launcher_background.xml'),
  '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#D6FF4A" android:pathData="M0,0h108v108H0Z"/></vector>\n',
)
console.log('Ikon web, launcher Android, dan splash TERKASA berhasil dibuat.')
