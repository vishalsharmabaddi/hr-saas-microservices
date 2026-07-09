import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

// New user login → tour should AUTO-START on first visit
test('product tour — auto-starts for a new user', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)
  // NOTE: wt_tourDone NOT set → simulate a brand-new user
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')

  // Tour auto-appears (700ms delay in code)
  await expect(page.locator('.driver-popover-title')).toContainText('Welcome to WorkTrack', { timeout: 4000 })
  const progress = await page.locator('.driver-popover-progress-text').textContent()
  console.log('Auto-start step 1:', await page.locator('.driver-popover-title').textContent(), '|', progress)

  // More than the old 3 steps now (admin sees the full set)
  const total = parseInt(progress.match(/of (\d+)/)[1], 10)
  console.log('Total steps for ADMIN:', total)
  expect(total).toBeGreaterThan(8)

  // Text must be English only — no Devanagari characters anywhere in popover
  const desc = await page.locator('.driver-popover-description').textContent()
  expect(desc).not.toMatch(/[ऀ-ॿ]/)   // Hindi unicode range
  await page.screenshot({ path: 'tests/screenshots/tour-auto.png', fullPage: true })

  // Close tour → flag should persist
  await page.locator('.driver-popover-close-btn').click()
  await expect(page.locator('.driver-popover')).toHaveCount(0)
  const flag = await page.evaluate(() => localStorage.getItem('wt_tourDone'))
  console.log('wt_tourDone after close:', flag)
  expect(flag).toBe('true')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})

// Returning user → no auto-start, but floating button re-launches tour
test('product tour — floating button relaunches for returning user', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)
  await page.evaluate(() => localStorage.setItem('wt_tourDone', 'true'))  // already seen
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)

  // No auto tour this time
  expect(await page.locator('.driver-popover').count()).toBe(0)
  console.log('No auto-tour for returning user: correct')

  // Floating "Take a tour" button visible → click launches tour
  const fab = page.getByRole('button', { name: 'Take a tour' })
  await expect(fab).toBeVisible()
  await fab.click()
  await expect(page.locator('.driver-popover-title')).toContainText('Welcome to WorkTrack')
  console.log('Floating button relaunched tour: OK')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})
