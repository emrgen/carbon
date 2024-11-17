import {
  EmojiPath,
  InlineAtom,
  Node,
  NodeEncoder,
  PinnedSelection,
  Transaction,
  Writer,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

declare module "@emrgen/carbon-core" {
  interface Transaction {
    emoji: {
      replace: (selection: PinnedSelection, emoji: string) => Optional<Transaction>;
    }
  }
}

export class Emoji extends InlineAtom {
  name = "emoji";

  commands(): Record<string, Function> {
    return {
      replace: this.replace,
    }
  }

  replace(tr: Transaction, selection: PinnedSelection, emoji: string) {}

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    w.write(node.props.get(EmojiPath));
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    // super.encodeHtml(w, ne, node);
  }
}


