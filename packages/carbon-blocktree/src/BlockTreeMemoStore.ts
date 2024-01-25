import { Block, Store} from './Store';

export class BlockTreeMemoStore implements Store {
    getBlock(spaceId: string, id: string): Block {
        throw new Error('Method not implemented.');
    }

    getChildrenBlocks(spaceId: string, id: string): Block[] {
        throw new Error('Method not implemented.');
    }

    insertBlock(spaceId: string, block: Block, ref: string, pos: 'before' | 'after' | 'start' | 'end'): void {
        throw new Error('Method not implemented.');
    }

    deleteBlock(spaceId: string, id: string): void {
        throw new Error('Method not implemented.');
    }

    updateBlock(spaceId: string, props: any): void {
        throw new Error('Method not implemented.');
    }

    updateBlockText(spaceId: string, id: string, text: string): void {
        throw new Error('Method not implemented.');
    }

    indexOfBlock(spaceId: string, id: string): number {
        throw new Error('Method not implemented.');
    }
}
