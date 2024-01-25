
export interface Block {
  id: string;
  parentId: string;
  children: string[];
  text: string;
  props: any;
  deleted?: boolean;
}

type Position = 'before' | 'after' | 'start' | 'end';

export interface BlockStore {
  getBlock(spaceId: string, id: string): Block;
  getChildrenBlocks(spaceId: string, id: string): Block[];
  insertBlock(spaceId: string, block: Block, ref: string, pos: Position): void;
  deleteBlock(spaceId: string, id: string): void;
  updateBlock(spaceId: string, props: any): void;
  updateBlockText(spaceId: string, id: string, text: string): void;
  indexOfBlock(spaceId: string, id: string): number;
}

export interface ObjectStore {}

export interface JsonDocStore {}

export interface TransactionStore {}

export interface Store extends BlockStore, ObjectStore, JsonDocStore, TransactionStore {}
