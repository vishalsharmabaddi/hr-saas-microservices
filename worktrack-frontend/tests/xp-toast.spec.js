import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

// Verifies the XP toast pops up after logging time on a task.
// Tests run without a real JWT, so every /api/** call is mocked here.
test('logging time shows the XP Earned toast', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    // Only mock real backend calls (proxied at /api). Let Vite modules like
    // /src/api/axios.js load normally, otherwise the app never boots.
    if (!path.startsWith('/api/')) return route.continue()
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path.endsWith('/api/projects/1'))
      return json({ id: 1, name: 'Demo Project', status: 'IN_PROGRESS', type: 'INTERNAL', billingType: 'FIXED', description: '', startDate: null, endDate: null })
    if (path.endsWith('/api/projects/1/tasklists'))
      return json([{ id: 10, name: 'Backlog' }])
    if (path.endsWith('/api/tasks/tasklist/10'))
      return json([{ id: 100, title: 'Build login page', description: '', priority: 'MEDIUM', status: 'OPEN', dueDate: null }])
    if (path.endsWith('/api/projects/1/members'))
      return json([])
    if (path.endsWith('/api/timelogs') && method === 'POST')
      return json({ id: 1, taskId: 100, employeeId: 1, logDate: '2026-07-23', hoursLogged: 2, notes: null, createdAt: new Date().toISOString() })
    if (path.endsWith('/api/gamification/summary'))
      return json({ totalXp: 30, currentStreak: 3, level: 'REGULAR' })

    // Sensible defaults for everything else Layout may call.
    return method === 'GET' ? json([]) : json({})
  })

  await page.goto('http://localhost:5173')
  await page.evaluate(user => {
    localStorage.setItem('wt_user', JSON.stringify(user))
    localStorage.setItem('wt_onboarded', 'true')   // skip the new-admin onboarding gate
  }, ADMIN_USER)

  await page.goto('http://localhost:5173/projects/1')
  await expect(page.getByText('Build login page')).toBeVisible()

  // Row action buttons are hover-revealed (opacity:0). Force them visible so the
  // click is a real, actionable click that fires the React onClick handler.
  await page.addStyleTag({ content: '.task-actions{opacity:1 !important}' })

  // Open the inline "Log time" form.
  await page.getByTitle('Log time').first().click()

  // Fill hours and save.
  await page.getByPlaceholder('e.g. 2').fill('2')
  await page.getByRole('button', { name: 'Save' }).click()

  // Toast appears after the ~600ms Kafka-settle delay. Today's date → on-time → +10.
  await expect(page.getByText('XP Earned!')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('+10')).toBeVisible()
  await expect(page.getByText(/Streak: 3 days/)).toBeVisible()

  await page.screenshot({ path: 'tests/screenshots/xp-toast.png' })
})
