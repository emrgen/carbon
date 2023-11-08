import { expect, test } from "@playwright/test";
import { Carbon } from "@emrgen/carbon-core";

declare global {
  interface Window { app: Carbon; }
}

test('add title to the document', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await focusDocTitle(page)
  await page.keyboard.type('Hello World!');
  await page.keyboard.press('Enter');


  const textContent = await page.evaluate(() => {
    const app = window.app;
    return app.content.textContent;
  });

  expect(textContent).toBe('Hello World!');

  await page.keyboard.type('document content');

  const docContent = await page.evaluate(() => {
    const app = window.app;
    return app.content.textContent;
  });

  expect(docContent).toBe('Hello World!document content');
});

test('add number list to the document', async ({ page }) => {
await page.goto('http://localhost:5173');

  await focusDocTitle(page)
  await page.keyboard.type('Hello World!');
  await page.keyboard.press('Enter');

  await page.keyboard.type('document content');
  await page.keyboard.press('Enter');

  await page.keyboard.type('1. first item');
  await page.keyboard.press('Enter');

  await page.keyboard.type('2. second item');
  await page.keyboard.press('Enter');

  await page.keyboard.type('3. third item');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  const docContent = await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    return app.serialize(doc!);
  });

  expect(docContent).toBe('Hello World!\ndocument content\n1. first item\n2. second item\n3. third item\n');
});

test('add bullet list to the document', async ({ page }) => {
await page.goto('http://localhost:5173');

  await focusDocTitle(page)
  await page.keyboard.type('Hello World!');
  await page.keyboard.press('Enter');

  await page.keyboard.type('document content');
  await page.keyboard.press('Enter');

  await page.keyboard.type('- first item');
  await page.keyboard.press('Enter');

  await page.keyboard.type('- second item');
  await page.keyboard.press('Enter');

  await page.keyboard.type('- third item');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  const docContent = await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    return app.serialize(doc!);
  });

  expect(docContent).toBe('Hello World!\ndocument content\n- first item\n- second item\n- third item\n');
});

test('add nested list to the document', async ({ page }) => {
await page.goto('http://localhost:5173');

  await focusDocTitle(page)
  await page.keyboard.type('Hello World!');
  await page.keyboard.press('Enter');

  await page.keyboard.type('1. first item');
  await page.keyboard.press('Enter');

  await page.keyboard.type('1. second item');
  await page.keyboard.press('Tab');
  // await page.keyboard.press('Enter');

  // const docContent = await page.evaluate(() => {
  //   const app = window.app;
  //   const doc = app.content.find((n) => n.isDocument);
  //
  //   return app.serialize(doc!);
  // });
  //
  // expect(docContent).toBe('Hello World!\n1. first item\n2. second item\n');

})

export const focusDocTitle = async (page) => {
  await page.click('.carbon-document > [data-type=content]');
}
