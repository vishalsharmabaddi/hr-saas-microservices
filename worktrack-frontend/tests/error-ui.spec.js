import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

// 404: koi bhi anjaan URL blank page ki jagah "Page not found" dikhaye.
test('unknown URL shows the 404 page, not a blank screen', async ({ page }) => {
  await page.goto(`${BASE}/banana-not-a-real-page`)
  await expect(page.getByText('Page not found')).toBeVisible()
  await expect(page.getByRole('button', { name: /Go Home|Back to Dashboard/ })).toBeVisible()
})

// ErrorBoundary: /__crash route jaan-bujh ke render me throw karta hai (sirf dev me maujood).
// Boundary na ho to React puri app unmount kar deta aur body khaali reh jaati.
test('ErrorBoundary shows an error page when a page crashes while rendering', async ({ page }) => {
  await page.goto(`${BASE}/__crash`)

  await expect(page.getByText('Something went wrong')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload Page' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to Dashboard' })).toBeVisible()

  // Dev me technical details dikhni chahiye (production me nahi).
  await expect(page.getByText(/Intentional test crash/)).toBeVisible()
})
