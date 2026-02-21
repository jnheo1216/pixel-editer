import { expect, test } from '@playwright/test';

test('pixel editor smoke flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Pixel Editer')).toBeVisible();

  const canvasSurface = page.getByTestId('canvas-surface');
  const bounds = await canvasSurface.boundingBox();
  expect(bounds).not.toBeNull();

  if (bounds) {
    await page.mouse.move(bounds.x + 88, bounds.y + 88);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 140, bounds.y + 120);
    await page.mouse.up();
  }

  await page.getByRole('button', { name: '+ 레이어' }).click();
  await expect(page.getByText('레이어 2')).toBeVisible();

  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+z`);
  await page.keyboard.press(`${modifier}+Shift+z`);

  const pngDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG 다운로드' }).click();
  const pngDownload = await pngDownloadPromise;
  expect(await pngDownload.path()).toBeTruthy();

  const jsonDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON 저장' }).click();
  const jsonDownload = await jsonDownloadPromise;
  expect(await jsonDownload.path()).toBeTruthy();
});
