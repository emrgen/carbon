import { Box } from "@chakra-ui/react";

import { blockPresetPlugins, node, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { FloatingStyleMenu, InsertBlockMenu } from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { CodeValuePath, corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import { RenderManager, useCreateCachedCarbon } from "@emrgen/carbon-react";
import { Cell, Runtime } from "@emrgen/carbon-reactive";
import { LiveCell, LiveCellRenderer, ReactiveRuntimeContext } from "@emrgen/carbon-reactive-cell";
import { BlockMenuPlugin, CarbonApp } from "@emrgen/carbon-utils";
import * as _ from "lodash";
import { flattenDeep } from "lodash";
import { useEffect, useState } from "react";
import "./test.styl";

const data = node("carbon", [
  node(
    "page",
    [
      title("Reactive cells"),
      node("liveCell", [], {
        [CodeValuePath]: `x = 1`,
      }),
    ],
    {
      [ModePath]: "edit",
    },
  ),
]);

// @ts-ignore
data.id = NodeId.ROOT.toString();

const plugins = [
  ...corePresetPlugins,
  ...blockPresetPlugins,
  new ClipboardPlugin(),
  new LiveCell(),
  new BlockMenuPlugin(),
];

const renderers = [...blockPresetRenderers, LiveCellRenderer];

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

const builtins = Object.assign({
  // Promises: new Library().Promises,
  // now: new Library().now,
  _: _,
  width: () => {
    return 720;
  },
});
// console.log(builtins);
const runtime = Runtime.create(builtins);
// @ts-ignore
window.runtime = runtime;

// runtime.on("fulfilled", (cell) => {
//   console.log(`fulfilled: ${cell.name}`, cell.id, cell.value);
// });

// const mod = runtime.define("mid", "test-module", "0.0.1");
// // @ts-ignore
// window.mod = mod;

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

  useEffect(() => {
    runtime.play();
  }, []);

  return (
    <Box className={"carbon-app-container reactive"} pos={"relative"}>
      <ReactiveRuntimeContext runtime={runtime}>
        <CarbonApp app={app} renderManager={renderManager}>
          <FloatingStyleMenu />
          <InsertBlockMenu />
        </CarbonApp>
      </ReactiveRuntimeContext>
    </Box>
  );
}
