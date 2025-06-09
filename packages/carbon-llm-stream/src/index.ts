import { Optional } from "@emrgen/types";
import { EventEmitter } from "events";

enum MarkdownNodeType {
  Text = "text",
  Heading = "heading",
  Paragraph = "paragraph",
  List = "list",
  Blockquote = "blockquote",
  CodeBlock = "code_block",
  HorizontalRule = "horizontal_rule",
  Link = "link",
  Image = "image",
  Table = "table",
  Emphasis = "emphasis",
  StrongEmphasis = "strong_emphasis",
  Strikethrough = "strikethrough",
  InlineCode = "inline_code",
}

// MarkdownNode is a base class for all markdown nodes.
class MarkdownNode {
  constructor(
    public readonly id: number = 0,
    public readonly content: string = "",
    public readonly type: MarkdownNodeType,
  ) {}

  // Implement parsing logic here, should return a ParseNode with the best effort parsing
  public parse(): ParseNode {
    return new ParseNode(this.id, this.content, this.type);
  }
}

// ParseNode is a node that can be parsed from markdown content.
class ParseNode {
  constructor(
    public readonly id: number,
    public readonly content: string,
    public readonly type: string = "markdown",
  ) {}

  // Implement parsing logic here, should return a MarkdownNode with the best effort parsing
  public parse(): Optional<MarkdownNode> {
    throw new Error("ParseNode.parse() not implemented");
  }
}

// MarkdownStreamParser is a parser for streaming markdown content.
class MarkdownStreamParser extends EventEmitter {
  private buffer: string = "";
  private id = 0;

  constructor(private readonly delimiter: string = "\n") {
    super();
  }

  // look for top level block delimiter to emit a node
  // this method is called when new data is received
  // when a block is found, it emits a node
  // if the block is not complete, it keeps buffering and emit a partial node
  // partial nodes are treated as incomplete blocks and treated as text block
  public onData(data: string) {
    this.buffer += data;
    // look for block delimiter
  }

  // emit a node when a block is found
  public emitNode(node: MarkdownNode) {
    this.emit("node", node);
  }
}
