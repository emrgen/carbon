import {Optional} from "@emrgen/types";

// +1 = node added within index map
// -1 = node removed from index map
type IndexMapOp = 1 | -1;

//
export class IndexMap {
  position: number = 0;

  offset: number;

  op: IndexMapOp = 1;

  static DEFAULT = new IndexMap(1000000000, 1)

  get isDefault() {
    return this === IndexMap.DEFAULT;
  }

  constructor(offset: number, op: IndexMapOp) {
    this.offset = offset;
    this.op = op;
  }

  map(index: number): number {
    const {offset, op} = this;
    if (index < offset) {
      // index is before this map
      return index;
    } else {
      // index is within this map
      return index + op;
    }
  }

  unmap(index: number) {
    const {offset, op} = this;
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

}

export class IndexMapper {
  mappers: IndexMap[] = [];

  static empty() {
    return new IndexMapper([]);
  }

  static from(maps: IndexMap[]) {
    return new IndexMapper(maps);
  }

  constructor(maps: IndexMap[] = [IndexMap.DEFAULT]) {
    this.mappers = maps;
    for (let i = 0; i < maps.length; ++i) {
      const map = maps[i];
      map.position = i;
    }
  }

  // remove index maps from the start of the list
  // this maps should be applied to the indexes before the current index map
  take(count: number) {
    const {mappers} = this;
    const newMappers = mappers.slice(count);
    this.mappers = newMappers;

    for (let i = 0; i < newMappers.length; ++i) {
      const mapper = newMappers[i];
      mapper.position = i;
    }

    return {
      maps: IndexMapper.from(mappers.slice(0, count)),
      current: newMappers[0]
    };
  }

  add(map: IndexMap) {
    const {mappers} = this;
    map.position = mappers.length;
    mappers.push(map);
  }

  map(ref: IndexMap, index: number): number {
    const {mappers} = this;
    let i = ref.isDefault ? 0 : ref.position
    if (i === undefined) {
      throw new Error("IndexMap not found");
    }
    // console.log(this.mappers, this.mappers.length, i)
    for (++i; i < mappers.length; ++i) {
      const mapper = mappers[i];
      // console.debug('mapping', i, mapper, index, mapper.map(index))
      index = mapper.map(index);
    }

    return index;
  }

  unmap(ref: IndexMap, index: number): number {
    const {mappers} = this;
    let i = ref.isDefault ? 0 : ref.position
    if (i === undefined) {
      throw new Error("IndexMap not found");
    }

    for (; i >= 0; --i) {
      const mapper = mappers[i];
      index = mapper.unmap(index);
    }

    return index;
  }

  pop() {
    return this.mappers.pop();
  }
}

export class MappedIndex {
  index: number;
  map: IndexMap;

  static from(index: number, map: IndexMap) {
    return new MappedIndex(index, map);
  }

  constructor(index: number, map: IndexMap) {
    this.index = index;
    this.map = map;
  }
}
