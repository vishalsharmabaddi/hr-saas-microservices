import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

test('engagement page shows real employee names', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)

  await page.goto('http://localhost:5173/engagement')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'tests/screenshots/engagement-names.png' })

  // "Employee #1" nahi dikhna chahiye agar real naam hai
  const hasEmployeeHash = await page.getByText(/^Employee #\d+$/).count()
  console.log(`"Employee #N" text count: ${hasEmployeeHash}`)

  // Check what names are showing
  const rows = await page.locator('[style*="fontWeight: 600"][style*="color: rgb(15, 23, 42)"]').allTextContents()
  console.log('Names visible:', rows.slice(0, 5))
})
