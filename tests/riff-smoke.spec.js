const { test, expect } = require('@playwright/test');

test('RIFF loads and shows the welcome screen', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));

  const response = await page.goto('/');
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator('#riffHome')).toBeVisible();
  await expect(page.locator('#startRiff')).toBeVisible();
  await expect(page.locator('#startRiff')).toHaveText('INICIAR');
  await expect(page.locator('#workspace')).toBeHidden();
  expect(pageErrors).toEqual([]);
});

test('INICIAR opens the RIFF workspace', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startRiff').click();
  await expect(page.locator('#riffHome')).toBeHidden();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#workspace .brand')).toContainText('RIFF STUDIO');
});

test('main editor controls are present and usable', async ({ page }) => {
  await page.goto('/');
  await page.locator('#startRiff').click();
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#prev')).toBeVisible();
  await expect(page.locator('#next')).toBeVisible();
  await expect(page.locator('#reset')).toBeVisible();
  await expect(page.locator('#timeline')).toBeVisible();
});
