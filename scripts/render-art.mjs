import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { browserHarness } from './browser-harness.mjs'

const harness = await browserHarness()
try {
  for (const id of ['summoning', 'fireball', 'chidori']) {
    const image = await harness.page.evaluate(async (id) => {
      const { renderPoster } = await import('/app/effects/render.ts')
      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 800
      renderPoster(canvas.getContext('2d'), 1280, 800, id)
      return canvas.toDataURL('image/png').split(',')[1]
    }, id)
    await mkdir(resolve(import.meta.dirname, '../public/images/jutsu'), { recursive: true })
    await writeFile(
      resolve(import.meta.dirname, `../public/images/jutsu/${id}.png`),
      Buffer.from(image, 'base64'),
    )
    console.log(`Rendered ${id} cover`)
  }
} finally {
  await harness.close()
}
