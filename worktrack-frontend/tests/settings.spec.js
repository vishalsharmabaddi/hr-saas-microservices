import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

test('settings page — company create or edit', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)
  await page.evaluate(() => localStorage.setItem('wt_tourDone', 'true'))  // auto-tour off during test
  await page.goto('http://localhost:5173/settings')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // Section heading
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByText('Company', { exact: true })).toBeVisible()

  // Button text tells us create vs edit
  const createBtn = page.getByRole('button', { name: /Create Company/ })
  const saveBtn   = page.getByRole('button', { name: /Save Changes/ })
  const isCreate = await createBtn.count() > 0

  console.log(isCreate ? 'MODE: Create (no company yet)' : 'MODE: Edit (company exists)')

  // Fill name (required) and save
  await page.getByPlaceholder('e.g. WorkTrack Inc.').fill('WorkTrack Inc.')
  await page.getByPlaceholder('e.g. worktrack.com').fill('worktrack.com')

  await (isCreate ? createBtn : saveBtn).click()
  await page.waitForTimeout(1500)

  // Saved! confirmation
  const savedVisible = await page.getByRole('button', { name: /Saved!/ }).count()
  console.log('Saved! button visible:', savedVisible)

  // F2 — Departments section renders
  await expect(page.getByText('Departments', { exact: true })).toBeVisible()
  console.log('Departments section:', await page.getByText(/department.* total/).textContent())

  // F3 — Team & Roles section renders with OWNER row
  await expect(page.getByText('Team & Roles', { exact: true })).toBeVisible()
  await expect(page.getByText('OWNER')).toBeVisible()
  console.log('Team & Roles OWNER row visible: yes')

  await page.screenshot({ path: 'tests/screenshots/settings.png', fullPage: true })

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})
