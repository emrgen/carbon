import { expect, test } from "@playwright/test";
import { TextWriter } from "@emrgen/carbon-core";
import { CarbonPage, getDocContent } from "./utils";

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  const carbonPage = new CarbonPage(page);
  await carbonPage.init();
});

test("add title to the document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);
  await carbonPage.type("Hello World!");

  let docContent = await carbonPage.getDocContent();
  expect(docContent).toBe("# Doc title\n\nHello World!");

  await carbonPage.enter();
  await carbonPage.type("document content");
  docContent = await carbonPage.getDocContent();
  expect(docContent).toBe("# Doc title\n\nHello World!\n\ndocument content");
});

test("add number list to the document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await page.keyboard.type("document content");
  await page.keyboard.press("Enter");

  await page.keyboard.type("1. first item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("second item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("third item");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  const docContent = await carbonPage.getDocContent();

  // FIXME: wrong encoding
  expect(docContent).toBe(
    "# Doc title\n\ndocument content\n1. first item\n1. second item\n1. third item",
  );
});

test("add bullet list to the document", async ({ page }) => {
  await page.keyboard.type("document content");
  await page.keyboard.press("Enter");

  await page.keyboard.type("- first item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("- second item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("- third item");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  const docContent = await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    const writer = new TextWriter();
    return app.encode(writer, doc!).toString();
  });

  expect(docContent).toBe(
    "Doc title\ndocument content\n- first item\n- second item\n- third item\n",
  );
});

test("add nested number list to the document", async ({ page }) => {
  await page.keyboard.type("1. first item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("1. first item child 1");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.type("first item child 2");

  const docContent = await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    const writer = new TextWriter();
    return app.encode(writer, doc!).toString();
  });

  expect(docContent).toBe(
    "Doc title\n1. first item\n 1. first item child 1\n 2. first item child 2",
  );
});

test("add nested bullet list to the document", async ({ page }) => {
  await page.keyboard.type("- first item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("first item child 1");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.type("first item child 2");

  const docContent = await getDocContent(page);

  expect(docContent).toBe(
    "Doc title\n- first item\n - first item child 1\n - first item child 2",
  );
});

test("add todo in document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);
  await carbonPage.insertTodo("this is a todo");
  await carbonPage.enter();
  await carbonPage.type("another todo");
  await carbonPage.enter();
  await carbonPage.type("yet another todo");

  const docContent = await getDocContent(page);
  expect(docContent).toBe(
    "Doc title\n[] this is a todo\n[] another todo\n[] yet another todo",
  );
});

test("add callout into document", async ({ page }) => {
  await page.keyboard.type(">> this is a callout");
  const docContent = await getDocContent(page);

  expect(docContent).toBe("Doc title\nthis is a callout");

  await page.keyboard.press("Enter");
  await page.keyboard.type("callout content");
  await page.keyboard.press("Tab");

  const docContent2 = await getDocContent(page);

  expect(docContent2).toBe("Doc title\nthis is a callout\n callout content");
});

test("add toggle list in document", async ({ page }) => {
  await page.keyboard.type("> this is a toggle list");
  await page.keyboard.press("Enter");
  await page.keyboard.type("toggle content");
  await page.keyboard.press("Enter");
  await page.keyboard.type("more toggle content");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("after toggle content");

  const docContent = await getDocContent(page);
  await page.click(".carbon-collapsible__control");

  expect(docContent).toBe(
    "Doc title\n- this is a toggle list\n toggle content\n more toggle content\nafter toggle content",
  );
  // expect(await page.isVisible('.carbon-collapsible__content')).toBe(false);
});

test("add header in document", async ({ page }) => {
  await page.keyboard.type("# this is a header");
  await page.keyboard.press("Enter");
  await page.keyboard.type("header content");
  await page.keyboard.press("Tab");

  const docContent = await getDocContent(page);
  expect(docContent).toBe("Doc title\n# this is a header\n header content");
});

test("add quote in document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);
  await page.keyboard.type("| this is a quote");
  await page.keyboard.press("Enter");
  await page.keyboard.type("quote content");
  await page.keyboard.press("Tab");

  const docContent = await getDocContent(page);
  expect(docContent).toBe("Doc title\n> this is a quote\n quote content");

  await carbonPage.enter();
  await carbonPage.enter();
  await carbonPage.type("after the quote");

  const docContent2 = await getDocContent(page);
  expect(docContent2).toBe(
    "Doc title\n> this is a quote\n quote content\nafter the quote",
  );
});
