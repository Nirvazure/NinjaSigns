import { test, expect } from './fixtures'

for (const viewport of [
  { width: 375, height: 900 },
  { width: 1440, height: 1000 },
]) {
  test(`scroll UI stays readable and touchable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/?jutsu=summoning')
    await expect(page.getByRole('button', { name: '开启摄像头', exact: true })).toBeVisible()
    const sizes = await page
      .locator('.jutsu-option, .camera-toolbar button, .stage-icon')
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect()
          return { width: rect.width, height: rect.height }
        }),
      )
    expect(sizes.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: `docs/validation/ui-jutsu-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    })
    await page.goto('/gallery?tab=seals')
    await expect(page.locator('.seal-card')).toHaveCount(12)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('preview keyboard focus stays in the dialog and returns to the opener', async ({ page }) => {
  await page.goto('/gallery')
  const opener = page.getByRole('button', { name: '预览通灵之术', exact: true })
  await opener.click()
  const close = page.getByRole('button', { name: '关闭预览', exact: true })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('dialog').getByRole('link', { name: '开始修炼' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(opener).toBeFocused()
})
