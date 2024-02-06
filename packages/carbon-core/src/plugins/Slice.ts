import {Carbon, CarbonPlugin, Node, NodeEncoder, SerializedNode, Writer} from "../core";

export class SlicePlugin extends CarbonPlugin {

  name = 'slice';

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   const contentNode = node.child(0);
  //   return {
  //     name: node.name,
  //     content: node.children.map(n => react.serialize(n)) as SerializedNode[]
  //   }
  // }

  encode(w: Writer, ne: NodeEncoder<string>, node: Node) {
    node.children.forEach(n => {
      ne.encode(w, n);
    });
  }
}
