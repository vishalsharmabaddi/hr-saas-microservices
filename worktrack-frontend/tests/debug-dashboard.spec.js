import { test } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

test('dashboard console errors', async ({ page }) => {
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message))

  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)

  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  console.log('=== Console Errors ===')
  errors.forEach(e => console.log(e))

  await page.screenshot({ path: 'tests/screenshots/dashboard-debug.png' })
})
