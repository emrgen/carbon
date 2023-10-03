import { Space } from "./Space";

export class Store {
  spaces: Map<string, Space> = new Map();

  space(id: string): Space {
    return this.spaces.get(id)!
  }
}
