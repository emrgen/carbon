import { expect, Page, test } from "@playwright/test";
import { Carbon } from "@emrgen/carbon-core";

declare global {
  interface Window {
    app: Carbon;
  }
}

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  await page.goto("http://localhost:5173");
  await focusDocTitle(page);
});

test("add title to the document", async ({ page }) => {
  await page.keyboard.type("Hello World!");
  await page.keyboard.press("Enter");

  const textContent = await page.evaluate(() => {
    const app = window.app;
    return app.content.textContent;
  });

  expect(textContent).toBe("Hello World!");

  await page.keyboard.type("document content");

  const docContent = await page.evaluate(() => {
    const app = window.app;
    return app.content.textContent;
  });

  expect(docContent).toBe("Hello World!document content");
});

test("add number list to the document", async ({ page }) => {
  await page.keyboard.type("Hello World!");
  await page.keyboard.press("Enter");

  await page.keyboard.type("document content");
  await page.keyboard.press("Enter");

  await page.keyboard.type("1. first item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("2. second item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("3. third item");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  const docContent = await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    return app.serialize(doc!);
  });

  expect(docContent).toBe("Hello World!\ndocument content\n1. first item\n2. second item\n3. third item\n");
});

test("add bullet list to the document", async ({ page }) => {
  await page.keyboard.type("Hello World!");
  await page.keyboard.press("Enter");

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

    return app.serialize(doc!);
  });

  expect(docContent).toBe("Hello World!\ndocument content\n- first item\n- second item\n- third item\n");
});

test("add nested number list to the document", async ({ page }) => {
  await page.keyboard.type("Hello World!");
  await page.keyboard.press("Enter");

  await page.keyboard.type("1. first item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("1. first item child 1");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.type("first item child 2");

  const docContent = await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    return app.serialize(doc!);
  });

  expect(docContent).toBe("Hello World!\n1. first item\n 1. first item child 1\n 2. first item child 2");
});

test("add nested bullet list to the document", async ({ page }) => {
  await page.keyboard.type("Hello World!");
  await page.keyboard.press("Enter");

  await page.keyboard.type("- first item");
  await page.keyboard.press("Enter");

  await page.keyboard.type("first item child 1");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.type("first item child 2");

  const docContent = await getDocContent(page);

  expect(docContent).toBe("Hello World!\n- first item\n - first item child 1\n - first item child 2");
});

test('add todo in document', async ({ page }) => {
  await page.keyboard.type("Doc title");
  await page.keyboard.press("Enter");

  await page.keyboard.type("[] this is a todo");
  await page.keyboard.press("Enter");
  await page.keyboard.type("another todo");
  await page.keyboard.press("Enter");
  await page.keyboard.type("yet another todo");

  const docContent = await getDocContent(page);

  expect(docContent).toBe("Doc title\n[] this is a todo\n[] another todo\n[] yet another todo");
})

test('add callout into document', async ({ page }) => {
  await page.keyboard.type("Doc title");
  await page.keyboard.press("Enter");

  await page.keyboard.type(">> this is a callout");
  const docContent = await getDocContent(page);

  expect(docContent).toBe("Doc title\nthis is a callout");

  await page.keyboard.press("Enter");
  await page.keyboard.type("callout content");
  await page.keyboard.press("Tab");

  const docContent2 = await getDocContent(page);

  expect(docContent2).toBe("Doc title\nthis is a callout\n callout content");
});

test('add toggle list in document', async ({ page }) => {
  await page.keyboard.type("Doc title");
  await page.keyboard.press("Enter");

  await page.keyboard.type("> this is a toggle list");
  await page.keyboard.press("Enter");
  await page.keyboard.type("toggle content");
  await page.keyboard.press("Enter");
  await page.keyboard.type("more toggle content");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("after toggle content");

  const docContent = await getDocContent(page);

  expect(docContent).toBe("Doc title\n- this is a toggle list\n toggle content\n more toggle content\nafter toggle content");
})

test('add header in document', async ({ page }) => {
  await page.keyboard.type("Doc title");
  await page.keyboard.press("Enter");

  await page.keyboard.type("# this is a header");
  await page.keyboard.press("Enter");
  await page.keyboard.type("header content");
  await page.keyboard.press("Tab");

  const docContent = await getDocContent(page);
  expect(docContent).toBe("Doc title\n# this is a header\n header content");
})

const getDocContent =  async (page: Page) => {
  return await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    return app.serialize(doc!);
  });
}

const focusDocTitle = async (page: Page) => {
  await page.click('.carbon-document > [data-type=content]');
}
