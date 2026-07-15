import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

// An unknown URL must render the 404 page rather than a blank screen.
test('unknown URL shows the 404 page, not a blank screen', async ({ page }) => {
  await page.goto(`${BASE}/reports/archived-2019`)
  await expect(page.getByText('404')).toBeVisible()
  await expect(page.getByText('Page not found')).toBeVisible()
  await expect(page.getByRole('button', { name: /Go Home|Back to Dashboard/ })).toBeVisible()
})

// /__crash throws during render (development only). Without a boundary React would
// unmount the whole tree and leave the body empty.
test('ErrorBoundary shows an error page when a page crashes while rendering', async ({ page }) => {
  await page.goto(`${BASE}/__crash`)

  await expect(page.getByText('Something went wrong')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload Page' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to Dashboard' })).toBeVisible()

  // Stack trace is expected in development, and must not ship to production.
  await expect(page.getByText(/Intentional test crash/)).toBeVisible()
})
