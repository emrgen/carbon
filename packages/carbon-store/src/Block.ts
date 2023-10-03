import { BlockId } from './ID';

export class Block {
  content: BlockId[] = [];
  props: Record<string, any> = {};

  constructor(readonly id: BlockId, content: BlockId[] = []) {
    this.content = content;
  }

  eq(other: Block): boolean {
    return this.id.eq(other.id);
  }
}
