import {
  AtomContentPath,
  AtomSizePath,
  EmojiPath,
  NodeId,
} from "@emrgen/carbon-core";
import { ContenteditablePath } from "@emrgen/carbon-core";
import { SuppressContenteditableWarningPath } from "@emrgen/carbon-core";
import { isString } from "lodash";

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

export const attribute = (props = {}) => ({
  name: "attribute",
  props,
});

export const node = (
  name: string,
  children: any[] = [],
  props = {},
  links = {},
) => ({
  name,
  children,
  links,
  props,
});

export const empty = (props = {}) => ({
  name: "empty",
  props,
});

export const title = (children: any[] | any = []) => {
  if (isString(children)) {
    children = [text(children)];
  } else if (!Array.isArray(children)) {
    children = [children];
  }

  return {
    name: "title",
    children,
  };
};

export const section = (children: any[] | any = [], props = {}) => {
  if (!Array.isArray(children)) {
    children = [children];
  }

  return {
    name: "section",
    children,
    props,
  };
};

export const mention = (name: string) => {
  return node("mention", [
    // node("empty", [], {
    //   [ContenteditablePath]: false,
    //   [SuppressContenteditableWarningPath]: false,
    // }),
    node(`atomicText`, [], {
      [ContenteditablePath]: false,
      [SuppressContenteditableWarningPath]: true,
      [AtomContentPath]: `@${name}`,
      [AtomSizePath]: 1,
    }),
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
