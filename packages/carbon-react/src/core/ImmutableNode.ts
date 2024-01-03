import {
  Node,
  NodeContent,
  NodeContentData,
  NodeId,
  NodePropsJson,
  NodeType
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {findIndex, identity} from "lodash";
import {ImmutableNodeContent} from "./ImmutableNodeContent";
import {IndexMap, IndexMapper} from "@emrgen/carbon-core/src/core/IndexMap";
import {CarbonCache} from "@emrgen/carbon-core/src/core/CarbonCache";

export class ImmutableNode extends Node {
  scope: Symbol;
  indexMapper: IndexMapper = IndexMapper.empty();
  indexMap: IndexMap = IndexMap.DEFAULT;
  mappedIndex: number = 0;

  static create(scope: Symbol, content: NodeContent) {
    return new ImmutableNode(scope, content);
  }

  constructor(scope: Symbol, content: NodeContent) {
    super(content);
    this.scope = scope;
  }

  private get isFrozen() {
    return Object.isFrozen(this);
  }

  override get index(): number {
    return this.getIndex();

    // return super.index;

    console.debug('## called index', this.id.toString())
    const parent = this.parent as ImmutableNode;
    if (!parent) {
      return -1
    }
    // console.log('getting index', this.id.toString(), this.isFrozen, parent.isFrozen)
    const index = parent.indexMapper.map(this.indexMap, this.mappedIndex);
    console.debug('found index', this.id.toString(), index)
    return index;
  }

  private getIndex() {
    const parent = this.parent;
    if (!parent) {
      // console.warn('node has no parent', this.id.toString());
      return -1
    }

    // NOTE: this is a performance critical code
    const key = `${parent.contentKey}/${this.id.toString()}`
    return NODE_CACHE_INDEX.get(key, () => {
      const {children = []} = parent;
      return findIndex(children as Node[], n => {
        return this.id.comp(n.id) === 0
      });
    })
  }

  override get key() {
    return `${this.id.toString()}/${this.renderVersion}/${this.contentVersion}`;
  }

  override get contentKey(): string {
    return `${this.id.toString()}/${this.renderVersion}/${this.contentVersion}`;
  }

  override setParent(parent: Optional<Node>) {
    if (this.isFrozen) {
      throw Error('cannot set parent of immutable node:' + this.id.toString())
    }
    super.setParent(parent);
  }

  override setParentId(parentId: Optional<NodeId>) {
    if (this.isFrozen) {
      throw Error('cannot set parent of immutable node:' + this.id.toString())
    }
    super.setParentId(parentId);
  }

  override changeType(type: NodeType) {
    if (this.isFrozen) {
      throw Error('cannot change type of immutable node:' + this.id.toString())
    }
    super.changeType(type);
  }

  override insert(node: ImmutableNode, index: number) {
    if (node.isFrozen) {
      throw Error('cannot insert immutable node:' + node.id.toString())
    }
    super.insert(node, index);

    const indexMap = new IndexMap(index, 1);
    node.indexMap = indexMap;
    node.mappedIndex = index;
    this.indexMapper.add(indexMap);
  }

  override remove(node: ImmutableNode) {
    if (node.isFrozen) {
      throw Error('cannot remove immutable node:' + node.id.toString())
    }
    const index = node.index;
    super.remove(node);

    const indexMap = new IndexMap(index, -1);
    this.indexMapper.add(indexMap);
  }

  override insertText(text: string, offset: number) {
    if (this.isFrozen) {
      throw Error('cannot insert text to immutable node:' + this.id.toString())
    }
    super.insertText(text, offset);
  }

  override removeText(offset: number, length: number) {
    if (this.isFrozen) {
      throw Error('cannot remove text from immutable node:' + this.id.toString())
    }
    super.removeText(offset, length);
  }

  override updateContent(content: ImmutableNode[] | string) {
    if (this.isFrozen) {
      throw Error('cannot update content of immutable node:' + this.id.toString())
    }
    super.updateContent(content);
  }

  override updateProps(props: NodePropsJson) {
    if (this.isFrozen) {
      throw Error('cannot update props of immutable node:' + this.id.toString())
    }
    super.updateProps(props);
  }

  override addLink(name: string, node: ImmutableNode) {
    if (this.isFrozen) {
      throw Error('cannot add link to immutable node:' + this.id.toString())
    }
    super.addLink(name, node);
  }

  override removeLink(name: string) {
    if (this.isFrozen) {
      throw Error('cannot remove link from immutable node:' + this.id.toString())
    }
    return super.removeLink(name);
  }

  override clone(map: (node: NodeContentData) => NodeContentData = identity): Node {
    const data = map(this.content.unwrap());
    const content = new ImmutableNodeContent(this.scope, data);
    const clone = ImmutableNode.create(this.scope, content);

    clone.renderVersion = this.renderVersion;
    clone.contentVersion = this.contentVersion;
    clone.indexMapper = this.indexMapper;
    clone.indexMap = this.indexMap;
    clone.mappedIndex = this.mappedIndex;

    return clone;


    // const {scope,parentId, id, type, links, linkName, props, marks, renderVersion, contentVersion} = this;
    //
    // // console.log('cloning', this.id.toString(), this.isFrozen, map === identity)
    // if (!this.isFrozen && map === identity) {
    //   return this
    // }
    //
    // // console.log('x cloning', this.id.toString())
    // const children = this.children.map(n => map(n)).filter(identity) as ImmutableNode[];
    //
    // const data: NodeContentData = {
    //   parentId,
    //   parent: null,
    //   id,
    //   type,
    //   children,
    //   links,
    //   linkName,
    //   textContent: this.isText ? this.textContent : '',
    //   props: props.clone(),
    //   marks
    // };
    //
    // const content = new ImmutableNodeContent(scope, data);
    // const clone = ImmutableNode.create(scope, content);
    // clone.renderVersion = renderVersion + 1;
    // clone.contentVersion = contentVersion;
    // clone.indexMapper = this.indexMapper;
    // clone.indexMap = this.indexMap;
    // clone.mappedIndex = this.mappedIndex;
    //
    // return clone;
  }

  // @mutates
  freeze() {
    if (this.isFrozen) return this

    // unlink from parent when freezing
    // this.setParent(null)
    this.content.freeze();
    this.props.freeze();

    Object.freeze(this)
    return this;
  }

}

export const NODE_CACHE_INDEX = new CarbonCache();
