import { test, expect } from '@playwright/test'

const sizes = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'mobile-390', width: 390, height: 844 },
]

const pages = [
  { route: '/dashboard', name: 'dashboard' },
  { route: '/projects', name: 'projects' },
  { route: '/timelogs', name: 'timelogs' },
  { route: '/members', name: 'members' },
]

for (const size of sizes) {
  for (const pg of pages) {
    test(`${pg.name} at ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      await page.goto(`http://localhost:5173${pg.route}`)
      await page.waitForLoadState('networkidle')

      // No horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(scrollWidth).toBeLessThanOrEqual(size.width + 2)

      // Free Plan always visible
      await expect(page.getByText('Free Plan', { exact: true })).toBeVisible()

      await page.screenshot({ path: `tests/screenshots/${pg.name}-${size.name}.png` })
    })
  }
}

test('all sidebar links work', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')

  const links = [
    { label: 'Projects', route: '/projects' },
    { label: 'Time Logs', route: '/timelogs' },
    { label: 'Members', route: '/members' },
    { label: 'Dashboard', route: '/dashboard' },
  ]

  for (const { label, route } of links) {
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(route))
  }
})
