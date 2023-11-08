import { test, expect } from '@playwright/test';

test('click on document', async ({ page }) => {
  await page.goto('http://localhost:5173/fastype');

  await page.click('.document-wrapper');
});
