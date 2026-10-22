import { test, expect, accountA, accountB } from './fixtures'
import { replayCamera, setReplaySeal } from './replay'
import { JUTSUS } from '../../supabase/seed/catalog'

test('GitHub OAuth uses PKCE and callback restores the requested page', async ({
  page,
  backend,
}) => {
  backend.oauth = true
  await page.goto('/login?next=%2Fgallery%3Ftab%3Dninjas')
  await page.getByRole('button', { name: '使用 GitHub 登录' }).click()
  await expect(page).toHaveURL(/\/gallery\?tab=ninjas$/)
  await expect(page.locator('.account-control')).toContainText('修炼者 A')
  expect(backend.oauthRequests).toHaveLength(1)
  expect(backend.oauthRequests[0]!.searchParams.get('provider')).toBe('github')
  expect(backend.oauthRequests[0]!.searchParams.get('code_challenge')).toBeTruthy()
  expect(backend.exchanges).toHaveLength(1)
  expect(backend.exchanges[0]).toMatchObject({ auth_code: 'test-oauth-code' })
  expect(backend.exchanges[0]!.code_verifier).toBeTruthy()
})

test('OAuth rejection has a retry action', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied')
  await expect(page.getByRole('heading', { name: '登录未完成' })).toBeVisible()
  await expect(page.getByRole('link', { name: '重新登录' })).toBeVisible()
})

for (const guest of [true, false]) {
  test(`${guest ? 'guest cast is not persisted' : 'failed cast retries the same request without false mastery'}`, async ({
    page,
    backend,
  }) => {
    test.setTimeout(120000)
    if (!guest) {
      await backend.signIn()
      backend.failCast = 1
    }
    await replayCamera(page)
    const jutsu = JUTSUS.find((item) => item.id === 'shuriken-shadow-clone')!
    await page.goto(`/?jutsu=${jutsu.id}`)
    await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
    await expect(page.locator('.stage-status')).toContainText('识别中', { timeout: 30000 })
    for (let i = 0; i < jutsu.sequence.length; i++) {
      await setReplaySeal(page, jutsu.sequence[i]!)
      if (i < jutsu.sequence.length - 1)
        await expect(page.locator('.sequence-section .section-title>span')).toHaveText(
          `${i + 1} / ${jutsu.sequence.length}`,
        )
    }
    await expect(page.locator('.recognition-strip')).toContainText('施术成功 · 松手后继续')
    if (guest) {
      expect(backend.requests).toHaveLength(0)
      await expect(page.getByRole('link', { name: '个人中心', exact: true })).toHaveCount(0)
    } else {
      await expect(page.locator('.cloud-status')).toContainText('未保存')
      expect((await backend.state()).mastery[jutsu.id]).toBeUndefined()
      await page.getByRole('button', { name: '重试保存与读取' }).click()
      await expect.poll(async () => (await backend.state()).mastery[jutsu.id]?.casts).toBe(1)
      expect(backend.requests).toHaveLength(2)
      expect(new Set(backend.requests).size).toBe(1)
      await page.getByRole('link', { name: '个人中心', exact: true }).click()
      await expect(page.locator('.account-stats')).toContainText('1 / 28')
    }
  })
}

test('an old account cast response cannot enter the next account', async ({ page, backend }) => {
  test.setTimeout(120000)
  await backend.signIn(accountA)
  await replayCamera(page)
  backend.delayCast = 5000
  const jutsu = JUTSUS.find((item) => item.id === 'shuriken-shadow-clone')!
  await page.goto(`/?jutsu=${jutsu.id}`)
  await page.getByRole('button', { name: '开启摄像头', exact: true }).click()
  await expect(page.locator('.stage-status')).toContainText('识别中', { timeout: 30000 })
  for (let i = 0; i < jutsu.sequence.length; i++) {
    await setReplaySeal(page, jutsu.sequence[i]!)
    if (i < jutsu.sequence.length - 1)
      await expect(page.locator('.sequence-section .section-title>span')).toHaveText(
        `${i + 1} / ${jutsu.sequence.length}`,
      )
  }
  await expect.poll(() => backend.requests.length).toBe(1)
  const pendingCast = page.waitForResponse('**/rest/v1/rpc/record_cast')
  await page.getByRole('link', { name: '个人中心', exact: true }).click()
  await page.getByRole('button', { name: '退出登录', exact: true }).click()
  await pendingCast
  await expect(page.locator('.account-stats')).toHaveCount(0)
  await page.getByRole('link', { name: '忍术展览馆' }).click()
  await expect(page.locator('.mastery-badge').filter({ hasText: '未掌握' })).toHaveCount(
    JUTSUS.length,
  )
  await backend.signIn(accountB)
  await page.goto('/account')
  await expect(page.locator('.account-control')).toContainText('修炼者 B')
  await expect(page.locator('.account-stats')).toContainText('0 / 28')
  expect((await backend.state(accountB)).mastery).toEqual({})
})
