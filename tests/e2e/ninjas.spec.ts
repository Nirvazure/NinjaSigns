import { test, expect, accountA, accountB } from './fixtures'

for (const width of [375, 1440]) {
  test(`ninja gallery and account controls fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/gallery?tab=ninjas')
    await expect(page.locator('.ninja-card')).toHaveCount(25)
    await expect(page.locator('[data-ninja="ninja-01"]')).toContainText('当前伙伴')
    await expect(page.locator('[data-ninja="ninja-02"]')).toContainText('首次成功施放豪火球之术')
    await expect(page.locator('.ninja-card button').first()).toBeDisabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `docs/validation/cloud-ninjas-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: '十二基础印', exact: true }).click()
    await expect(page.locator('.seal-card')).toHaveCount(12)
  })
}
test('cloud-owned companion persists across navigation and reload', async ({ page, backend }) => {
  await backend.seed(['fireball'])
  await backend.signIn()
  await page.goto('/gallery?tab=ninjas')
  const sasuke = page.locator('[data-ninja="ninja-02"]')
  await sasuke.getByRole('button', { name: '设为伙伴' }).focus()
  await page.keyboard.press('Enter')
  await expect(sasuke).toContainText('当前伙伴')
  expect((await backend.state()).companionId).toBe('ninja-02')
  await page.goto('/')
  await expect(page.locator('.companion-panel')).toContainText('佐助')
  await page.reload()
  await expect(page.locator('.companion-panel')).toContainText('佐助')
})
for (const raw of [
  '{broken',
  JSON.stringify({ fireball: { casts: 999, lastCastAt: '2026-10-10T00:00:00Z' } }),
]) {
  test(`old browser progress is deleted and never imported (${raw.slice(0, 12)})`, async ({
    page,
    backend,
  }) => {
    await backend.signIn()
    await page.addInitScript((raw) => {
      localStorage.setItem('naruto-spiritism.progress.v1', raw)
      localStorage.setItem('naruto-spiritism.companion.v1', 'ninja-02')
      localStorage.setItem('naruto-spiritism.ninja-unlocks.v1', '["ninja-02"]')
      localStorage.setItem('unrelated-key', 'keep')
    }, raw)
    await page.goto('/gallery?tab=ninjas')
    await expect(page.locator('.ninja-card.unlocked')).toHaveCount(1)
    expect(
      await page.evaluate(() =>
        [
          'naruto-spiritism.progress.v1',
          'naruto-spiritism.companion.v1',
          'naruto-spiritism.ninja-unlocks.v1',
        ].map((key) => localStorage.getItem(key)),
      ),
    ).toEqual([null, null, null])
    expect(await page.evaluate(() => localStorage.getItem('unrelated-key'))).toBe('keep')
    expect((await backend.state()).mastery).toEqual({})
  })
}
test('storage restrictions do not stop guest practice', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.removeItem = () => {
      throw new DOMException('denied', 'SecurityError')
    }
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: '开启摄像头', exact: true })).toBeEnabled()
  await expect(page.locator('.companion-panel')).toContainText('鸣人')
})
test('failed companion selection is not shown as saved and can be retried', async ({
  page,
  backend,
}) => {
  await backend.seed(['fireball'])
  await backend.signIn()
  backend.failCompanion = 20
  await page.goto('/gallery?tab=ninjas')
  await page.locator('[data-ninja="ninja-02"]').getByRole('button', { name: '设为伙伴' }).click()
  await expect(page.getByRole('status').filter({ hasText: '伙伴选择未保存' })).toBeVisible()
  await expect(page.locator('[data-ninja="ninja-01"]')).toContainText('当前伙伴')
  backend.failCompanion = 0
  await page.getByRole('button', { name: '重试保存与读取' }).click()
  await expect(page.locator('[data-ninja="ninja-02"]')).toContainText('当前伙伴')
})
test('logout is local and switching accounts does not inherit progress', async ({
  page,
  backend,
}) => {
  await backend.seed(['fireball'])
  await backend.signIn()
  await page.goto('/gallery?tab=ninjas')
  await expect(page.locator('.ninja-card.unlocked')).toHaveCount(2)
  await page.getByRole('button', { name: '退出', exact: true }).click()
  await expect(page.locator('.account-control')).toContainText('GitHub 登录')
  expect(backend.logoutScopes).toEqual(['local'])
  await backend.signIn(accountB)
  await page.goto('/gallery?tab=ninjas')
  await expect(page.locator('.account-control')).toContainText('修炼者 B')
  await expect(page.locator('.ninja-card.unlocked')).toHaveCount(1)
  expect((await backend.state(accountA)).mastery.fireball?.casts).toBe(1)
  expect((await backend.state(accountB)).mastery).toEqual({})
})
test('catalog load failure has a recovery action', async ({ page, backend }) => {
  backend.failCatalog = 20
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '修炼目录暂时不可用' })).toBeVisible()
  backend.failCatalog = 0
  await page.getByRole('button', { name: '重新读取目录' }).click()
  await expect(page.getByRole('button', { name: '开启摄像头', exact: true })).toBeVisible()
})
