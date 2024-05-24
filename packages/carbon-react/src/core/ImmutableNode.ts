import {
  MutableNode,
  Node,
  NodeContent,
  NodeContentData,
  NodeId,
  NodeMap,
  NodePropsJson,
  NodeType,
  Path,
  With,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { findIndex, identity, isString } from "lodash";
import { ImmutableNodeContent } from "./ImmutableNodeContent";
import { IndexMap, IndexMapper } from "@emrgen/carbon-core/src/core/IndexMap";
import { CarbonCache } from "@emrgen/carbon-core/src/core/CarbonCache";

export class ImmutableNode extends Node {
  scope: Symbol;
  indexMap: IndexMap = IndexMap.DEFAULT;
  indexMapper: IndexMapper = IndexMapper.empty();
  mappedIndex: number = 0;

  static create(scope: Symbol, content: NodeContent) {
    return new ImmutableNode(scope, content);
  }

  constructor(scope: Symbol, content: NodeContent) {
    super(content);
    this.scope = scope;
  }

  get isFrozen() {
    return Object.isFrozen(this);
  }

  override get index(): number {
    return this.getIndex();

    // return super.index;

    // console.debug('## called index', this.id.toString())
    // const parent = this.parent as ImmutableNode;
    // if (!parent) {
    //   return -1
    // }
    // // console.log('getting index', this.id.toString(), this.isFrozen, parent.isFrozen)
    // const index = parent.indexMapper.map(this.indexMap, this.mappedIndex);
    // console.debug('found index', this.id.toString(), index)
    // return index;
  }

  private getIndex() {
    const parent = this.parent as ImmutableNode;
    if (!parent) {
      // console.warn('node has no parent', this.id.toString());
      return -1;
    }

    // NOTE: this is a performance critical code
    const key = `${parent.contentKey}/${this.id.toString()}`;
    return NODE_CACHE_INDEX.get(
      key,
      () => {
        const { children = [] } = parent;
        return findIndex(children, (n) => {
          return this.id.eq(n.id);
        });
      },
      parent.isFrozen,
    );
  }

  override get key() {
    return `${this.id.toString()}/${this.renderVersion}/${this.contentVersion}`;
  }

  override get contentKey(): string {
    return `${this.id.toString()}/${this.renderVersion}/${this.contentVersion}`;
  }

  override setParent(parent: Optional<Node>) {
    if (this.isFrozen) {
      throw new Error(
        `cannot set parent on frozen node: ${this.id.toString()}`,
      );
    }

    super.setParent(parent);

    return this;
  }

  override setParentId(parentId: Optional<NodeId>) {
    if (this.isFrozen) {
      throw new Error(
        `cannot set parent id on frozen node: ${this.id.toString()}`,
      );
    }

    return super.setParentId(parentId);
  }

  override changeType(type: NodeType) {
    if (this.isFrozen) {
      throw new Error(
        `cannot change type on frozen node: ${this.id.toString()}`,
      );
    }

    super.changeType(type);
  }

  override insert(node: Node, index: number) {
    if (this.isFrozen) {
      throw new Error(
        `cannot insert node on frozen node: ${this.id.toString()}`,
      );
      // const indexMap = new IndexMap(index, 1);
      // node.indexMap = indexMap;
      // node.mappedIndex = index;
      // this.indexMapper.add(indexMap);
    }

    return super.insert(node, index);
  }

  override remove(node: Node) {
    if (this.isFrozen) {
      throw new Error(
        `cannot remove node on frozen node: ${this.id.toString()}`,
      );
      // const indexMap = new IndexMap(index, -1);
      // this.indexMapper.add(indexMap);
    }

    return super.remove(node);
  }

  override insertText(text: string, offset: number) {
    if (this.isFrozen) {
      throw new Error(
        `cannot insert text on frozen node: ${this.id.toString()}`,
      );
    }

    return super.insertText(text, offset);
  }

  override removeText(offset: number, length: number) {
    if (this.isFrozen) {
      throw new Error(
        `cannot remove text on frozen node: ${this.id.toString()}`,
      );
    }

    return super.removeText(offset, length);
  }

  override updateContent(content: ImmutableNode[] | string) {
    if (this.isFrozen) {
      throw new Error(
        `cannot update content on frozen node: ${this.id.toString()}`,
      );
    }

    return super.updateContent(content);
  }

  override updateProps(props: NodePropsJson) {
    if (this.isFrozen) {
      throw new Error(
        `cannot update props on frozen node: ${this.id.toString()}`,
      );
    }

    return super.updateProps(props);
  }

  override addLink(name: string, node: Node) {
    if (this.isFrozen) {
      throw new Error(`cannot add link on frozen node: ${this.id.toString()}`);
    }

    return super.addLink(name, node);
  }

  override removeLink(name: string) {
    if (this.isFrozen) {
      throw new Error(
        `cannot remove link from frozen node: ${this.id.toString()}`,
      );
    }

    return super.removeLink(name);
  }

  // @mutates
  unfreeze(path: Path, map: NodeMap): MutableNode {
    const mutable = this.isFrozen ? this.clone() : this;
    if (this.isFrozen) {
      map.put(mutable);
    }

    if (path.length === 0) {
      return mutable;
    }

    const [index, ...rest] = path;

    if (isString(index)) {
      const child = mutable.links[index];
      if (!child) {
        throw new Error(`child not found at ${index}`);
      }

      const mutableChild = child.unfreeze(rest, map);
      mutable.addLink(index, mutableChild);

      return mutable;
    } else {
      const child = mutable.children[index];
      if (!child) {
        throw new Error(`child not found at ${index}`);
      }

      const mutableChild = child.unfreeze(rest, map);
      mutable.replace(index, mutableChild);

      return mutable;
    }
  }

  // clone the content by providing a map function (default is identity)
  override clone(
    map: (node: NodeContentData) => NodeContentData = identity,
  ): Node {
    const data = map(this.content.unwrap());
    const content = new ImmutableNodeContent(this.scope, data);
    const clone = ImmutableNode.create(this.scope, content);

    clone.renderVersion = this.renderVersion;
    clone.contentVersion = this.contentVersion;
    clone.indexMapper = this.indexMapper;
    clone.indexMap = this.indexMap;
    clone.mappedIndex = this.mappedIndex;

    return clone;
  }

  // @mutates
  freeze(fn: With<Node>): Node {
    if (this.isFrozen) return this;

    // unlink from parent when freezing
    // this.setParent(null)
    this.content.freeze(fn);
    this.props.freeze();

    Object.freeze(this);
    fn(this);

    return this;
  }
}

export const NODE_CACHE_INDEX = new CarbonCache();
