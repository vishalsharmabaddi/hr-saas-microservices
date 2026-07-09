import { test, expect } from '@playwright/test'

const ADMIN = { name: 'Vishal Kumar', email: 'vishalsharmabaddi@gmail.com', role: 'ADMIN' }
const EMPLOYEE = { name: 'Emp User', email: 'emp@acme.com', role: 'EMPLOYEE' }

async function login(page, user) {
  await page.goto('http://localhost:5173')
  await page.evaluate(u => {
    localStorage.setItem('wt_user', JSON.stringify(u))
    localStorage.setItem('wt_tourDone', 'true')
    localStorage.setItem('wt_onboarded', 'true')
  }, user)
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')
}

test('settings lives in profile menu (admin), not the sidebar', async ({ page }) => {
  await login(page, ADMIN)

  // Sidebar should NOT have a Settings nav link anymore
  expect(await page.locator('aside').getByText('Settings', { exact: true }).count()).toBe(0)
  console.log('No Settings in sidebar: OK')

  // Open profile menu → Settings visible → navigates to /settings
  await page.getByRole('button', { name: /Vishal Kumar/ }).click()
  const settingsItem = page.getByRole('button', { name: 'Settings' })
  await expect(settingsItem).toBeVisible()
  await settingsItem.click()
  await page.waitForURL('**/settings')
  console.log('Profile menu → Settings opened /settings: OK')
})

test('non-admin has no Settings option in profile menu', async ({ page }) => {
  await login(page, EMPLOYEE)
  await page.getByRole('button', { name: /Emp User/ }).click()
  expect(await page.getByRole('button', { name: 'Settings' }).count()).toBe(0)
  console.log('Employee has no Settings option: OK')
})
