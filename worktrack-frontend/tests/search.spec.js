import { test, expect } from '@playwright/test'

const ADMIN = { name: 'Vishal Kumar', email: 'vishalsharmabaddi@gmail.com', role: 'ADMIN' }

// Deterministic data via API mocks
const PROJECTS = [
  { id: 7, name: 'Apollo Redesign', status: 'IN_PROGRESS' },
  { id: 8, name: 'Billing Revamp', status: 'ON_HOLD' },
]
const EMPLOYEES = [
  { id: 1, firstName: 'Aman', lastName: 'Verma', email: 'aman@acme.com', department: 'Engineering' },
  { id: 2, firstName: 'Riya', lastName: 'Singh', email: 'riya@acme.com', department: 'Sales' },
]

async function setup(page) {
  await page.route('**/api/projects', r => r.request().method() === 'GET'
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECTS) }) : r.continue())
  await page.route('**/api/employees', r => r.request().method() === 'GET'
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPLOYEES) }) : r.continue())
  await page.goto('http://localhost:5173')
  await page.evaluate(u => {
    localStorage.setItem('wt_user', JSON.stringify(u))
    localStorage.setItem('wt_tourDone', 'true')
    localStorage.setItem('wt_onboarded', 'true')
  }, ADMIN)
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')
}

test('global search — filters projects and people, navigates on click', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  await setup(page)

  await page.keyboard.press('Control+k')
  const input = page.getByPlaceholder('Search projects, people…')
  await expect(input).toBeVisible()
  // Scope all assertions to the search dialog (avoids sidebar clashes)
  const dialog = input.locator('xpath=ancestor::div[3]')

  // Query matching a project
  await input.fill('apollo')
  await expect(dialog.getByText('Apollo Redesign')).toBeVisible()
  await expect(dialog.getByText('Billing Revamp')).toHaveCount(0)
  console.log('Project filter works')

  // Query matching a person (by department)
  await input.fill('engineering')
  await expect(dialog.getByText('Aman Verma')).toBeVisible()
  console.log('People filter works')

  // No match
  await input.fill('zzznope')
  await expect(page.getByText(/No results for/)).toBeVisible()
  console.log('No-results state works')

  await input.fill('apollo')
  await page.screenshot({ path: 'tests/screenshots/search-results.png', fullPage: true })

  // Click a project result → navigate to detail
  await page.getByText('Apollo Redesign').click()
  await page.waitForURL('**/projects/7')
  console.log('Clicked project → navigated to /projects/7')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})

test('global search — keyboard: arrows move highlight, Enter opens', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  await setup(page)

  await page.keyboard.press('Control+k')
  const input = page.getByPlaceholder('Search projects, people…')
  await expect(input).toBeVisible()

  // 'a' matches both projects (index 0=Apollo/7, 1=Billing/8) then people
  await input.fill('a')
  await expect(input.locator('xpath=ancestor::div[3]').getByText('Apollo Redesign')).toBeVisible()

  // ArrowDown once → second item (Billing /projects/8), Enter opens it
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForURL('**/projects/8')
  console.log('ArrowDown + Enter opened second result (/projects/8)')

  // Reopen → ArrowUp wraps to last item (a person → /employees)
  await page.keyboard.press('Control+k')
  await input.fill('a')
  await page.keyboard.press('ArrowUp')      // wrap to last
  await page.keyboard.press('Enter')
  await page.waitForURL('**/employees')
  console.log('ArrowUp wrap + Enter opened last result (/employees)')

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})
