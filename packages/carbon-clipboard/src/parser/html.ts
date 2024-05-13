import { NodeHtmlMarkdown } from "node-html-markdown";
import { parseText } from "./text";

// parse: html(text) -> markdown(text) -> carbon content json
export const parseHtml = (html: string) => {
  const markdown = NodeHtmlMarkdown.translate(html);

  console.log("html to markdown", markdown);
  return parseText(markdown);
};
