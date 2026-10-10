import { test, expect, type Page } from '@playwright/test'

const progressKey = 'naruto-spiritism.progress.v1'
const companionKey = 'naruto-spiritism.companion.v1'
const savedProgress = { fireball: { casts: 3, lastCastAt: '2026-10-10T01:00:00Z' } }

async function seed(page: Page, companion: string | null = null) {
  await page.addInitScript(
    ({ progressKey, companionKey, savedProgress, companion }) => {
      if (!localStorage.getItem('ninja-test-seeded')) {
        localStorage.setItem(progressKey, JSON.stringify(savedProgress))
        if (companion !== null) localStorage.setItem(companionKey, companion)
        localStorage.setItem('ninja-test-seeded', 'yes')
      }
    },
    { progressKey, companionKey, savedProgress, companion },
  )
}

for (const width of [375, 1440]) {
  test(`ninja gallery and companion fit ${width}px with accessible controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/gallery?tab=ninjas')
    await expect(page.locator('.ninja-card')).toHaveCount(25)
    await expect(page.getByRole('link', { name: '查看忍者收藏' })).toContainText('1')
    const naruto = page.locator('[data-ninja="ninja-01"]')
    await expect(naruto).toContainText('当前伙伴')
    const sasuke = page.locator('[data-ninja="ninja-02"]')
    await expect(sasuke.getByRole('button')).toBeDisabled()
    await expect(sasuke).toContainText('首次成功施放豪火球之术')
    await expect
      .poll(() =>
        page
          .locator('.ninja-portrait img')
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
      )
      .toBe(true)
    const controls = await page
      .locator('.ninja-card button, .gallery-tabs button')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect()
          return box.width >= 44 && box.height >= 44
        }),
      )
    expect(controls.every(Boolean)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `docs/validation/ninjas-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: '十二基础印', exact: true }).click()
    await expect(page).toHaveURL(/tab=seals/)
    await expect(page.locator('.seal-card')).toHaveCount(12)
    await page.goBack()
    await expect(page.locator('.ninja-card')).toHaveCount(25)
    await page
      .getByRole('link', { name: '修炼场', exact: false })
      .filter({ hasText: '修炼场' })
      .last()
      .click()
    await expect(page.locator('.companion-panel')).toContainText('鸣人')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `docs/validation/companion-${width}.png`, fullPage: true })
  })
}

test('historical unlocks are retained and companion selection survives navigation and reload', async ({
  page,
}) => {
  await seed(page)
  await page.goto('/gallery?tab=ninjas')
  await expect(page.locator('.ninja-card.unlocked')).toHaveCount(3)
  await expect(page.locator('.ninja-reward')).toHaveCount(0)
  const sasuke = page.locator('[data-ninja="ninja-02"]')
  await sasuke.getByRole('button', { name: '设为伙伴' }).focus()
  await page.keyboard.press('Enter')
  await expect(sasuke).toContainText('当前伙伴')
  await expect(sasuke.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  await page
    .getByRole('link', { name: '修炼场', exact: false })
    .filter({ hasText: '修炼场' })
    .last()
    .click()
  await expect(page.locator('.companion-panel')).toContainText('佐助')
  await page.reload()
  await expect(page.locator('.companion-panel')).toContainText('佐助')
  expect(await page.evaluate((key) => localStorage.getItem(key), companionKey)).toBe('ninja-02')
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), progressKey)).toEqual(
    savedProgress,
  )
  await expect(page.locator('.ninja-reward')).toHaveCount(0)
})

test('new jutsu conditions appear and a fresh player cannot unlock characters by repeated casts', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'naruto-spiritism.progress.v1',
      JSON.stringify({
        fireball: { casts: 200, lastCastAt: '2026-10-10T01:00:00Z' },
        'shadow-sewing': { casts: 1, lastCastAt: '2026-10-10T01:00:00Z' },
        'wild-water-wave': { casts: 1, lastCastAt: '2026-10-10T01:00:00Z' },
      }),
    )
    localStorage.setItem('naruto-spiritism.ninja-unlocks.v1', '[]')
  })
  await page.goto('/gallery?tab=ninjas')
  await expect(page.locator('.ninja-card.unlocked')).toHaveCount(3)
  await expect(page.locator('[data-ninja="ninja-09"]')).toContainText('首次成功施放影缝术')
  await expect(page.locator('[data-ninja="ninja-09"]').getByRole('button')).toBeEnabled()
  const tobirama = page.locator('[data-ninja="ninja-17"]')
  await expect(tobirama).toContainText('掌握水乱波、水弹之术')
  await expect(tobirama).toContainText('1 / 2')
  await expect(tobirama.getByRole('button')).toBeDisabled()
  await expect(page.locator('[data-ninja="ninja-14"]')).toContainText('3 / 4')
  await page.reload()
  await expect(page.locator('.ninja-card.unlocked')).toHaveCount(3)
})

test('a companion unlocked under the old rules remains selected after the upgrade', async ({
  page,
}) => {
  await seed(page, 'ninja-04')
  await page.goto('/gallery?tab=ninjas')
  await expect(page.locator('[data-ninja="ninja-04"]')).toContainText('当前伙伴')
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('naruto-spiritism.ninja-unlocks.v1')!),
    ),
  ).toContain('ninja-04')
  await page.reload()
  await expect(page.locator('[data-ninja="ninja-04"]')).toContainText('当前伙伴')
})

for (const companion of ['ninja-03', 'ninja-99', '{broken']) {
  test(`invalid or locked companion ${companion} falls back without changing mastery`, async ({
    page,
  }) => {
    await seed(page, companion)
    await page.goto('/')
    await expect(page.locator('.companion-panel')).toContainText('鸣人')
    await expect(page.getByRole('link', { name: '查看忍者收藏' })).toContainText('3')
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), progressKey),
    ).toEqual(savedProgress)
  })
}

test('companion read failure is visible and leaves training usable', async ({ page }) => {
  await seed(page, 'ninja-02')
  await page.addInitScript((key) => {
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (requested) {
      if (requested === key) throw new DOMException('Storage unavailable', 'SecurityError')
      return getItem.call(this, requested)
    }
  }, companionKey)
  await page.goto('/')
  await expect(page.locator('.companion-panel')).toContainText('鸣人')
  await expect(page.getByRole('status').filter({ hasText: '伙伴读取失败' })).toBeVisible()
  await expect(page.getByRole('button', { name: '开启摄像头', exact: true })).toBeEnabled()
})

test('companion write failure preserves selection for the current session', async ({ page }) => {
  await seed(page)
  await page.addInitScript((key) => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (requested, value) {
      if (requested === key) throw new DOMException('Storage full', 'QuotaExceededError')
      return setItem.call(this, requested, value)
    }
  }, companionKey)
  await page.goto('/gallery?tab=ninjas')
  await page.locator('[data-ninja="ninja-02"]').getByRole('button', { name: '设为伙伴' }).click()
  await expect(page.getByRole('status').filter({ hasText: '伙伴仅保留在本次会话' })).toBeVisible()
  await page
    .getByRole('link', { name: '修炼场', exact: false })
    .filter({ hasText: '修炼场' })
    .last()
    .click()
  await expect(page.locator('.companion-panel')).toContainText('佐助')
  await expect(page.getByRole('status').filter({ hasText: '伙伴仅保留在本次会话' })).toBeVisible()
})

test('corrupted mastery does not unlock characters or prevent choosing the starter', async ({
  page,
}) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), progressKey)
  await page.goto('/gallery?tab=ninjas')
  await expect(page.locator('.ninja-card.unlocked')).toHaveCount(1)
  await expect(page.getByRole('status').filter({ hasText: '收藏读取失败' })).toBeVisible()
  await expect(page.locator('[data-ninja="ninja-01"]').getByRole('button')).toBeEnabled()
})
