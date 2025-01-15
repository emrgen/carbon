import { expect, test } from "@playwright/test";
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
  await carbonPage.type("page content");

  docContent = await carbonPage.getDocContent();
  expect(docContent).toBe("# Doc title\n\nHello World!\n\npage content");
});

test("add number list to the document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await carbonPage.type("page content");
  await carbonPage.press("Enter");

  await carbonPage.type("1. first item");
  await carbonPage.press("Enter");

  await carbonPage.type("second item");
  await carbonPage.press("Enter");

  await carbonPage.type("third item");
  await carbonPage.press("Enter");
  await carbonPage.press("Enter");

  const docContent = await carbonPage.getDocContent();

  // FIXME: wrong encoding
  expect(docContent).toBe(
    "# Doc title\n\npage content\n\n1. first item\n2. second item\n3. third item",
  );
});

test("add bullet list to the document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await carbonPage.type("page content");
  await carbonPage.press("Enter");

  await carbonPage.type("- first item");
  await carbonPage.press("Enter");

  await carbonPage.type("second item");
  await carbonPage.press("Enter");

  await carbonPage.type("third item");
  await carbonPage.press("Enter");
  await carbonPage.press("Enter");

  const docContent = await carbonPage.getDocContent();

  expect(docContent).toBe(
    "# Doc title\n\npage content\n\n- first item\n- second item\n- third item",
  );
});

test("add nested number list to the document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await page.keyboard.type("1. first item");
  await carbonPage.press("Enter");

  await carbonPage.type("first item child 1");
  await carbonPage.press("Tab");
  await carbonPage.press("Enter");
  await carbonPage.type("first item child 2");

  const docContent = await getDocContent(page);

  expect(docContent).toBe(
    "# Doc title\n\n1. first item\n  1. first item child 1\n  2. first item child 2",
  );
});

test("add nested bullet list to the document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await carbonPage.type("- first item");
  await carbonPage.press("Enter");

  await carbonPage.type("first item child 1");
  await carbonPage.press("Tab");
  await carbonPage.press("Enter");
  await carbonPage.type("first item child 2");

  const docContent = await getDocContent(page);

  expect(docContent).toBe(
    "# Doc title\n\n- first item\n  - first item child 1\n  - first item child 2",
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
    "# Doc title\n\n- [ ] this is a todo\n- [ ] another todo\n- [ ] yet another todo",
  );
});

test("add callout into document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await carbonPage.type(">> this is a callout");
  const docContent = await getDocContent(page);

  expect(docContent).toBe("# Doc title\n\nthis is a callout");

  await carbonPage.press("Enter");
  await carbonPage.type("callout content");
  await carbonPage.press("Tab");

  const docContent2 = await getDocContent(page);

  expect(docContent2).toBe(
    "# Doc title\n\nthis is a callout\n\ncallout content",
  );
});

test("add toggle list in document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await carbonPage.type("> this is a toggle list");
  await carbonPage.press("Enter");
  await carbonPage.type("toggle content");
  await carbonPage.press("Enter");
  await carbonPage.type("more toggle content");
  await carbonPage.press("Enter");
  await carbonPage.press("Backspace");
  await carbonPage.type("after toggle content");

  const docContent = await getDocContent(page);
  await page.click(".collapsible__control");

  expect(docContent).toBe(
    "# Doc title\n\nthis is a toggle list\n\ntoggle content\n\nmore toggle content\n\nafter toggle content",
  );
});

test("add header in document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);

  await carbonPage.type("# this is a header");
  await carbonPage.press("Enter");
  await carbonPage.type("not a header content");
  await carbonPage.press("Tab");

  const docContent = await getDocContent(page);
  expect(docContent).toBe(
    "# Doc title\n\n# this is a header\n\nnot a header content",
  );
});

test("add quote in document", async ({ page }) => {
  const carbonPage = new CarbonPage(page);
  await carbonPage.type("| this is a quote");
  await carbonPage.press("Enter");
  await carbonPage.type("quote content");
  await carbonPage.press("Tab");

  const docContent = await getDocContent(page);
  expect(docContent).toBe(
    "# Doc title\n\n> this is a quote\n\n> quote content",
  );

  await carbonPage.enter();
  await carbonPage.enter();
  await carbonPage.type("after the quote");

  const docContent2 = await getDocContent(page);
  expect(docContent2).toBe(
    "# Doc title\n\n> this is a quote\n\n> quote content\n\nafter the quote",
  );
});
