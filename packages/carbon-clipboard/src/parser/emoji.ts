import { AtomContentPath, AtomSizePath, EmojiPath } from "@emrgen/carbon-core";
import emojiRegex from "emoji-regex";

const emoji = (emoji: string) => {
  return {
    name: "emoji",
    props: {
      [EmojiPath]: emoji,
      [AtomContentPath]: emoji,
      [AtomSizePath]: `${emoji}`.length,
    },
  };
};

export function parseEmoji(text: string) {
  const regex = emojiRegex();
  const tokens: any[] = [];

  let index = 0;
  let match;
  while ((match = regex.exec(text)) != null) {
    const content = text.slice(index, match.index);
    if (content.length) {
      tokens.push({
        name: "text",
        text: text.slice(index, match.index),
      });
    }

    tokens.push(emoji(match[0]));
    index = match.index + match[0].length;
  }

  if (tokens.length === 0) {
    return {
      name: "text",
      text,
    };
  }

  return tokens;
}