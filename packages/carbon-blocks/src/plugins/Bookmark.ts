import {
  CarbonPlugin,
  Node,
  NodeEncoder,
  NodeSpec,
  Writer,
} from "@emrgen/carbon-core";

export class Bookmark extends CarbonPlugin {
  name = "bookmark";

  spec(): NodeSpec {
    return {
      group: "content",
      isolate: true,
      props: {
        local: {
          html: {
            contentEditable: false,
          },
        },
      },
    };
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    const bookmark = node.props.get(BookmarkInfoPath, {} as BookmarkInfo);
    const title = bookmark.title ?? "Untitled";
    w.write(`\n[${title}](${node.props.get(BookmarkPath, "")})`);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write(`<p><a href="${node.props.get(BookmarkPath, "")}"></a></p>`);
  }
}

export const BookmarkInfoPath = "local/state/bookmark/info";
export const BookmarkPath = "remote/state/bookmark/url";

export interface BookmarkInfo {
  title?: string;
  description?: string;
  link?: string;
  image?: {
    url: string;
    type: string;
  };
  logo?: {
    url: string;
    type: string;
  };
}
