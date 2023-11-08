import { EventEmitter } from 'events';

const CellAddrRegex = /^([A-Z]+)([0-9]+)$/;



export class Cell {
  private address: string;
  private data: string;
  private format: string;

  // get row() {
  //   // return cellAddrToIndex(this.address);
  // }

  // get column() {
  //   // return cellAddrToIndex(this.address);
  // }

  constructor(address: string, data: string = '', format: string = 'text') {
    this.address = address;
    this.data = data;
    this.format = format;
  }
}

export class CellBlock {
  data: Map<string, string>;

  constructor(data: Map<string, string> = new Map()) {
    this.data = data;
  }

  getCellData(row: number, column: number) {}
  setCellData(row: number, column: number, data: any) {}

}

export class SheetData extends EventEmitter {
  private formats = new Map<string, string>();
  private data = new Map<string, string>();

  constructor(data: Map<string, string> = new Map()) {
    super();
    this.data = data;
  }

  getFormat(header: string) { }

  getData(block: string) {
    // const match = cell.match(CellAddrRegex);
    // return this.data.get(cell);
  }

  setData(block: string, data: CellBlock) {}
}
