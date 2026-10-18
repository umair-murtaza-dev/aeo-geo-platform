import { expect, test } from '@playwright/test';

test('home and login render the foundation without sample metrics', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AEO/GEO platform');
  await expect(page.getByText(/no sample metrics/i)).toBeVisible();
  await page.getByRole('link', { name: 'Log in' }).first().click();
  const loginForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Continue' }) });
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  await expect(loginForm.getByLabel('Email')).toBeVisible();
  await expect(loginForm.getByLabel('Password')).toBeVisible();
});

test('unknown routes show the not-found page', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
