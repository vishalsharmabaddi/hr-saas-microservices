import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

// Adding a member via the real employee dropdown shows the employee's real name.
test('Add Member dropdown adds a real employee by name', async ({ page }) => {
  const members = []   // stateful: POST pushes, GET returns

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
    if (path.endsWith('/api/employees'))
      return json([
        { id: 2, fullName: 'Rahul Sharma', email: 'rahul@gmail.com', designation: 'SEO specialist' },
        { id: 3, fullName: 'Rohit Sharma', email: 'rohit@gmail.com', designation: 'Web developer' },
      ])
    if (path.endsWith('/api/projects/1/members')) {
      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}')
        members.push({ id: members.length + 1, employeeId: body.employeeId, email: body.email, name: body.name, role: body.role, joinedAt: new Date().toISOString() })
        return json(members[members.length - 1], 201)
      }
      return json(members)
    }
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

  await page.getByRole('button', { name: 'Add Member' }).click()
  await page.locator('select').selectOption('2')
  await page.getByRole('button', { name: 'Add', exact: true }).click()

  await expect(page.getByText('Rahul Sharma')).toBeVisible()
})
