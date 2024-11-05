import { expect, test } from "@playwright/test";
import { CarbonPage } from "../utils";

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  const carbonPage = new CarbonPage(page);
  await carbonPage.init();
});

test("backspace-empty-list-does-not-become-paragraph.spec", async ({
  page,
}) => {
  const carbonPage = new CarbonPage(page);
  await carbonPage.type("simple paragraph text");
  await carbonPage.enter();
  await carbonPage.insertBulletList("list 1");
  await carbonPage.repeat("Backspace", 7, true);
  await carbonPage.type("another section");

  const docContent = await carbonPage.getDocContent();
  expect(docContent).toBe(
    "# Doc title\n\nsimple section text\n\nanother section",
  );
});
