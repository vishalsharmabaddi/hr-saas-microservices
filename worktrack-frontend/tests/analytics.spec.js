import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

test('analytics page loads with leave pie chart', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)
  await page.goto('http://localhost:5173/analytics')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'tests/screenshots/analytics.png', fullPage: true })

  // Heading dikhna chahiye
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()

  // "Leaves by Type" card ka title
  await expect(page.getByText('Leaves by Type')).toBeVisible()

  // Recharts ek <svg> render karta hai — chart present hai ya "No leave data"
  const svgCount = await page.locator('svg.recharts-surface').count()
  const noData = await page.getByText('No leave data yet').count()
  console.log(`Recharts SVG count: ${svgCount}, No-data msg: ${noData}`)

  // Sidebar mein Analytics link
  const navLink = await page.getByText('Analytics').count()
  console.log(`"Analytics" text occurrences: ${navLink}`)

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})
