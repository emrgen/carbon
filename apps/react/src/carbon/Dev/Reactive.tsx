import { Box } from "@chakra-ui/react";

import { blockPresetPlugins, node, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { FloatingStyleMenu, InsertBlockMenu } from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { CodeValuePath, corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import { RenderManager, useCreateCachedCarbon } from "@emrgen/carbon-react";
import { Runtime } from "@emrgen/carbon-reactive";
import { LiveCell, LiveCellRenderer, ReactiveRuntimeContext } from "@emrgen/carbon-reactive-cell";
import { BlockMenuPlugin, CarbonApp } from "@emrgen/carbon-utils";
import { Library } from "@observablehq/stdlib";
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

// experimental: add a width function to the runtime
const width = () => {
  const page = document.querySelector(".cpage.page");
  console.log(page);
  if (!page) return window.innerWidth;
  return page.clientWidth;
};

const builtins = Object.assign(new Library(), {
  _: _,
  width: () => {
    return width();
  },
});
// console.log(builtins);
const runtime = Runtime.create(builtins);
// @ts-ignore
window.runtime = runtime;

export function Reactive() {
  const [content] = useState(() => {
    return data;
  });

  const app = useCreateCachedCarbon("reactive", content, flattenDeep(plugins));
  // @ts-ignore
  window.app = app;

  // play the runtime after the app is mounted
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
