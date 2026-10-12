import { replayCamera, setReplaySeal } from './replay'
import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { JUTSUS } from '../../supabase/seed/catalog'

const cameraReadyTimeout = 30_000
const animatedJutsus = JUTSUS.filter((jutsu) => jutsu.effect)
const practiceOnlyJutsus = JUTSUS.filter((jutsu) => !jutsu.effect)
const replayPracticeOnlyJutsus = practiceOnlyJutsus.filter((jutsu) =>
  ['great-fire-annihilation', 'shuriken-shadow-clone'].includes(jutsu.id),
)

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
    await expect(page.locator('.mastery-badge').filter({ hasText: '未掌握' })).toHaveCount(
      JUTSUS.length,
    )
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

test('gallery previews render all available effects without granting mastery', async ({ page }) => {
  await page.goto('/gallery')
  for (const jutsu of animatedJutsus) {
    await page.getByRole('button', { name: `预览${jutsu.shortName}`, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect.poll(() => canvasHasPixels(page)).toBe(true)
    await page.screenshot({ path: `docs/validation/preview-${jutsu.id}.png` })
    await page.getByRole('button', { name: '关闭预览', exact: true }).click()
  }
  await page.reload()
  await expect(page.locator('.mastery-badge').filter({ hasText: '未掌握' })).toHaveCount(
    JUTSUS.length,
  )
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

test('reference video replay traverses the real model and casts all three jutsu', async ({
  page,
  backend,
}) => {
  await backend.signIn()
  await replayCamera(page)
  await page.goto('/')
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.locator('.stage-status')).toContainText('识别中', {
    timeout: cameraReadyTimeout,
  })
  for (const jutsu of animatedJutsus) {
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
  await expect(page.locator('.mastery-badge').filter({ hasText: '未掌握' })).toHaveCount(
    JUTSUS.length,
  )
  await page.getByRole('link', { name: '查看忍者收藏' }).click()
  await expect(page.locator('.ninja-card.unlocked')).toHaveCount(1)
})

for (const jutsu of replayPracticeOnlyJutsus) {
  test(`${jutsu.shortName} completes through real recognition, waits for release, and survives reload`, async ({
    page,
    backend,
  }) => {
    test.setTimeout(120000)
    await replayCamera(page)
    await backend.seed(['fireball', 'body-replacement', 'water-bullet'])
    await backend.signIn()
    await page.goto(`/?jutsu=${jutsu.id}`)
    await expect(page.getByRole('button', { name: '效果预览', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
    await expect(page.locator('.stage-status')).toContainText('识别中', {
      timeout: cameraReadyTimeout,
    })
    for (let i = 0; i < jutsu.sequence.length; i++) {
      if (i > 0 && jutsu.sequence[i] === jutsu.sequence[i - 1]) {
        await setReplaySeal(page, null)
        await expect(page.locator('.hold-track i')).toHaveCSS('width', '0px')
        await page.waitForTimeout(300)
      }
      await setReplaySeal(page, jutsu.sequence[i]!)
      if (i < jutsu.sequence.length - 1)
        await expect(page.locator('.sequence-section .section-title>span')).toHaveText(
          `${i + 1} / ${jutsu.sequence.length}`,
        )
    }
    await expect(page.locator('.recognition-strip')).toContainText('施术成功 · 松手后继续')
    await expect(page.locator('.cast-title')).toHaveCount(0)
    await expect(page.locator('.ninja-reward')).toContainText('忍者档案 14')
    expect(await canvasHasPixels(page)).toBe(false)
    await expect(page.locator('.sequence-section .section-title>span')).toHaveText(
      `0 / ${jutsu.sequence.length}`,
    )
    await page.waitForTimeout(1100)
    expect((await backend.state()).mastery[jutsu.id]!.casts).toBe(1)
    await setReplaySeal(page, null)
    await expect(page.locator('.recognition-strip')).toContainText('等待下一轮结印')
    await setReplaySeal(page, jutsu.sequence[0]!)
    if (jutsu.sequence.length === 1) {
      await expect(page.locator('.recognition-strip')).toContainText('施术成功 · 松手后继续')
      await expect
        .poll(() => backend.state().then((state) => state.mastery[jutsu.id]!.casts))
        .toBe(2)
    } else {
      await expect(page.locator('.sequence-section .section-title>span')).toHaveText(
        `1 / ${jutsu.sequence.length}`,
      )
    }
    await page.getByRole('link', { name: '忍术展览馆' }).click()
    const card = page.locator(`.jutsu-card[data-jutsu="${jutsu.id}"]`)
    await expect(card.locator('.mastery-badge')).toHaveText('已掌握')
    await expect(
      card.getByRole('button', { name: `预览${jutsu.shortName}`, exact: true }),
    ).toHaveCount(0)
    await page.reload()
    await expect(card.locator('.mastery-badge')).toHaveText('已掌握')
    expect((await backend.state()).mastery[jutsu.id]!.casts).toBe(
      jutsu.sequence.length === 1 ? 2 : 1,
    )
  })
}

test('practice-only scrolls show readable covers and fit the page at desktop and mobile sizes', async ({
  page,
}) => {
  test.setTimeout(120000)
  test.skip(!practiceOnlyJutsus.length, 'No practice-only scrolls are active in the catalog.')
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const jutsu of practiceOnlyJutsus) {
      await page.goto(`/?jutsu=${jutsu.id}`)
      await expect(page.locator('.camera-stage.placeholder .stage-caption')).toContainText(
        jutsu.shortName,
      )
      await expect(page.getByRole('button', { name: '效果预览', exact: true })).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      expect(
        await page.locator('.camera-stage.placeholder').evaluate((stage) => {
          const bounds = stage.getBoundingClientRect()
          const title = stage.querySelector('.vertical-title')!.getBoundingClientRect()
          return (
            title.left >= bounds.left &&
            title.right <= bounds.right &&
            title.top >= bounds.top &&
            title.bottom <= bounds.bottom - 30
          )
        }),
        jutsu.id,
      ).toBe(true)
      expect(
        await page.locator('.jutsu-options').evaluate((list) => {
          const selected = list.querySelector('.jutsu-option.selected')!
          const bounds = list.getBoundingClientRect()
          const option = selected.getBoundingClientRect()
          return option.top >= bounds.top - 1 && option.bottom <= bounds.bottom + 1
        }),
      ).toBe(true)
    }
    await page.goto('/gallery')
    await expect(page.locator('.jutsu-card')).toHaveCount(JUTSUS.length)
    for (const jutsu of practiceOnlyJutsus) {
      const card = page.locator(`.jutsu-card[data-jutsu="${jutsu.id}"]`)
      await expect(card.locator('.cover-title')).toHaveText(jutsu.shortName)
      await expect(
        card.getByRole('button', { name: `预览${jutsu.shortName}`, exact: true }),
      ).toHaveCount(0)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('real replay grants merged rewards only after the effect and never repeats them', async ({
  page,
  backend,
}) => {
  test.setTimeout(120000)
  await replayCamera(page)
  await backend.seed(['false-darkness', 'black-panther'])
  await backend.signIn()
  await page.goto('/?jutsu=chidori')
  await expect(page.getByRole('link', { name: '查看忍者收藏' })).toContainText('1')
  await expect(page.locator('.ninja-reward')).toHaveCount(0)
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.locator('.stage-status')).toContainText('识别中', {
    timeout: cameraReadyTimeout,
  })
  await setReplaySeal(page, 'rat')
  await expect(page.locator('.recognition-strip')).toContainText('当前为子印')
  await expect(page.getByRole('link', { name: '查看忍者收藏' })).toContainText('1')
  await setReplaySeal(page, null)
  const jutsu = JUTSUS.find((entry) => entry.id === 'chidori')!
  for (let cast = 0; cast < 2; cast++) {
    for (let i = 0; i < jutsu.sequence.length; i++) {
      await setReplaySeal(page, jutsu.sequence[i]!)
      await expect(page.locator('.sequence-section .section-title>span')).toHaveText(
        `${i + 1} / ${jutsu.sequence.length}`,
      )
    }
    await expect(page.locator('.cast-title')).toContainText('结印完成')
    await expect(page.locator('.ninja-reward')).toHaveCount(0)
    await expect(page.locator('.cast-title')).toHaveCount(0)
    if (cast === 0) {
      await expect(page.locator('.ninja-reward')).toContainText('卡卡西')
      await expect(page.locator('.ninja-reward')).toContainText('奇拉比')
      await expect(page.locator('.ninja-reward-portraits img')).toHaveCount(2)
      await expect(page.locator('.companion-panel')).toContainText('鸣人')
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        await page.screenshot({ path: `docs/validation/ninja-reward-${width}.png`, fullPage: true })
      }
      await page.getByRole('button', { name: '关闭解锁提示' }).click()
    } else await expect(page.locator('.ninja-reward')).toHaveCount(0)
    await setReplaySeal(page, null)
    await expect(page.locator('.recognition-strip')).toContainText('等待下一轮结印')
  }
  expect((await backend.state()).mastery.chidori!.casts).toBe(2)
  await page.getByRole('button', { name: '效果预览', exact: true }).click()
  await expect(page.locator('.cast-title')).toContainText('忍术预览')
  await expect(page.locator('.cast-title')).toHaveCount(0)
  await expect(page.locator('.ninja-reward')).toHaveCount(0)
  expect((await backend.state()).mastery.chidori!.casts).toBe(2)
})
