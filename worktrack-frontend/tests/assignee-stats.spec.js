import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

// The Members tab shows a per-member workload badge from the assignee-stats endpoint.
test('Members tab shows per-assignee workload badge', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (!path.startsWith('/api/')) return route.continue()
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path.endsWith('/api/projects/1'))
      return json({ id: 1, name: 'Demo Project', status: 'IN_PROGRESS', type: 'INTERNAL', billingType: 'FIXED' })
    if (path.endsWith('/api/projects/1/tasklists')) return json([{ id: 10, name: 'Backlog' }])
    if (path.endsWith('/api/tasks/tasklist/10')) return json([])
    if (path.endsWith('/api/projects/1/members'))
      return json([{ id: 1, employeeId: 2, name: 'Rahul Sharma', email: 'rahul@gmail.com', role: 'TEAM_MEMBER', joinedAt: new Date().toISOString() }])
    if (path.endsWith('/api/tasks/analytics/assignees/1'))
      return json([{ employeeId: 2, name: 'Rahul Sharma', email: 'rahul@gmail.com', totalTasks: 3, completedTasks: 1 }])
    if (path.endsWith('/api/employees')) return json([])
    return method === 'GET' ? json([]) : json({})
  })

  await page.goto('http://localhost:5173')
  await page.evaluate(user => {
    localStorage.setItem('wt_user', JSON.stringify(user))
    localStorage.setItem('wt_onboarded', 'true')
    localStorage.setItem('wt_tourDone', 'true')   // suppress the product tour overlay
  }, ADMIN_USER)

  await page.goto('http://localhost:5173/projects/1')
  await page.getByText(/Members \(/).click()

  await expect(page.getByText('Rahul Sharma')).toBeVisible()
  await expect(page.getByText('1/3 done')).toBeVisible()
})
