import {CarbonEditor} from "@emrgen/carbon-core";
import {Page} from "@playwright/test";

declare global {
  interface Window {
    app: CarbonEditor;
  }
}

const DELAY = 0;

export const getDocContent = async (page: Page) => {
  return await page.evaluate(() => {
    const app = window.app;
    const doc = app.content.find((n) => n.isPage);

    return app.markdown(doc!);
  });
};

export const focusDocTitle = async (page: Page) => {
  await page.click(".cpage > [data-type=content]");
};

export class CarbonPage {
  constructor(public page: Page) {}

  async init() {
    await this.open();
    await this.addTitle("Doc title");
    await this.enter();
  }

  async open() {
    await this.page.goto("http://localhost:4321/");
  }

  async addTitle(text: string) {
    await this.focusDocTitle();
    await this.page.keyboard.type(text, { delay: 50 });
  }

  async focusDocTitle() {
    await this.page.click(".cpage > [data-name=title]");
  }

  async getDocContent() {
    return await this.page.evaluate(() => {
      const app = window.app;
      const doc = app.content.find((n) => n.isPage);

      return app.markdown(doc!);
    });
  }

  async enter() {
    await this.page.keyboard.press("Enter", { delay: DELAY });
  }

  async tab() {
    await this.page.keyboard.press("Tab", { delay: DELAY });
  }

  async type(text: string) {
    await this.page.keyboard.type(text, { delay: DELAY });
  }

  async press(key: string) {
    await this.page.keyboard.press(key, { delay: DELAY });
  }

  async repeat(key: string, times = 1, press = false) {
    for (let i = 0; i < times; i++) {
      if (press) {
        await this.page.keyboard.press(key, { delay: DELAY });
      } else {
        await this.page.keyboard.type(key, { delay: DELAY });
      }
    }
  }

  async arrowRight(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press("ArrowRight", { delay: DELAY });
    }
  }

  async arrowLeft(count = 1) {
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press("ArrowLeft", { delay: DELAY });
    }
  }

  async insertBulletList(text: string) {
    await this.page.keyboard.type(`- ${text}`, { delay: DELAY });
  }

  async insertNumberedList(text: string) {
    await this.page.keyboard.type(`1. ${text}`, { delay: DELAY });
  }

  async insertTodo(text: string) {
    await this.page.keyboard.type(`[] ${text}`, { delay: DELAY });
  }
}
