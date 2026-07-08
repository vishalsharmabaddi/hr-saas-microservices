import { test, expect } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

test('nudge button sends appreciation and shows Sent!', async ({ page }) => {
  const responses = []
  const failed = []

  page.on('response', res => {
    if (res.url().includes('/api/gamification')) {
      responses.push(`${res.status()} ${res.url()}`)
    }
  })
  page.on('requestfailed', req => {
    if (req.url().includes('/api/gamification')) {
      failed.push(`FAILED ${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
    }
  })

  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)

  await page.goto('http://localhost:5173/engagement')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  const nudgeBtnCount = await page.getByRole('button', { name: 'Nudge' }).count()
  console.log(`Nudge buttons found: ${nudgeBtnCount}`)
  if (nudgeBtnCount === 0) { console.log('No team data'); return }

  await page.getByRole('button', { name: 'Nudge' }).first().click()
  console.log('Clicked Nudge — waiting up to 15s for response...')

  // Wait for either Sent! to appear OR 15 seconds
  await Promise.race([
    page.getByRole('button', { name: 'Sent!' }).waitFor({ timeout: 15000 }).catch(() => null),
    new Promise(r => setTimeout(r, 15000)),
  ])

  console.log('--- API Responses ---')
  responses.forEach(r => console.log(' ', r))
  console.log('--- Failed ---')
  failed.forEach(r => console.log(' ', r))

  const sentCount = await page.getByRole('button', { name: 'Sent!' }).count()
  console.log(`Sent! visible: ${sentCount}`)

  await page.screenshot({ path: 'tests/screenshots/nudge-result.png' })

  expect(sentCount).toBe(1)
})
