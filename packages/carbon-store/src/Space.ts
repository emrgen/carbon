import { Block } from "./Block";
import { SpaceId } from "./ID";

export class Space {
  blocks: Map<string, Block[]> = new Map();
  constructor(readonly id: SpaceId) {}
}
