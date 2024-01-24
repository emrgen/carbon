import {NodeId, NodeIdComparator, Point, PointAt} from "@emrgen/carbon-core";
import {IndexMap, IndexMapper} from "./IndexMap";
import BTree from "sorted-btree";

interface NodeIdTreeEntry {
  // mapper maps the node entry to the index within parent
  mapper: IndexMapper;
  map: IndexMap;
  size: number;
  deleted?: boolean;
}

// create new entry from index map
const newEntry = (map: IndexMap) => ({mapper: IndexMapper.empty(), map, size: 0});

interface Change {
  type: 'insert'|'remove';
  parentId: NodeId;
  nodeId: NodeId;
  index: number;
}

export class NodeIdTree {
  // node id to index map
  nodes: BTree<NodeId, NodeIdTreeEntry> = new BTree(undefined, NodeIdComparator);
  // child to parent mapping
  parents: BTree<NodeId, NodeId> = new BTree(undefined, NodeIdComparator);
  changes: Change[] = [];

  constructor() {
    this.parents.set(NodeId.ROOT, NodeId.NULL);
    this.nodes.set(NodeId.ROOT, {mapper: IndexMapper.empty(), map: IndexMap.DEFAULT, size: 0});
  }

  indexOf(nodeId: NodeId): number {
    const entry = this.nodes.get(nodeId);
    if (!entry) {
      throw Error('node not found ' + nodeId.toString())
    }

    const parent = this.parents.get(nodeId);
    if (!parent) {
      throw Error('parent not found for node ' + nodeId.toString())
    }

    const parentEntry = this.nodes.get(parent);
    if (parentEntry) {
      return parentEntry.mapper.map(entry.map, entry.map.offset);
    }

    return -1;
  }

  insert(at: Point, nodeId: NodeId) {
    switch (at.at) {
      case PointAt.After:
        this.insertAfter(at.nodeId, nodeId);
        break;
      case PointAt.Before:
        this.insertBefore(at.nodeId, nodeId);
        break;
      case PointAt.Start:
        this.insertAtStart(at.nodeId, nodeId);
        break;
      case PointAt.End:
        this.insertAtEnd(at.nodeId, nodeId);
        break;
    }
  }

  private insertBefore(nextId: NodeId, newNodeId: NodeId) {
    const parentId = this.parents.get(nextId);
    if (!parentId) {
      throw Error('parent not found for node ' + nextId.toString())
    }

    const parentEntry = this.nodes.get(parentId);
    if (!parentEntry) {
      throw Error('parent entry not found for node ' + parentId.toString())
    }

    const nextEntry = this.nodes.get(nextId);
    if (!nextEntry) {
      throw Error('next entry not found for node ' + nextId.toString())
    }

    const index = parentEntry.mapper.map(nextEntry.map, nextEntry.map.offset);
    const map = new IndexMap(index, 1);
    this.nodes.set(newNodeId, newEntry(map));
    this.parents.set(newNodeId, parentId);
  }

  private insertAfter(prevId: NodeId, newNodeId: NodeId) {
    const parentId = this.parents.get(prevId);
    if (!parentId) {
      throw Error('parent not found for node ' + prevId.toString())
    }

    const parentEntry = this.nodes.get(parentId);
    if (!parentEntry) {
      throw Error('parent entry not found for node ' + parentId.toString())
    }

    const prevEntry = this.nodes.get(prevId);
    if (!prevEntry) {
      throw Error('prev entry not found for node ' + prevId.toString())
    }

    const index = parentEntry.mapper.map(prevEntry.map, prevEntry.map.offset);
    const map = new IndexMap(index + 1, 1);
    parentEntry.mapper.add(map);
    this.nodes.set(newNodeId, newEntry(map));
    this.parents.set(newNodeId, parentId);
  }

  private insertAtStart(parentId: NodeId, newNodeId: NodeId) {
    const parentEntry = this.nodes.get(parentId);
    if (!parentEntry) {
      throw Error('parent entry not found for node ' + parentId.toString())
    }
    const map = new IndexMap(0, 1);
    parentEntry.mapper.add(map);
    this.nodes.set(newNodeId, newEntry(map));
    this.parents.set(newNodeId, parentId);
  }

  private insertAtEnd(parentId: NodeId, newNodeId: NodeId) {
    const parentEntry = this.nodes.get(parentId);
    if (!parentEntry) {
      throw Error('parent entry not found for node ' + parentId.toString())
    }
    const map = new IndexMap(parentEntry.size, 1);
    parentEntry.mapper.add(map);
    this.nodes.set(newNodeId, newEntry(map));
    this.parents.set(newNodeId, parentId);
  }

  remove(nodeId: NodeId) {
    const parentId = this.parents.get(nodeId);
    if (!parentId) {
      throw Error('parent not found for node ' + nodeId.toString())
    }

    const entry = this.nodes.get(parentId);
    if (!entry) {
      throw Error('parent entry not found for node ' + nodeId.toString())
    }

    const index = this.indexOf(nodeId);
    entry.mapper.add(new IndexMap(index, -1));
  }
}
