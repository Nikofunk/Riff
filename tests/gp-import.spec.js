const { test, expect } = require('@playwright/test');

test('real Guitar Pro fixture imports and renders through the tab manager', async ({ page }) => {
  const pageErrors = [];
  const browserLogs = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  page.on('console', msg => browserLogs.push(msg.type()+': '+msg.text()));

  await page.goto('./');
  await page.locator('#startRiff').click();

  // Reuse RIFF's embedded, known-valid Guitar Pro demo bytes as a real file fixture.
  const fixtureBase64 = await page.evaluate(() => {
    const scripts = [...document.scripts].map(s => s.textContent || '').join('\n');
    const match = scripts.match(/const sampleBase64\s*=\s*'([^']+)'/);
    if (!match) throw new Error('Could not locate embedded Guitar Pro fixture');
    return match[1];
  });
  const fixture = Buffer.from(fixtureBase64, 'base64');

  await page.locator('.tabManager .addTabButton').click();
  const picker = page.locator('#gpTabFilePicker');
  await picker.setInputFiles({
    name: 'riff-real-import-fixture.gpx',
    mimeType: 'application/octet-stream',
    buffer: fixture
  });

  await expect(page.locator('.tabItem.active .tabItemName')).toHaveText('riff-real-import-fixture.gpx');
  await expect(page.locator('#selectedFile')).toContainText('riff-real-import-fixture.gpx');

  // AlphaTab's visible SVG is the source of truth for the imported notation.
  await expect(page.locator('html')).toHaveAttribute('data-riff-imported-score', 'true', { timeout: 30000 });
  await expect(page.locator('#alphaTabEngine.active svg').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#alphaTabEngine.active svg').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#timeline .gpTabClip')).toContainText('riff-real-import-fixture.gpx');

  expect(pageErrors, 'Browser page errors: ' + JSON.stringify(pageErrors) + '\nConsole: ' + browserLogs.join('\n')).toEqual([]);
});
