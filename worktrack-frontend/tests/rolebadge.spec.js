import { test, expect } from '@playwright/test'
test('sidebar shows Member badge for employee role', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.evaluate(() => {
    localStorage.setItem('wt_user', JSON.stringify({ name: 'Adventure Pace', email: 'x@y.com', role: 'EMPLOYEE' }))
    localStorage.setItem('wt_tourDone', 'true')
  })
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')
  const sidebar = page.locator('aside')
  await expect(sidebar.getByText('Member', { exact: true })).toBeVisible()
  expect(await sidebar.getByText('Employee', { exact: true }).count()).toBe(0)
  console.log('Badge shows "Member", no "Employee": OK')
})
