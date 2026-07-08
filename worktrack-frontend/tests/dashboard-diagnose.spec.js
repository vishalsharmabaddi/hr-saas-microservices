import { test } from '@playwright/test'

const ADMIN_USER = {
  name: 'Vishal Kumar',
  email: 'vishalsharmabaddi@gmail.com',
  picture: null,
  role: 'ADMIN',
}

test('diagnose dashboard data', async ({ page }) => {
  const apiCalls = []

  // Capture every /api response: URL, status, and body
  page.on('response', async res => {
    const url = res.url()
    if (url.includes('/api/')) {
      let body = ''
      try {
        const text = await res.text()
        body = text.slice(0, 120)
      } catch { body = '<unreadable>' }
      apiCalls.push({ url: url.replace('http://localhost:5173', ''), status: res.status(), body })
    }
  })

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message))

  await page.goto('http://localhost:5173')
  await page.evaluate(user => localStorage.setItem('wt_user', JSON.stringify(user)), ADMIN_USER)
  await page.goto('http://localhost:5173/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)

  console.log('\n====== API CALLS FROM DASHBOARD ======')
  for (const c of apiCalls) {
    console.log(`[${c.status}] ${c.url}`)
    console.log(`       body: ${c.body}`)
  }
  console.log('======================================\n')

  // Read the actual rendered stat card numbers
  const cardValues = await page.evaluate(() => {
    const cards = []
    document.querySelectorAll('div').forEach(el => {
      const label = el.textContent?.trim()
      // Find stat cards by their label text
    })
    // Simpler: grab all big numbers
    const nums = []
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      if (parseInt(style.fontSize) >= 28 && el.children.length === 0) {
        nums.push(el.textContent.trim())
      }
    })
    return nums
  })
  console.log('Big numbers rendered on page:', cardValues)

  await page.screenshot({ path: 'tests/screenshots/dashboard-diagnose.png', fullPage: true })
})
