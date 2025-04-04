import {Node, NodeContentData} from "@emrgen/carbon-core";
import {identity, map} from "lodash";
import {SolidNodeContent} from "./SolidNodeContent";

let nodeCounter = 0;

export class SolidNode extends Node {
  counter = 0;

  constructor(content: SolidNodeContent) {
    super(content);
    this.counter = ++nodeCounter;
  }

  override get key(): string {
    return `${this.id.toString()}-${this.counter}/${this.contentVersion}`;
  }

  override get index(): number {
    const index = super.index;
    if (index === -1 && !this.isRoot) {
      throw new Error('node has no parent');
    }
    // console.log('got index', this.id.toString(), index, this.parent)

    return index;
  }

  get renderVersion(): number {
    return this.content.renderVersion!;
  }

  set renderVersion(version: number) {
    this.content.renderVersion = version;
  }

  get contentVersion(): number {
    return this.content.contentVersion!;
  }

  set contentVersion(version: number) {
    this.content.contentVersion = version;
  }

  override clone(map: (node: NodeContentData) => NodeContentData = identity): Node {
    console.log('clone', this.id.toString())
    const data = map(this.content.unwrap());
    const content = new SolidNodeContent(this.id, data);
    const clone = new SolidNode(content);

    clone.renderVersion = this.renderVersion;
    clone.contentVersion = this.contentVersion;

    return clone;
  }
}
