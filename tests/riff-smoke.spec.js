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

test('video framing control switches between fill and fit', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await page.goto('/');
  await page.locator('#startRiff').click();
  const zone = page.locator('.videoDropZone');
  const selector = page.locator('.videoFitMode');
  await expect(zone).toHaveClass(/fitCover/);
  await selector.selectOption('contain');
  await expect(zone).toHaveClass(/fitContain/);
  await expect(page.locator('.videoDropZone video')).toHaveCSS('object-fit', 'contain');
  await selector.selectOption('cover');
  await expect(zone).toHaveClass(/fitCover/);
  await expect(page.locator('.videoDropZone video')).toHaveCSS('object-fit', 'cover');
  expect(pageErrors).toEqual([]);
});

test('timeline is moved outside the main editor layout without DOM errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await page.goto('/');
  await page.locator('#startRiff').click();
  const timeline = page.locator('#timeline');
  await expect(timeline).toBeVisible();
  expect(await timeline.evaluate(el => el.parentElement !== document.querySelector('#workspace .stage'))).toBeTruthy();
  await expect(timeline).toHaveClass(/timelineEditor/);
  expect(pageErrors).toEqual([]);
});


test('video upload populates preview, media bin and timeline', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await page.goto('/');
  await page.locator('#startRiff').click();
  const picker = page.locator('#videoFilePicker');
  await picker.setInputFiles({
    name: 'riff-test-video.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('RIFF-test-video-fixture')
  });
  const video = page.locator('.videoDropZone video');
  await expect(video).toBeAttached();
  await expect(video).toHaveAttribute('controls', '');
  await expect(page.locator('.videoDropZone')).toHaveClass(/hasVideo/);
  await expect(page.locator('#selectedFile')).toContainText('riff-test-video.mp4');
  await expect(page.locator('.videoImportedItem .videoName')).toHaveText('riff-test-video.mp4');
  await expect(page.locator('#timeline .videoClip')).toContainText('riff-test-video.mp4');
  expect(await video.evaluate(el => el.src.startsWith('blob:'))).toBeTruthy();
  expect(pageErrors).toEqual([]);
});


test('drag and drop imports a video and replacing it updates the existing media and timeline clip', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await page.goto('/');
  await page.locator('#startRiff').click();
  const zone = page.locator('.videoDropZone');
  await zone.evaluate(el => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['video-fixture'], 'primera-toma.webm', { type: 'video/webm' }));
    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
    el.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
  });
  await expect(zone).toHaveClass(/hasVideo/);
  await expect(page.locator('.videoImportedItem .videoName')).toHaveText('primera-toma.webm');
  await expect(page.locator('#timeline .videoClip')).toContainText('primera-toma.webm');
  const picker = page.locator('#videoFilePicker');
  await picker.setInputFiles({ name: 'segunda-toma.webm', mimeType: 'video/webm', buffer: Buffer.from('fixture-two') });
  await expect(page.locator('.videoImportedItem .videoName')).toHaveText('segunda-toma.webm');
  await expect(page.locator('#timeline .videoClip')).toContainText('segunda-toma.webm');
  await expect(page.locator('.videoImportedItem')).toHaveCount(1);
  await expect(page.locator('#timeline .videoClip')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});
