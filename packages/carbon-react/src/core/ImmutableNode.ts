import {
  Node as CoreNode,
  NodeContent,
  NodeData,
  NodeId,
  NodePropsJson,
  NodeType
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {identity} from "lodash";
import {ImmutableNodeContent} from "./ImmutableNodeContent";

export class ImmutableNode extends CoreNode {
  scope: Symbol

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


  override get key() {
    return `${this.id.toString()}/${this.renderVersion}/${this.contentVersion}`;
  }

  override get contentKey(): string {
    return `${this.id.toString()}/${this.renderVersion}/${this.contentVersion}`;
  }

  override setParent(parent: Optional<ImmutableNode>) {
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
  }

  override remove(node: ImmutableNode) {
    if (node.isFrozen) {
      throw Error('cannot remove immutable node:' + node.id.toString())
    }
    super.remove(node);
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

  override clone(map: (node: CoreNode) => Optional<ImmutableNode> = identity): ImmutableNode {
    const {scope,parentId, id, type, links, linkName, props, renderVersion, contentVersion} = this;

    const children = this.children.map(n => n.clone(map));

    const data: NodeData = {
      parentId,
      parent: null,
      id,
      type,
      children,
      links,
      linkName,
      textContent: this.isText ? this.textContent : '',
      props: props.clone(),
    };

    const content = new ImmutableNodeContent(scope, data);
    const clone = ImmutableNode.create(scope, content);
    clone.renderVersion = renderVersion + 1;
    clone.contentVersion = contentVersion;

    return clone;
  }

  // @mutates
  freeze() {
    if (this.isFrozen) return this

    // unlink from parent when freezing
    this.setParent(null)
    this.content.freeze();
    this.props.freeze();

    Object.freeze(this)
    return this;
  }

}
