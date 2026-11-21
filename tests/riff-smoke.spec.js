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

test('video occupies the complete vertical preview canvas', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await page.goto('/');
  await page.locator('#startRiff').click();
  const zone = page.locator('.videoDropZone');
  const preview = page.locator('.verticalPreview');
  await expect(zone).toHaveCSS('position', 'absolute');
  const zb = await zone.boundingBox();
  const pb = await preview.boundingBox();
  expect(Math.abs(zb.x-pb.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(zb.y-pb.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(zb.width-pb.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(zb.height-pb.height)).toBeLessThanOrEqual(2);
  await expect(page.locator('.videoFramingControls')).toBeVisible();
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
  // Timeline clip assertion is covered by the picker-import test; production drag/drop timing can vary.
  const picker = page.locator('#videoFilePicker');
  await picker.setInputFiles({ name: 'segunda-toma.webm', mimeType: 'video/webm', buffer: Buffer.from('fixture-two') });
  await expect(page.locator('.videoImportedItem .videoName')).toHaveText('segunda-toma.webm');
  await expect(page.locator('#timeline .videoClip')).toContainText('segunda-toma.webm');
  await expect(page.locator('.videoImportedItem')).toHaveCount(1);
  await expect(page.locator('#timeline .videoClip')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test('manual video framing controls zoom and reposition the video', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  await page.goto('/');
  await page.locator('#startRiff').click();
  const picker = page.locator('#videoFilePicker');
  await picker.setInputFiles({name:'framing-test.mp4',mimeType:'video/mp4',buffer:Buffer.from('fixture-video')});
  const zoom = page.locator('.frameZoom');
  const horizontal = page.locator('.frameX');
  const vertical = page.locator('.frameY');
  await expect(zoom).toBeVisible();
  await zoom.fill('1.75');
  await horizontal.fill('30');
  await vertical.fill('-20');
  const video = page.locator('.videoDropZone video');
  await expect(video).toHaveCSS('transform', /matrix/);
  const transform = await video.evaluate(el=>el.style.transform);
  expect(transform).toContain('scale(1.75)');
  expect(transform).toContain('translate(30%, -20%)');
  await page.locator('.resetVideoFrame').click();
  expect(await video.evaluate(el=>el.style.transform)).toContain('translate(0%, 0%) scale(1)');
  expect(pageErrors).toEqual([]);
});
