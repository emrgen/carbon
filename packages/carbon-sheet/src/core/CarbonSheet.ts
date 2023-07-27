import { EventEmitter } from 'events';
import { SheetData } from './SheetData';
import { SheetView } from './SheetView';
import { SheetPosition } from './SheetPosition';
import { SheetSize } from './SheetSize';

export class CarbonSheet extends EventEmitter {
  position: SheetPosition = new SheetPosition();
  size: SheetSize = new SheetSize();
  isDirty: boolean = true;

  constructor(private readonly data: SheetData, private readonly view: SheetView) {
    super();
    this.position.on('change', () => this.isDirty = true);
    this.size.on('change', () => this.isDirty = true);
  }

  render() {
    if (!this.isDirty) return;

    const {position, size} = this;
    this.view.render(position, size);
    // console.log('rendering sheet');

    this.emit('render');
    this.isDirty = false;
  }
}
