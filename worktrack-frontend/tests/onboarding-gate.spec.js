import { test, expect } from '@playwright/test'

const ADMIN = { name: 'New Admin', email: 'new@acme.com', role: 'ADMIN' }
const EMPLOYEE = { name: 'Emp', email: 'emp@acme.com', role: 'EMPLOYEE' }

// Helper: mock GET /api/companies to a given array
async function mockCompanies(page, arr) {
  await page.route('**/api/companies', route => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(arr) })
    } else route.continue()
  })
}

test('gate — new admin with NO company is redirected to onboarding', async ({ page }) => {
  await mockCompanies(page, [])
  await page.goto('http://localhost:5173')
  await page.evaluate(u => { localStorage.setItem('wt_user', JSON.stringify(u)); localStorage.removeItem('wt_onboarded') }, ADMIN)
  await page.goto('http://localhost:5173/dashboard')

  await page.waitForURL('**/onboarding')
  expect(page.url()).toContain('/onboarding')
  console.log('New admin redirected to onboarding: OK')
})

test('gate — onboarded admin stays on dashboard (flag short-circuits)', async ({ page }) => {
  await mockCompanies(page, [])                          // even with no company…
  await page.goto('http://localhost:5173')
  await page.evaluate(u => { localStorage.setItem('wt_user', JSON.stringify(u)); localStorage.setItem('wt_onboarded', 'true') }, ADMIN)
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForTimeout(1000)

  expect(page.url()).toContain('/dashboard')            // …flag keeps them here
  console.log('Onboarded admin stayed on dashboard: OK')
})

test('gate — admin WITH a company stays on dashboard', async ({ page }) => {
  await mockCompanies(page, [{ id: 1, name: 'WorkTrack Inc.' }])
  await page.goto('http://localhost:5173')
  await page.evaluate(u => { localStorage.setItem('wt_user', JSON.stringify(u)); localStorage.removeItem('wt_onboarded') }, ADMIN)
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForTimeout(1000)

  expect(page.url()).toContain('/dashboard')
  console.log('Admin with company stayed on dashboard: OK')
})

test('gate — non-admin never gets onboarding (goes straight to app)', async ({ page }) => {
  await mockCompanies(page, [])
  await page.goto('http://localhost:5173')
  await page.evaluate(u => { localStorage.setItem('wt_user', JSON.stringify(u)); localStorage.removeItem('wt_onboarded') }, EMPLOYEE)
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForTimeout(1000)

  expect(page.url()).toContain('/dashboard')
  console.log('Employee stayed on dashboard: OK')
})
