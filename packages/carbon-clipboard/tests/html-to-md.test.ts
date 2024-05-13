import { test } from "vitest";
import { parseHtml } from "../src/parser/html";

test("html to markdown", () => {
  const tree = parseHtml(
    `<code><pre style="font-family:'JetBrains Mono',monospace;font-size:9.8pt;"><span style="color:#56a8f5;">deFromJSON</span>(<span style="color:#a9b7c6;">start</span>)!;</pre></code>`,
  );

  console.log(JSON.stringify(tree, null, 2));
});
