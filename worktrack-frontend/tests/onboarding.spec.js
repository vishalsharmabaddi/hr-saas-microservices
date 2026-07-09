import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

test('onboarding wizard — full flow: welcome → company → invite → finish', async ({ page }) => {
  const errors = []
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:5173')
  await page.evaluate(user => {
    localStorage.setItem('wt_user', JSON.stringify(user))
    localStorage.removeItem('wt_members')   // clean slate for invites
    localStorage.removeItem('wt_onboarded')
  }, ADMIN_USER)
  await page.goto('http://localhost:5173/onboarding')
  await page.waitForLoadState('networkidle')

  // Step 1 — Welcome
  await expect(page.getByRole('heading', { name: 'Welcome to WorkTrack' })).toBeVisible()
  await expect(page.getByText('Step 1 of 3')).toBeVisible()
  await page.getByRole('button', { name: /Continue/ }).click()

  // Step 2 — Company (fill + save)
  await expect(page.getByText('Step 2 of 3')).toBeVisible()
  await page.getByPlaceholder('e.g. WorkTrack Inc.').fill('WorkTrack Inc.')
  await page.getByPlaceholder('e.g. worktrack.com').fill('worktrack.com')
  await page.getByRole('button', { name: /Continue/ }).click()

  // Step 3 — Invite (company saved → advanced)
  await expect(page.getByText('Step 3 of 3')).toBeVisible()
  await expect(page.getByText('No invites added yet', { exact: false })).toBeVisible()

  // Add two invites
  await page.getByPlaceholder('teammate@company.com').fill('manager@acme.com')
  await page.locator('select').selectOption('MANAGER')
  await page.getByRole('button', { name: 'Add' }).click()

  await page.getByPlaceholder('teammate@company.com').fill('member@acme.com')
  await page.getByRole('button', { name: 'Add' }).click()

  await expect(page.getByText('manager@acme.com')).toBeVisible()
  await expect(page.getByText('member@acme.com')).toBeVisible()
  console.log('Two invites added')

  // Remove one — X button inside the row containing that email
  await page.getByText('member@acme.com').locator('..').getByRole('button').click()
  await expect(page.getByText('member@acme.com')).toHaveCount(0)
  console.log('One invite removed')

  await page.screenshot({ path: 'tests/screenshots/onboarding-invite.png', fullPage: true })

  // Finish → dashboard
  await page.getByRole('button', { name: /Finish/ }).click()
  await page.waitForURL('**/dashboard')
  console.log('Redirected to dashboard after Finish')

  // Verify persisted state
  const state = await page.evaluate(() => ({
    onboarded: localStorage.getItem('wt_onboarded'),
    members: JSON.parse(localStorage.getItem('wt_members') || '[]'),
  }))
  console.log('wt_onboarded:', state.onboarded)
  console.log('members saved:', state.members.map(m => `${m.email}=${m.role}`).join(', '))
  expect(state.onboarded).toBe('true')
  expect(state.members.find(m => m.email === 'manager@acme.com')?.role).toBe('MANAGER')
  expect(state.members.find(m => m.email === 'member@acme.com')).toBeFalsy()  // was removed

  console.log('Page errors:', errors.length ? errors : 'NONE')
  expect(errors.length).toBe(0)
})
