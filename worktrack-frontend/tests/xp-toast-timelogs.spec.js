import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

// Verifies the XP toast pops up after logging time from the Time Logs page modal.
test('logging time from Time Logs page shows the XP Earned toast', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (!path.startsWith('/api/')) return route.continue()   // let Vite modules load
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path.endsWith('/api/projects'))
      return json([{ id: 1, name: 'Demo Project', status: 'IN_PROGRESS' }])
    if (path.endsWith('/api/projects/1/tasklists'))
      return json([{ id: 10, name: 'Backlog' }])
    if (path.endsWith('/api/tasks/tasklist/10'))
      return json([{ id: 100, title: 'Build login page' }])
    if (path.endsWith('/api/timelogs') && method === 'POST')
      return json({ id: 1, taskId: 100, employeeId: 1, logDate: '2026-07-23', hoursLogged: 2, notes: '', createdAt: new Date().toISOString() })
    if (path.endsWith('/api/gamification/summary'))
      return json({ totalXp: 30, currentStreak: 3, level: 'REGULAR' })

    return method === 'GET' ? json([]) : json({})
  })

  await page.goto('http://localhost:5173')
  await page.evaluate(user => {
    localStorage.setItem('wt_user', JSON.stringify(user))
    localStorage.setItem('wt_onboarded', 'true')
  }, ADMIN_USER)

  await page.goto('http://localhost:5173/timelogs')

  // Open the Log Time modal (header button — only one on the page yet).
  await page.getByRole('button', { name: 'Log Time' }).click()

  // Pick project → task (task select needs the tasks query to resolve), then hours.
  await page.locator('select').nth(0).selectOption('1')
  await expect(page.locator('select').nth(1)).toBeVisible()
  await page.locator('select').nth(1).selectOption('100')
  await page.getByPlaceholder('e.g. 2.5').fill('2')

  // The modal renders before the header in the DOM, so its submit is .first().
  await page.getByRole('button', { name: 'Log Time' }).first().click()

  // Toast appears after the ~600ms Kafka-settle delay. Today's date → on-time → +10.
  await expect(page.getByText('XP Earned!')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('+10')).toBeVisible()

  await page.screenshot({ path: 'tests/screenshots/xp-toast-timelogs.png' })
})
