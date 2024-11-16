import {
  EmojiPath,
  InlineAtom,
  Node,
  NodeEncoder,
  Writer,
} from "@emrgen/carbon-core";

export class Emoji extends InlineAtom {
  name = "emoji";

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    w.write(node.props.get(EmojiPath));
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    // super.encodeHtml(w, ne, node);
  }
}


