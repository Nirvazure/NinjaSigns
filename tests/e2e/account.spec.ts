import { test, expect } from './fixtures'

for (const width of [375, 1440]) {
  test(`header navigation and personal center fit ${width}px`, async ({ page, backend }) => {
    await page.setViewportSize({ width, height: 1000 })
    await backend.seed(['fireball'])
    await backend.signIn()
    await page.goto('/')

    const header = page.locator('.dojo-header')
    const navigation = header.getByRole('navigation', { name: '主导航' })
    await expect(navigation).toBeVisible()
    await expect(page.getByRole('navigation', { name: '主导航' })).toHaveCount(1)
    await expect(page.locator('.navigation-wrap, .header-collections')).toHaveCount(0)
    await expect(navigation.getByRole('link', { name: '修炼场', exact: false })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await navigation.getByRole('link', { name: '忍术展览馆' }).click()
    await expect(page).toHaveURL(/\/gallery$/)
    await expect(navigation.getByRole('link', { name: '忍术展览馆' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(navigation).toContainText('双人对战')
    await expect(navigation).toContainText('筹备中')
    await expect(header.getByRole('button', { name: '退出登录' })).toHaveCount(0)

    const accountLink = header.getByRole('link', { name: '个人中心', exact: true })
    await expect(accountLink).toHaveAttribute('href', '/account')
    await expect(accountLink).toContainText('修炼者 A')
    await accountLink.click()
    await expect(page).toHaveURL(/\/account$/)
    await expect(page.getByRole('heading', { name: '个人中心', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: '账号信息' })).toContainText('修炼者 A')
    const stats = page.locator('.account-stats')
    await expect(stats.getByRole('link', { name: '查看忍术收藏' })).toContainText('已掌握')
    await expect(stats.getByRole('link', { name: '查看忍术收藏' })).toContainText('1 / 28')
    await expect(stats.getByRole('link', { name: '查看忍者收藏' })).toContainText('忍者')
    await expect(stats.getByRole('link', { name: '查看忍者收藏' })).toContainText('2 / 25')
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: `docs/validation/account-${width === 375 ? 'mobile' : 'desktop'}.png`,
      fullPage: true,
    })
    await stats.getByRole('link', { name: '查看忍者收藏' }).click()
    await expect(page).toHaveURL(/\/gallery\?tab=ninjas$/)
    await expect(page.locator('.ninja-card.unlocked')).toHaveCount(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('guest personal center redirects to login and returns after OAuth', async ({
  page,
  backend,
}) => {
  backend.oauth = true
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login\?next=(?:%2F|\/)account$/)
  await expect(page.locator('.account-stats, .account-profile')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '个人中心', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '使用 GitHub 登录', exact: true }).click()
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByRole('heading', { name: '个人中心', exact: true })).toBeVisible()
  await expect(page.locator('.account-profile')).toContainText('修炼者 A')
  await expect(page.locator('.account-stats')).toContainText('0 / 28')
  await expect(page.locator('.account-stats')).toContainText('1 / 25')
})

test('personal center hides unknown statistics after a load failure and recovers on retry', async ({
  page,
  backend,
}) => {
  await backend.seed(['fireball'])
  await backend.signIn()
  let stateRequests = 0
  await page.route('**/rest/v1/rpc/get_my_state', async (route) => {
    if (++stateRequests === 1) {
      await route.fulfill({
        status: 503,
        json: { message: 'test account data unavailable', code: 'TEST503' },
      })
      return
    }
    await route.fallback()
  })
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: '个人中心', exact: true })).toBeVisible()
  await expect(page.locator('.cloud-status')).toContainText('账号数据读取失败')
  await expect(page.locator('.account-stats')).toHaveCount(0)
  await page.getByRole('button', { name: '重试保存与读取', exact: true }).click()
  await expect(page.locator('.account-stats')).toContainText('1 / 28')
  await expect(page.locator('.account-stats')).toContainText('2 / 25')
  await expect(page.locator('.cloud-status')).not.toContainText('账号数据读取失败')
  expect(stateRequests).toBeGreaterThanOrEqual(2)
})
