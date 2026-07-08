import { test } from '@playwright/test'

const sizes = [
  { name: 'mobile-390',   width: 390,  height: 844 },
  { name: 'tablet-768',   width: 768,  height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
]

for (const { name, width, height } of sizes) {
  test(`landing page — ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `tests/screenshots/landing-${name}.png`, fullPage: true })
  })
}

test('mobile hamburger menu opens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:5173/')
  await page.waitForLoadState('networkidle')

  // Click hamburger
  const hamburger = page.locator('.lp-hamburger')
  await hamburger.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'tests/screenshots/landing-mobile-menu-open.png' })
})
