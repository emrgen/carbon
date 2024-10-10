import { Page } from "@playwright/test";

import { Carbon } from "@emrgen/carbon-core";

declare global {
  interface Window {
    app: Carbon;
  }
}

export const getDocContent = async (page: Page) => {
  return await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isDocument);

    return app.markdown(doc!);
  });
};

export const focusDocTitle = async (page: Page) => {
  await page.click(".cdoc > [data-type=content]");
};

export class CarbonPage {
  constructor(public page: Page) {}

  async init() {
    await this.open();
    await this.addTitle("Doc title");
    await this.enter();
  }

  async open() {
    await this.page.goto("http://localhost:4321/test");
  }

  async addTitle(text: string) {
    await this.focusDocTitle();
    await this.page.keyboard.type(text);
  }

  async focusDocTitle() {
    await this.page.click(".cdoc > [data-type=content]");
  }

  async getDocContent() {
    return await this.page.evaluate(() => {
      const app = window.app;
      const doc = app.content.find((n) => n.isDocument);

      return app.markdown(doc!);
    });
  }

  async enter() {
    await this.page.keyboard.press("Enter");
  }

  async tab() {
    await this.page.keyboard.press("Tab");
  }

  async type(text: string) {
    await this.page.keyboard.type(text);
  }

  async press(key: string) {
    await this.page.keyboard.press(key);
  }

  async repeat(key: string, times = 1, press = false) {
    for (let i = 0; i < times; i++) {
      if (press) {
        await this.page.keyboard.press(key);
      } else {
        await this.page.keyboard.type(key);
      }
    }
  }

  async arrowRight(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press("ArrowRight");
    }
  }

  async arrowLeft(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press("ArrowLeft");
    }
  }

  async insertBulletList(text: string) {
    await this.page.keyboard.type(`- ${text}`);
  }

  async insertNumberedList(text: string) {
    await this.page.keyboard.type(`1. ${text}`);
  }

  async insertTodo(text: string) {
    await this.page.keyboard.type(`[] ${text}`);
  }
}
