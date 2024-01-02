import {Node, NodeContentData} from "@emrgen/carbon-core";
import {identity, map} from "lodash";
import {SolidNodeContent} from "./SolidNodeContent";

let nodeCounter = 0;

export class SolidNode extends Node {
  counter = 0;

  constructor(content: SolidNodeContent) {
    super(content);
    this.counter = ++nodeCounter;
    // console.log('CREATING NODE', this.id.toString(), this.counter)
  }

  override get key(): string {
    return `${this.id.toString()}-${this.counter}`;
  }

  override get index(): number {
    const index = super.index;
    if (index === -1 && !this.isRoot) {
      throw new Error('node has no parent');
    }
    console.log('got index', this.id.toString(), index, this.parent)

    return index;
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
