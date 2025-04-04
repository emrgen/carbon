// +1 = node added within index map
// -1 = node removed from index map
type IndexMapOp = number;

// IndexMap maps indexes to new indexes
export class IndexMap {
  position: number = 0;

  offset: number;

  op: IndexMapOp = 1;

  static DEFAULT = new IndexMap(1000000000, 1);

  static create(offset: number, op: IndexMapOp): IndexMap {
    return new IndexMap(offset, op);
  }

  get isDefault() {
    return this === IndexMap.DEFAULT;
  }

  constructor(offset: number, op: IndexMapOp) {
    // if (offset < 0) {
    //   throw Error("IndexMap ref offset must be positive");
    // }
    //
    this.offset = offset;
    this.op = op;
  }

  map(index: number): number {
    const { offset, op } = this;
    if (index < 0) {
      if (offset < index) {
        return index;
      } else {
        // console.log("mapping", index, offset, op, index + op);
        return index + op;
      }
    } else {
      if (index < offset) {
        // index is before this map
        return index;
      } else {
        // index is within this map
        return index + op;
      }
    }
  }

  unmap(index: number) {
    const { offset, op } = this;
    if (index < offset) {
      // index is before this map
      return index;
    } else if (index < offset + op) {
      // index is within this map
      return offset;
    } else {
      // index is after this map
      return index - op;
    }
  }

  clone() {
    return new IndexMap(this.offset, this.op);
  }
}

// IndexMapper maps indexes through a list of IndexMap
export class IndexMapper {
  mappers: IndexMap[] = [];

  static empty() {
    return new IndexMapper([IndexMap.DEFAULT]);
  }

  static from(maps: IndexMap[]) {
    return new IndexMapper(maps);
  }

  constructor(maps: IndexMap[] = []) {
    this.mappers = maps;
    for (let i = 0; i < maps.length; ++i) {
      const map = maps[i];
      map.position = i;
    }
  }

  // remove index maps from the start of the list
  // this maps should be applied to the indexes before the current index map
  take(count: number) {
    const { mappers } = this;
    const newMappers = mappers.slice(count);
    this.mappers = newMappers;

    for (let i = 0; i < newMappers.length; ++i) {
      const mapper = newMappers[i];
      mapper.position = i;
    }

    return {
      maps: IndexMapper.from(mappers.slice(0, count)),
      current: newMappers[0],
    };
  }

  add(map: IndexMap) {
    const { mappers } = this;
    mappers.push(map);
    map.position = mappers.length - 1;
  }

  // map the index through all the index maps
  map(ref: IndexMap, index: number): number {
    const { mappers } = this;
    let i = ref.isDefault ? 0 : ref.position;
    if (i === undefined) {
      throw new Error("IndexMap not found");
    }

    for (++i; i < mappers.length; ++i) {
      const mapper = mappers[i];
      index = mapper.map(index);
    }

    return index;
  }

  unmap(ref: IndexMap, index: number): number {
    const { mappers } = this;
    let i = ref.isDefault ? 0 : ref.position;
    if (i === undefined) {
      throw new Error("IndexMap not found");
    }

    for (; i >= 0; --i) {
      const mapper = mappers[i];
      index = mapper.unmap(index);
    }

    return index;
  }

  clone() {
    return new IndexMapper(this.mappers.map((m) => m.clone()));
  }
}
