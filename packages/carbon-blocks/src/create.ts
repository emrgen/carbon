import {
  AtomContentPath,
  AtomSizePath,
  EmojiPath,
  NodeId,
} from "@emrgen/carbon-core";

export const text = (text: string = "", props = {}) => ({
  name: "text",
  text,
  props,
});

export const carbon = (children: any[] = [], props = {}) => ({
  id: NodeId.ROOT.toString(),
  name: "carbon",
  children,
  props,
});

export const block = ({
  name,
  children = [],
  links = {},
  props = {},
}: {
  name: string;
  children?: any[];
  links?: Record<string, any>;
  props?: any;
}) => ({
  name,
  children,
  links,
  props,
});

export const node = (name: string, children: any[] = [], props = {}) => ({
  name,
  children,
  props,
});

export const title = (children: any[] = []) => ({
  name: "title",
  children,
});

export const section = (children: any[] = [], props = {}) => ({
  name: "section",
  children,
  props,
});

export const mention = (name: string) => {
  return node("mention", [
    node("empty"),
    node("mentionAtom", [], {
      [AtomContentPath]: `@${name}`,
      [AtomSizePath]: name.length + 1,
    }),
    node("empty"),
  ]);
};

export const emoji = (emoji: string) => {
  return node("emoji", [], {
    [EmojiPath]: emoji,
    [AtomContentPath]: emoji,
    [AtomSizePath]: `${emoji}`.length,
  });
};

export const para = (children: any[] = [], attrs = {}, state = {}) => ({
  name: "paragraph",
  children,
  attrs,
  state,
});
