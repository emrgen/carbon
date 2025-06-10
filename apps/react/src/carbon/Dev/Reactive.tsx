import { Box } from "@chakra-ui/react";

import { blockPresetPlugins, node, text, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { FloatingStyleMenu, InsertBlockMenu } from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import { RenderManager, useCreateCachedCarbon } from "@emrgen/carbon-react";
import { Cell, Promises, Runtime } from "@emrgen/carbon-reactive";
import { ReactiveRuntimeContext } from "@emrgen/carbon-reactive-cell";
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
  Promises: Promises,
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

// mod.define(Cell.parse("birds = penguins", { name: "birds" }));
// mod.define(Cell.parse("x = 10"));
// mod.define(Cell.parse("y = x+10"));
// mod.define(Cell.parse("z = {while(1) { yield Promises.delay(1000, x); } }"));
// mod.define(Cell.parse(`a = z + 10`));

export function Reactive() {
  const [content] = useState(() => {
    return data;
  });
  const app = useCreateCachedCarbon("reactive", content, flattenDeep(plugins));
  // @ts-ignore
  window.app = app;

  return (
    <Box className={"carbon-app-container"} pos={"relative"}>
      <ReactiveRuntimeContext runtime={runtime}>
        <CarbonApp app={app} renderManager={renderManager}>
          <FloatingStyleMenu />
          <InsertBlockMenu />
        </CarbonApp>
      </ReactiveRuntimeContext>
    </Box>
  );
}
