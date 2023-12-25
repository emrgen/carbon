import { Transaction } from '@emrgen/carbon-core';
import { Optional } from '@emrgen/types';
import { last } from 'lodash';

// a transaction tree is a tree of transactions that can be rolled back and committed
// it can be used to create time travel functionality
// saving the transaction in tree format allows us to easily roll back to any specific point
// each transaction has a parent and a list of children
// on undo we move along a path towards the root
// on redo we move along a path towards the leaf
// on undo -> new action creates a new branch

export type TimeTravelPatch = Transaction[];

export class TransactionTree {
  root: Optional<TransactionNode>;
  current: Optional<TransactionNode>;
  trMap: Map<number, TransactionNode> = new Map();

  constructor() {
    this.root = {
      parent: null,
      transaction: null as any,
      children: [],
      depth: 0
    } as unknown as TransactionNode;

    this.current = null;
  }

  moveTo(trId: number) {
    const from = this.current;
    const to = this.trMap.get(trId);
    // if the transaction is not in the tree, we can't move to it
    if (!to) {
      console.error(`Transaction ${trId} not found in tree`);
      return;
    }

    // find the lower common ancestor of the current node and the node we want to move to
    let current: Optional<TransactionNode> = this.current;
    let ancestor: Optional<TransactionNode> = to;
    while (current && ancestor) {
      if (current.depth > ancestor.depth) {
        current = current.parent;
      } else if (current.depth < ancestor.depth) {
        ancestor = ancestor.parent;
      } else {
        if (current === ancestor) {
          break;
        }

        current = current.parent;
        ancestor = ancestor.parent;
      }
    }

    // move along the path to the lower common ancestor
    const backward: Transaction[] = [];
    let start = from;
    while (start && start !== ancestor) {
      backward.push(start.transaction);
      start = start.parent;
    }

    // move along the path to the node we want to move to
    const forward: Transaction[] = [];
    start = to;
    while (start && start !== ancestor) {
      forward.push(start.transaction);
      start = start.parent;
    }

    // create the patch by reversing the backward path and appending the forward path
    const patch: TimeTravelPatch = [];
    // backward.forEach(tr => patch.push(tr.inverse()));
    // forward.reverse().forEach(tr => patch.push(tr));

    if (to) {
      this.current = to;
    }

    return patch;
  }

  add(transaction: Transaction) {
    if (this.current) {
      const node = new TransactionNode(transaction, this.current.depth + 1, this.current);
      // this.trMap.set(transaction.id, node);

      this.current.children.push(node);
      this.current = node;
    } else {
      this.root = new TransactionNode(transaction, 0, null);
      // this.trMap.set(transaction.id, this.root);

      this.current = this.root;
    }

  }

  prev(): Optional<Transaction> {
    // if we are at the root, we can't go back any further
    if (this.current == this.root) {
      console.warn('Already at root');
      return;
    }

    const current = this.current;
    // if current has a parent, we can go back to it
    if (this.current && this.current.parent) {
      this.current = this.current.parent;
      return current!.transaction;
    }
  }

  next(): Optional<Transaction> {
    if (this.current && this.current.children.length > 0) {
      this.current = last(this.current.children)!;
      return this.current?.transaction;
    }
  }

  toJSON(): any {
    return this.root?.toJSON();
  }
}

export class TransactionNode {
  parent: Optional<TransactionNode>;
  transaction: Transaction;
  children: TransactionNode[];
  depth: number;

  constructor(transaction: Transaction, depth: number, parent: Optional<TransactionNode>) {
    this.transaction = transaction;
    this.parent = parent;
    this.depth = depth;
    this.children = [];
  }

  toJSON(): any {
    return {
      // [this.transaction.id.toString()]: this.children.map(c => c.toJSON()).reduce((acc, val) => {
      //   return { ...acc, ...val }
      // }, {})
    }
  }
}
