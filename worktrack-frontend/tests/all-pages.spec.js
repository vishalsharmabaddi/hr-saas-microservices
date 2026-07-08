import { test } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

const PAGES = [
  '/dashboard',
  '/projects',
  '/timelogs',
  '/attendance',
  '/leaves',
  '/employees',
  '/members',
  '/engagement',
  '/progress',
  '/notifications',
]

test('all pages load without crash', async ({ page }) => {
  const results = []

  for (const route of PAGES) {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('http://localhost:5173')
    await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)
    await page.goto(`http://localhost:5173${route}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await page.screenshot({ path: `tests/screenshots/page${route.replace('/', '-')}.png` })

    // Check if page is blank (body has no visible content)
    const bodyText = await page.evaluate(() => document.body.innerText.trim())
    const isBlank = bodyText.length < 20

    results.push({
      route,
      errors: errors.slice(),
      isBlank,
      preview: bodyText.slice(0, 60),
    })

    // Remove listener for next iteration
    page.removeAllListeners('pageerror')
  }

  console.log('\n====== PAGE TEST RESULTS ======')
  for (const r of results) {
    const status = r.errors.length === 0 && !r.isBlank ? '✅' : '❌'
    console.log(`${status} ${r.route}`)
    if (r.errors.length > 0) r.errors.forEach(e => console.log(`   ERROR: ${e}`))
    if (r.isBlank) console.log(`   BLANK PAGE (text: "${r.preview}")`)
  }
  console.log('================================\n')
})
