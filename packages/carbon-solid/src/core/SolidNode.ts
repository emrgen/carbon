import {BlockContent, Node, NodeCreateProps, NodeProps, NodePropsJson} from '@emrgen/carbon-core';
import {Optional} from "@emrgen/types";
import {identity, map} from "lodash";
import {NodeContent, NodeId, NodeType} from "@emrgen/carbon-core";
import {createSignal, Signal} from "solid-js";
import {createMutable, createStore, SetStoreFunction, unwrap} from "solid-js/store";
import {Store} from "solid-js/store";


interface SolidNodeCreateProps extends NodeCreateProps {
  store: Store<NodeStore>;
}

interface NodeStore {
  parent: Optional<Node>;
  type: NodeType;
  children: Node[];
  textContent: string;
}


// when the state is updated can we collect enough log to revert/rollback on error
//

// at the lowest level there are following ops
// insert
// remove
// update
// change type
// update props

export class SolidNode extends Node {
  private readonly store: Store<NodeStore>;

  static create(props: NodeCreateProps): SolidNode {
    const store = createMutable({
      parent: props.parent,
      type: props.type,
      children: props.content.children,
      textContent: props.content.textContent,
    });

    return new SolidNode({
      ...props,
      ...store,
      content: BlockContent.empty(),
      store,
    });
  }

  constructor(props: SolidNodeCreateProps) {
    super(props);
    props.store.children.forEach((child) => {
      child.setParent(this);
      child.setParentId(this.id);
    });
    this.store = props.store;
  }

  override get key(): string {
    return this.id.toString();
  }

  override get textContent(): string {
    return this.store.textContent;
  }

  override get children(): Node[] {
    return this.store.children
  }

  override get parent(): Optional<Node> {
    // console.log("get parent", this._parent)
    return this.store.parent;
  }

  override get chain(): Node[] {
    const chain: Node[] = [];
    let parent: Optional<Node> = this;
    while (parent) {
      chain.push(parent);
      parent = parent.parent;
    }

    return chain;
  }

  override setParentId(parentId: Optional<NodeId>) {
    this.parentId = parentId;
  }

  override setParent(parent: Optional<Node>) {
    this.store.parent = parent;
  }

  override insert(node: Node, index: number) {
    this.store.children.splice(index, 0, node);
  }

  override remove(node: Node) {
    this.store.children.splice(node.index, 1);
  }

  override updateContent(content: NodeContent) {
    content.children.forEach((child) => {
      child.setParent(this);
      child.setParentId(this.id);
    });
    this.store.textContent = content.textContent;
    this.store.children = content.children;
    console.log(unwrap(this.store))
  }

  override changeType(type: NodeType) {
    this.store.type = type;
  }

  override updateProps(props: NodePropsJson) {
    // throw new Error("Method not implemented.");
  }

  // we don't need to clone the node
  clone(): SolidNode {
    return this
  }

  // solid js states are mutable using signals
  // so we don't need to freeze the state
  freeze(): this {
    return this;
  }
}
