import { Application, Graphics, Rectangle, RenderTexture, Text, autoDetectRenderer } from "pixi.js";
import { SheetData } from "./SheetData";
import { SheetSize } from "./SheetSize";
import { SheetPosition } from "./SheetPosition";
import { indexToColumn, indexToRow } from "../utils/sheet";
import { Optional } from '@emrgen/types';

export class SheetRenderer {
  app: Application;
  columnHeaderGfx: Graphics;
  // columnHeaderTextGfx: Graphics;
  rowHeaderGfx: Graphics;
  // rowHeaderTextGfx: Graphics;
  gridGfx: Graphics;

  position: Optional<SheetPosition>

  constructor(app: Application) {
    this.app = app;
    this.columnHeaderGfx = new Graphics();
    this.rowHeaderGfx = new Graphics();
    this.gridGfx = new Graphics();

    // app.stage.addChild(this.gridGfx);
    // app.stage.addChild(this.columnHeaderGfx);
    // app.stage.addChild(this.rowHeaderGfx);
  }

  render(data: SheetData, position: SheetPosition, size: SheetSize) {
    if (this.position) {
      const dy = position.top - this.position.top;
      const dx = position.left - this.position.left;
      this.app.stage.transform.position.y += dy;
      this.app.stage.transform.position.x += dx;
    } else {
      this.clear();
      this.renderGrid(data, position, size);
      this.renderColumnHeader(data, position, size);
      this.renderRowHeader(data, position, size);
    }
    this.position = position.clone();

    // let lineLeft = left
    // let lineTop = top
    // for (let i = 0; i < 100; i++) {
    //   gfx.moveTo(0, lineTop);
    //   gfx.lineTo(sheetWidth, lineTop);
    //   for (let j  = 0; j < 200; j++) {
    //     if (j === 0) {
    //       gfx.moveTo(50, 0);
    //       gfx.lineTo(50, sheetHeight);
    //       lineLeft += 50
    //     } else {
    //       gfx.moveTo(lineLeft, 0);
    //       gfx.lineTo(lineLeft, sheetHeight);
    //       lineLeft += cellWidth
    //     }
    //     if (lineLeft > sheetWidth) {
    //       break
    //     }
    //   }

    //   lineTop += cellHeight
    //   if (lineTop > sheetHeight) {
    //     break
    //   }
    // }

    // gfx.endFill();

    // gfx.transform.position.x = left;
    // gfx.transform.position.y = top;

    // console.log('rerender the app', left, top);


  }

  clear() {
    this.columnHeaderGfx.clear();
    this.columnHeaderGfx.removeChildren();
    this.rowHeaderGfx.clear();
    this.rowHeaderGfx.removeChildren();
    this.gridGfx.clear();
  }

  columnHeaderText(index: number) {
    const text = new Text(indexToColumn(index), {
      fontFamily: 'Helvetica',
      fontSize: 12,
      fill: 0x000000,
      align: 'center',
      fontWeight: '100',
    });

    return text;
  }

  rowHeaderText(index: number) {
    const text = new Text(indexToRow(index), {
      fontFamily: 'Helvetica',
      fontSize: 12,
      fill: 0x000000,
      align: 'center',
      fontWeight: '100',
    });

    return text;
  }

  renderColumnHeader(data: SheetData, position: SheetPosition, size: SheetSize) {
    const { app } = this;

    const { left } = position;
    const { width: sheetWidth, height: sheetHeight } = size;
    const cellWidth = 100
    const cellHeight = 26

    this.columnHeaderGfx.lineStyle(1, 0xdddddd, 1);
    this.columnHeaderGfx.moveTo(0, cellHeight);
    this.columnHeaderGfx.lineTo(sheetWidth, cellHeight);

    let lineLeft = 50 + left
    for (let i = 0; i < 100; i++) {
      this.columnHeaderGfx.moveTo(lineLeft, 0);
      this.columnHeaderGfx.lineTo(lineLeft, cellHeight);

      const text = this.columnHeaderText(i + 1)
      const bound = text.getBounds()
      text.x = lineLeft + (cellWidth / 2) - (bound.width / 2)
      text.y = (cellHeight / 2) - (bound.height / 2)
      // this.columnHeaderGfx.addChild(text);

      lineLeft += cellWidth
    }
  }

  renderRowHeader(data: SheetData, position: SheetPosition, size: SheetSize) {
    const { app } = this;

    const { top } = position;
    const { width: sheetWidth, height: sheetHeight } = size;
    const cellHeight = 20

    this.rowHeaderGfx.lineStyle(1, 0xdddddd, 1);
    this.rowHeaderGfx.moveTo(50, 0);
    this.rowHeaderGfx.lineTo(50, sheetHeight);

    let lineTop = 26 + top
    for (let i = 0;i < 100;i++) {
      this.rowHeaderGfx.moveTo(0, lineTop);
      this.rowHeaderGfx.lineTo(50, lineTop);

      const text = this.rowHeaderText(i + 1)
      const bound = text.getBounds()
      text.x = (50 / 2) - (bound.width / 2)
      text.y = lineTop + (cellHeight / 2) - (bound.height / 2)
      // this.rowHeaderGfx.addChild(text);

      lineTop += cellHeight
    }
  }

  renderGrid(data: SheetData, position: SheetPosition, size: SheetSize) {
    // this.gridGfx.beginFill(0xffffff);
    // this.gridGfx.drawRect(0, 0,  49, 25);
    // this.gridGfx.endFill();
  }

}
