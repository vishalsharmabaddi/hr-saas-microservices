import { test, expect } from '@playwright/test'

const OWNER    = { name: 'Vishal Kumar', email: 'vishalsharmabaddi@gmail.com', role: 'ADMIN' }
const NON_OWNER = { name: 'Some Admin',  email: 'admin@acme.com',            role: 'ADMIN' }

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

test('platform owner sees Platform Console entry and can open it', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  await login(page, OWNER)

  await page.getByRole('button', { name: /Vishal Kumar/ }).click()
  const entry = page.getByRole('button', { name: 'Platform Console' })
  await expect(entry).toBeVisible()
  await entry.click()

  await page.waitForURL('**/platform')
  await expect(page.getByText('Platform Console')).toBeVisible()
  await expect(page.getByText('Manage every company using WorkTrack from here.')).toBeVisible()
  console.log('Owner opened /platform: OK')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})

test('platform overview shows stat cards from demo data', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  await login(page, OWNER)
  await page.goto('http://localhost:5173/platform')
  await page.waitForLoadState('networkidle')

  // Deterministic seed: 6 companies, 67 users, MRR ₹12,700 (active only), 4 paid
  await expect(page.getByText('Companies', { exact: true })).toBeVisible()
  await expect(page.getByText('6', { exact: true })).toBeVisible()
  await expect(page.getByText('67', { exact: true })).toBeVisible()
  await expect(page.getByText('₹12,700')).toBeVisible()
  await expect(page.getByText('Plan breakdown')).toBeVisible()
  console.log('Stat cards + plan breakdown render: OK')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})

test('companies table: activating a suspended tenant updates MRR + status', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  await login(page, OWNER)
  await page.goto('http://localhost:5173/platform')
  await page.waitForLoadState('networkidle')

  // Umbrella Ltd is seeded as suspended (BUSINESS ₹7,900, excluded from MRR)
  await expect(page.getByText('₹12,700')).toBeVisible()
  const umbrellaRow = page.getByRole('row', { name: /Umbrella Ltd/ })
  await expect(umbrellaRow.getByText('Suspended')).toBeVisible()

  // Activate it → MRR jumps by 7,900 → ₹20,600, status flips to Active
  await umbrellaRow.getByRole('button', { name: /Activate/ }).click()
  await expect(umbrellaRow.getByText('Active')).toBeVisible()
  await expect(page.getByText('₹20,600')).toBeVisible()
  console.log('Activate → status flip + MRR recompute: OK')

  // Persist check — reload keeps it active (localStorage saved)
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('₹20,600')).toBeVisible()
  console.log('Persisted across reload: OK')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})

test('search + status filter narrow the table', async ({ page }) => {
  await login(page, OWNER)
  await page.goto('http://localhost:5173/platform')
  await page.waitForLoadState('networkidle')

  // Search by name → only Acme row remains
  await page.getByPlaceholder('Search companies…').fill('acme')
  await expect(page.getByRole('row', { name: /Acme Corp/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Globex/ })).toHaveCount(0)
  console.log('Search filter works')

  // Clear + status filter "suspended" → only Umbrella
  await page.getByPlaceholder('Search companies…').fill('')
  await page.getByRole('button', { name: 'suspended', exact: true }).click()
  await expect(page.getByRole('row', { name: /Umbrella Ltd/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Acme Corp/ })).toHaveCount(0)
  console.log('Status filter works')
})

test('row click opens detail drawer; changing plan updates MRR', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  await login(page, OWNER)
  await page.goto('http://localhost:5173/platform')
  await page.waitForLoadState('networkidle')

  await expect(page.getByText('₹12,700')).toBeVisible()

  // Click Globex row (FREE, active) → drawer opens
  await page.getByRole('row', { name: /Globex/ }).click()
  const drawer = page.getByText('MRR contribution').locator('xpath=ancestor::div[2]')
  await expect(page.getByText('MRR contribution')).toBeVisible()

  // Change Globex FREE → BUSINESS (₹7,900) → MRR 12,700 + 7,900 = ₹20,600
  await page.locator('select').selectOption('BUSINESS')
  await expect(page.getByText('₹20,600')).toBeVisible()
  console.log('Plan change → MRR recompute: OK')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})

test('non-owner has no entry and is blocked from /platform', async ({ page }) => {
  await login(page, NON_OWNER)

  // No entry in profile menu
  await page.getByRole('button', { name: /Some Admin/ }).click()
  expect(await page.getByRole('button', { name: 'Platform Console' }).count()).toBe(0)
  console.log('Non-owner has no Platform Console entry: OK')

  // Direct URL is blocked → redirected back to dashboard
  await page.goto('http://localhost:5173/platform')
  await page.waitForURL('**/dashboard')
  console.log('Non-owner redirected away from /platform: OK')
})
