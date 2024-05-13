import { NodeHtmlMarkdown } from "node-html-markdown";
import { parseText } from "./text";

// parse: html(text) -> markdown(text) -> carbon content json
export const parseHtml = (html: string) => {
  // const turndown = new TurndownService({ preformattedCode: true });
  // console.log(turndown.turndown(html));
  const markdown = NodeHtmlMarkdown.translate(html, {});

  console.log("html to markdown\n", markdown);
  return parseText(markdown);
};
