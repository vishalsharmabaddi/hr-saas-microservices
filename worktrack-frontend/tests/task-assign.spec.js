import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

// A manager assigns a project member to a task; the assignee chip appears on the row.
test('Assign a member to a task shows an assignee chip', async ({ page }) => {
  // Stateful task — PUT /assignees mutates its assignees, GET returns the current state.
  const task = { id: 100, taskListId: 10, title: 'Design homepage', status: 'OPEN', priority: 'MEDIUM', assignees: [] }

  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (!path.startsWith('/api/')) return route.continue()
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (path.endsWith('/api/projects/1'))
      return json({ id: 1, name: 'Demo Project', status: 'IN_PROGRESS', type: 'INTERNAL', billingType: 'FIXED' })
    if (path.endsWith('/api/projects/1/tasklists')) return json([{ id: 10, name: 'Backlog' }])
    if (path.endsWith('/api/tasks/tasklist/10')) return json([task])
    if (path.endsWith('/api/projects/1/members'))
      return json([
        { id: 1, employeeId: 2, name: 'Rahul Sharma', email: 'rahul@gmail.com', role: 'TEAM_MEMBER' },
        { id: 2, employeeId: 3, name: 'Rohit Sharma', email: 'rohit@gmail.com', role: 'TEAM_MEMBER' },
      ])
    if (path.endsWith('/api/tasks/100/assignees') && method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}')
      task.assignees = body.assignees
      return json(task)
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
  // Hover-revealed row actions — force them visible so the assign button is clickable.
  await page.addStyleTag({ content: '.task-actions{opacity:1 !important}' })

  await page.getByText('Design homepage').waitFor()
  await page.getByTitle('Assign members').click()
  await page.getByRole('button', { name: 'Rahul Sharma' }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()

  // The assignee chip carries the member's name as its title attribute.
  await expect(page.getByTitle('Rahul Sharma')).toBeVisible()
})
