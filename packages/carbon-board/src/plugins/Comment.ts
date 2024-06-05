import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Comment extends CarbonPlugin {
  name = "sqComment";

  spec(): NodeSpec {
    return {
      group: "sqItem sqColumnItem sqCard",
      content: "sqCommentLine",
      isolate: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            className: "sqItem",
            contentEditable: false,
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new CommentLine()];
  }
}

class CommentLine extends CarbonPlugin {
  name = "sqCommentLine";

  spec(): NodeSpec {
    return {
      content: "sqTitle",
      isolate: true,
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            className: "sqItem",
            contentEditable: false,
          },
        },
      },
    };
  }
}
