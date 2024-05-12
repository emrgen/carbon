import { NodeHtmlMarkdown } from "node-html-markdown";
import { lexer } from "marked";

// parse html(text) -> markdown(text) -> carbon content json
export const parseHtml = (html: string) => {
  const markdown = NodeHtmlMarkdown.translate(html);
  console.log(markdown);
  return lexer(`**# RIENCE**

**## Company, Location — Job Title**

**### MONTH 20XX -** `);
  // return markdown;
  // return parseText(markdown);
};
