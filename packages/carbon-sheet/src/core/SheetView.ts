import { CarbonSheet } from "./CarbonSheet";
import { SheetData } from "./SheetData";
import { SheetPosition } from "./SheetPosition";
import { SheetRenderer } from "./SheetRenderer";
import { SheetSize } from "./SheetSize";

// sheet view is the view of the sheet data
export class SheetView {
  data: SheetData;
  renderer: SheetRenderer;

  constructor(data: SheetData, renderer: SheetRenderer) {
    this.data = data;
    this.renderer = renderer;
  }

  render(position: SheetPosition, size: SheetSize) {
    this.renderer.render(this.data, position, size);
  }
}
