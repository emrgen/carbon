import { expect, Page, test } from "@playwright/test";
import { CarbonPage } from "./utils";

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  const carbonPage = new CarbonPage(page);
  await carbonPage.init();
});

test("add multilevel bullet list to the document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);
  await carbonPage.insertBulletList('First item');
  await carbonPage.enter();
  await carbonPage.type('Second item');
  await carbonPage.tab();
  await carbonPage.enter();
  await carbonPage.type('Third item');
  await carbonPage.tab();
  await carbonPage.enter();
  await carbonPage.enter();
  await carbonPage.enter();
  await carbonPage.enter();
  await carbonPage.insertBulletList('Fourth item');
  await carbonPage.enter();
  await carbonPage.type('Fifth item');
  await carbonPage.tab();
  await carbonPage.enter();
  await carbonPage.type('Sixth item');
  await carbonPage.tab();
  await carbonPage.enter();
  await carbonPage.type('Seventh item');

  await carbonPage.arrowLeft(7);
  for (let i = 0; i < 13; i++) {
    await page.keyboard.press('Shift+ArrowLeft');
  }
  await carbonPage.press('Backspace');

  await carbonPage.arrowRight(2)
  for (let i = 0; i < 34; i++) {
    await page.keyboard.press('Shift+ArrowLeft');
  }
  await carbonPage.press('Backspace');

  const docContent = await carbonPage.getDocContent();

  expect(docContent).toBe('Doc Title\n- First item\n - Second item\n  - Third item')
});
