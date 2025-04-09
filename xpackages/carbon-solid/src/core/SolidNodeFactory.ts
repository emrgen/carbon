import {
  Maps,
  Node,
  NodeContentData,
  NodeFactory,
  NodeId,
  PlainNodeProps,
  Schema,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { isEmpty } from "lodash";
import { SolidNodeContent } from "./SolidNodeContent";
import { SolidNode } from "./SolidNode";

let counter = 0;

export class SolidNodeFactory implements NodeFactory {
  blockId() {
    return NodeId.fromString("[" + ++counter + "]");
  }

  textId() {
    return NodeId.fromString("(" + ++counter + ")");
  }

  create(json: any, schema: Schema): Optional<Node> {
    const { id, name, children = [], text } = json;
    const type = schema.type(name);
    if (!type) {
      throw new Error(`Node Plugin is not registered ${name}`);
    }

    const properties = isEmpty(json.props)
      ? type.props
      : type.props.merge(json.props);
    const props = PlainNodeProps.create(properties.toJSON());
    props.set("local/html/suppressContentEditableWarning", false);

    const nodeId = id ? NodeId.deserialize(id)! : this.textId();
    const nodes = children.map((n: any) => schema.nodeFromJSON(n));
    const content = SolidNodeContent.create({
      id: nodeId,
      type,
      children: nodes,
      props,
      textContent: text,
      parentId: null,
      parent: null,
      links: {},
      linkName: "",
    });

    const node = new SolidNode(content);
    node.children.forEach((n: Node) => {
      n.setParent(node);
      n.setParentId(node.id);
    });

    return node;
  }

  clone(
    node: Node,
    map: Maps<
      Omit<NodeContentData, "children">,
      Omit<NodeContentData, "children">
    >,
  ): Node {
    const clone = new SolidNode(
      SolidNodeContent.create({
        ...map(node.unwrap()),
        children: node.children.map((n) => this.clone(n, map)),
      }),
    );

    // update children parent
    clone.children.forEach((n) => {
      n.setParentId(clone.id);
      n.setParent(clone);
    });

    console.debug("setting parent to be null", node.id.toString());
    // clone.setParent(null);
    // clone.setParentId(null);

    return clone;
  }
}
