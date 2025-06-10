import { Box } from "@chakra-ui/react";

import { blockPresetPlugins, node, text, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { FloatingStyleMenu, InsertBlockMenu } from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import { RenderManager, useCreateCachedCarbon } from "@emrgen/carbon-react";
import { Cell, Runtime } from "@emrgen/carbon-reactive";
import { CarbonApp } from "@emrgen/carbon-utils";
import lodash, { flattenDeep } from "lodash";
import { useState } from "react";
import "./test.styl";

const data = node("carbon", [
  node("page", [title([text("Reactive cells")])], {
    [ModePath]: "edit",
  }),
]);

// @ts-ignore
data.id = NodeId.ROOT.toString();

const plugins = [...corePresetPlugins, ...blockPresetPlugins, new ClipboardPlugin()];

const renderers = [...blockPresetRenderers];

const renderManager = RenderManager.from(flattenDeep(renderers));

// console.log = noop;
// console.info = noop;
// console.debug = noop;
// console.warn = noop;
// console.error = noop;
// console.group = noop;
// console.groupCollapsed = noop;
// console.groupEnd = noop;
// console.time = noop;

// @ts-ignore
window.Cell = Cell;

const runtime = Runtime.create("test", "0.0.1", {
  _: lodash,
  penguins: [
    {
      name: "Emrgen",
      age: 3,
      species: "Emperor Penguin",
    },
  ],
});
// @ts-ignore
window.runtime = runtime;

runtime.on("fulfilled", (cell) => {
  console.log(`fulfilled: ${cell.name}`, cell.value);
});

const mod = runtime.define("mid", "test-module", "0.0.1");
// @ts-ignore
window.mod = mod;

mod.define(Cell.from("data", "data", ["penguins"], (x) => x));
mod.define(Cell.from("x", "x", [], () => 10));

export function Reactive() {
  const [content] = useState(() => {
    return data;
  });
  const app = useCreateCachedCarbon("reactive", content, flattenDeep(plugins));
  // @ts-ignore
  window.app = app;

  return (
    <Box className={"carbon-app-container"} pos={"relative"}>
      <CarbonApp app={app} renderManager={renderManager}>
        <FloatingStyleMenu />
        <InsertBlockMenu />
      </CarbonApp>
    </Box>
  );
}
