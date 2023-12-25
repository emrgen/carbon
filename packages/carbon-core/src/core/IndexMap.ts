import {Optional} from "@emrgen/types";

// +1 = node added within index map
// -1 = node removed from index map
type IndexMapOp = 1 | -1;

//
export class IndexMap {
  position: number = 0;

  start: number;

  end: number;

  op: IndexMapOp = 1;

  static DEFAULT = new IndexMap(-1, 1000000000, 1)

  constructor(start: number, end: number, op: IndexMapOp) {
    this.start = start;
    this.end = end;
    this.op = op;
  }

  get length() {
    return this.end - this.start + 1;
  }


  map(index: number): number {
    const {start, end, op, length} = this;
    if (index < start) {
      // index is before this map
      return index;
    } else {
      // index is within this map
      return index + op * length;
    }
  }

  unmap(index: number) {
    const {start, end, op, length} = this;
    if (index < start) {
      // index is before this map
      return index;
    } else if (start <= index && index <= end) {
      // index is within this map
      return index;
    } else {
      // index is after this map
      return index - op * length;
    }
  }

}

export class IndexMapper {
  mappers: IndexMap[] = [];
  mapIndex: WeakMap<IndexMap, number> = new WeakMap();

  static from(maps: IndexMap[]) {
    return new IndexMapper(maps);
  }

  constructor(maps: IndexMap[] = []) {
    this.mappers = maps;
    for (let i = 0; i < maps.length; ++i) {
      const map = maps[i];
      this.mapIndex.set(map, i);
      map.position = i;
    }
  }

  // remove index maps from the start of the list
  // this maps should be applied to the indexes before the current index map
  take(count: number) {
    const {mappers, mapIndex} = this;
    const newMappers = mappers.slice(count);
    this.mappers = newMappers;

    for (let i = 0; i < newMappers.length; ++i) {
      const mapper = newMappers[i];
      mapIndex.set(mapper, i);
      mapper.position = i;
    }

    return {
      maps: IndexMapper.from(mappers.slice(0, count)),
      current: newMappers[0]
    };
  }

  add(map: IndexMap) {
    const {mappers, mapIndex} = this;
    mappers.push(map);
    mapIndex.set(map, mappers.length - 1);
    map.position = mappers.length - 1;
  }

  map(ref: IndexMap, index: number): number {
    const {mappers, mapIndex} = this;
    let i = mapIndex.get(ref);
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
    const {mappers, mapIndex} = this;
    let i = mapIndex.get(ref);
    if (i === undefined) {
      throw new Error("IndexMap not found");
    }

    for (; i >= 0; --i) {
      const mapper = mappers[i];
      index = mapper.unmap(index);
    }

    return index;
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
