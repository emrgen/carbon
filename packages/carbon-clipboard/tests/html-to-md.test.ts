import { test } from "vitest";
import { parseHtml } from "../src/parser/html";

test("html to markdown", () => {
  const tree = parseHtml(`
<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-2b455de4-7fff-53af-826f-570ff2b5c99f">
<h1 dir="ltr" style="line-height:1.2;margin-right: 15pt;margin-top:30pt;margin-bottom:0pt;"><span style="font-size:9pt;font-family:'Open Sans',sans-serif;color:#2079c7;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">RIENCE</span></h1>
<h2 dir="ltr" style="line-height:1.2;margin-right: 15pt;margin-top:16pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Merriweather,serif;color:#000000;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Company, </span><span style="font-size:11pt;font-family:Merriweather,serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Location — </span><span style="font-size:11pt;font-family:Merriweather,serif;color:#000000;background-color:transparent;font-weight:400;font-style:italic;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Job Title</span></h2><h3 dir="ltr" style="line-height:1.2;margin-right: 15pt;margin-top:5pt;margin-bottom:5pt;"><span style="font-size:8pt;font-family:'Open Sans',sans-serif;color:#666666;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">MONTH 20XX - </span></h3></b>`);

  console.log(JSON.stringify(tree, null, 2));
});
