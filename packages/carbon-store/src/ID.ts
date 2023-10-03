export class SpaceId {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  eq(other: SpaceId): boolean {
    return this.id === other.id;
  }
}


export class BlockId {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  eq(other: BlockId): boolean {
    return this.id === other.id;
  }
}
