import { test, expect } from '@playwright/test'

const USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'EMPLOYEE',
}

// The global My Tasks page lists assigned tasks grouped by project.
test('My Tasks page shows assigned tasks grouped by project', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (!path.startsWith('/api/')) return route.continue()
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path.endsWith('/api/tasks/assigned/me'))
      return json([
        { id: 1, title: 'Design homepage', projectId: 1, projectName: 'Website Revamp', priority: 'HIGH', status: 'OPEN', assignees: [] },
        { id: 2, title: 'Fix login bug', projectId: 2, projectName: 'Mobile App', priority: 'CRITICAL', status: 'OPEN', assignees: [] },
      ])
    return method === 'GET' ? json([]) : json({})
  })

  await page.goto('http://localhost:5173')
  await page.evaluate(user => {
    localStorage.setItem('wt_user', JSON.stringify(user))
    localStorage.setItem('wt_onboarded', 'true')
    localStorage.setItem('wt_tourDone', 'true')   // suppress the product tour overlay
  }, USER)

  await page.goto('http://localhost:5173/my-tasks')

  await expect(page.getByText('Website Revamp')).toBeVisible()
  await expect(page.getByText('Mobile App')).toBeVisible()
  await expect(page.getByText('Design homepage')).toBeVisible()
  await expect(page.getByText('Fix login bug')).toBeVisible()
})
