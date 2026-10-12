import type { Page } from '@playwright/test'
import type { SealId } from '../../app/domain/types'

export async function replayCamera(page: Page) {
  await page.addInitScript(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 784
    const context = canvas.getContext('2d')!
    let current: HTMLImageElement | null = null
    function draw() {
      context.fillStyle = '#343a37'
      context.fillRect(0, 0, canvas.width, canvas.height)
      if (current) context.drawImage(current, 0, 0, canvas.width, canvas.height)
    }
    Object.assign(window, {
      __replaySeal: async (id: string | null) => {
        if (!id) {
          current = null
          draw()
          return
        }
        const image = new Image()
        image.src = `/images/seals/${id}.jpg`
        await image.decode()
        current = image
        draw()
      },
      __replayTrack: null,
    })
    navigator.mediaDevices.getUserMedia = async () => {
      draw()
      const stream = canvas.captureStream(12)
      Object.assign(window, { __replayTrack: stream.getVideoTracks()[0] })
      const timer = setInterval(draw, 80)
      stream.getVideoTracks()[0]!.addEventListener('ended', () => clearInterval(timer))
      return stream
    }
  })
}

export async function setReplaySeal(page: Page, id: SealId | null) {
  await page.evaluate(async (id) => {
    await (
      window as unknown as { __replaySeal: (id: string | null) => Promise<void> }
    ).__replaySeal(id)
  }, id)
}
