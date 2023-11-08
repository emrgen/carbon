import { expect, test } from "@playwright/test";

declare global {
  interface Window { app: any; }
}

test('click on document', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await focusDocTitle(page)
  await page.keyboard.type('Hello World!');
  await page.keyboard.press('Enter');

  const textContent = await page.evaluate(() => {
    const app = window.app;
    return app.content.textContent;
  });

  expect(textContent).toBe('Hello World!');
});

export const focusDocTitle = async (page) => {
  await page.click('.carbon-document > [data-type=content]');
}
