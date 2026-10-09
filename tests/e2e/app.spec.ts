import { test, expect, type Page } from '@playwright/test'
import { JUTSUS } from '../../app/domain/catalog'
import type { SealId } from '../../app/domain/types'

const cameraReadyTimeout = 30_000

async function canvasHasPixels(page: Page) {
  return page
    .locator('.effect-canvas')
    .first()
    .evaluate((element) => {
      const canvas = element as HTMLCanvasElement
      const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
      let painted = 0
      for (let i = 3; i < data.length; i += 160) if (data[i]! > 0) painted++
      return painted > 20
    })
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 375, height: 900 },
]) {
  test(`training and gallery fit ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await expect(page.getByRole('button', { name: '开启摄像头', exact: true })).toBeVisible()
    await expect
      .poll(() =>
        page.locator('.stage-poster').evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    await page.screenshot({
      path: `docs/validation/training-${viewport.width}.png`,
      fullPage: true,
    })
    await page.getByRole('button', { name: '效果预览', exact: true }).click()
    await expect.poll(() => canvasHasPixels(page)).toBe(true)
    await page.screenshot({ path: `docs/validation/summoning-${viewport.width}.png` })
    await page.getByRole('link', { name: '忍术展览馆' }).click()
    await expect(page.locator('.mastery-badge').filter({ hasText: '未掌握' })).toHaveCount(3)
    await page.screenshot({ path: `docs/validation/gallery-${viewport.width}.png`, fullPage: true })
    await page.getByRole('button', { name: '十二基础印', exact: true }).click()
    await expect(page.locator('.seal-card')).toHaveCount(12)
    await expect
      .poll(() =>
        page
          .locator('.seal-card-photo img')
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
      )
      .toBe(true)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    await page.screenshot({ path: `docs/validation/seals-${viewport.width}.png`, fullPage: true })
    await page.getByRole('link', { name: '练习此印' }).first().click()
    await expect(page).toHaveURL(/seal=rat/)
    await expect(page.locator('.instruction-header h2')).toContainText('子')
    expect(errors).toEqual([])
  })
}

test('gallery previews render all three effects without granting mastery', async ({ page }) => {
  await page.goto('/gallery')
  for (const jutsu of JUTSUS) {
    await page.getByRole('button', { name: `预览${jutsu.shortName}`, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect.poll(() => canvasHasPixels(page)).toBe(true)
    await page.screenshot({ path: `docs/validation/preview-${jutsu.id}.png` })
    await page.getByRole('button', { name: '关闭预览', exact: true }).click()
  }
  await page.reload()
  await expect(page.locator('.mastery-badge').filter({ hasText: '未掌握' })).toHaveCount(3)
})

test('camera denial is shown after the real worker initializes', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Permission denied', 'NotAllowedError')
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('摄像头权限被拒绝', {
    timeout: cameraReadyTimeout,
  })
  await expect(page.getByRole('button', { name: '重试摄像头', exact: true })).toBeEnabled()
})

test('missing camera device produces a recovery message', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('No camera', 'NotFoundError')
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('未找到摄像头', {
    timeout: cameraReadyTimeout,
  })
})

test('a model download failure prevents camera activation', async ({ page }) => {
  await page.route('**/models/yolox_nano.onnx', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('启动失败')
})

async function replayCamera(page: Page) {
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

async function setReplaySeal(page: Page, id: SealId | null) {
  await page.evaluate(async (id) => {
    await (
      window as unknown as { __replaySeal: (id: string | null) => Promise<void> }
    ).__replaySeal(id)
  }, id)
}

test('reference video replay traverses the real model and casts all three jutsu', async ({
  page,
}) => {
  await replayCamera(page)
  await page.goto('/')
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.locator('.stage-status')).toContainText('识别中', {
    timeout: cameraReadyTimeout,
  })
  for (const jutsu of JUTSUS) {
    await page.locator('.jutsu-option').filter({ hasText: jutsu.shortName }).click()
    await expect(page).toHaveURL(new RegExp(`jutsu=${jutsu.id}`))
    for (let i = 0; i < jutsu.sequence.length; i++) {
      await setReplaySeal(page, jutsu.sequence[i]!)
      await expect(page.locator('.sequence-section .section-title>span')).toHaveText(
        `${i + 1} / ${jutsu.sequence.length}`,
      )
    }
    await expect(page.locator('.cast-title')).toContainText('结印完成')
    await expect.poll(() => canvasHasPixels(page)).toBe(true)
  }
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  await expect(page.locator('.stage-status')).toContainText('已暂停')
  await page
    .locator('.camera-toolbar')
    .getByRole('button', { name: '继续修炼', exact: true })
    .click()
  await expect(page.locator('.stage-status')).toContainText('识别中', {
    timeout: cameraReadyTimeout,
  })
  await page.getByRole('link', { name: '忍术展览馆' }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { __replayTrack: MediaStreamTrack }).__replayTrack.readyState,
      ),
    )
    .toBe('ended')
  await expect(page.locator('.mastery-badge').filter({ hasText: '已掌握' })).toHaveCount(3)
  await page.reload()
  await expect(page.locator('.mastery-badge').filter({ hasText: '已掌握' })).toHaveCount(3)
})

test('single-seal replay does not grant a jutsu mastery record', async ({ page }) => {
  await replayCamera(page)
  await page.goto('/?seal=rat')
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.locator('.stage-status')).toContainText('识别中', {
    timeout: cameraReadyTimeout,
  })
  await setReplaySeal(page, 'rat')
  await expect(page.locator('.recognition-strip')).toContainText('子印已确认')
  await page.getByRole('link', { name: '忍术展览馆' }).click()
  await expect(page.locator('.mastery-badge').filter({ hasText: '未掌握' })).toHaveCount(3)
})
