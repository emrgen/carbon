import { Transaction } from '@emrgen/carbon-core';
import { EventEmitter } from 'events';

export class TrBus extends EventEmitter{
  onTransaction(tr: Transaction) {
    this.emit('transaction', tr )
  }

  applyTransaction(json: JSON) {
    this.emit('apply:transaction', json)
  }
}
