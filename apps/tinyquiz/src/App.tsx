import "./App.styl";
import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { blockPresetPlugins, node } from "@emrgen/carbon-blocks";
import { title } from "@emrgen/carbon-blocks";
import { text } from "@emrgen/carbon-blocks";
import { RenderManager } from "@emrgen/carbon-react";
import { useCreateCarbon } from "@emrgen/carbon-react";
import { ReactRenderer } from "@emrgen/carbon-react";
import { CarbonPlugin } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { corePresetPlugins } from "@emrgen/carbon-core";
import { ModePath } from "@emrgen/carbon-core";
import { CarbonApp } from "@emrgen/carbon-utils";
import { ActiveCellRuntimeContext } from "@emrgen/carbon-cell";
import { ActiveCellRuntime } from "@emrgen/carbon-cell";
import { cellPlugin } from "@emrgen/carbon-cell";
import { cellRenderer } from "@emrgen/carbon-cell";
import { flattenDeep } from "lodash";
import { ObservableQuestions } from "@emrgen/carbon-question";
import { questionExtension } from "@emrgen/carbon-question";
import { blockPresetRenderers } from "@emrgen/carbon-react-blocks";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";

const data = node("carbon", [
  node(
    "document",
    [title([text("Tiny Quiz")]), node("sandbox", [node("cell")])],
    {
      [ModePath]: "edit",
    },
  ),
]);

// @ts-expect-error - Expose app to the window for debugging
data.id = NodeId.ROOT.toString();

const plugins: (CarbonPlugin | CarbonPlugin[])[] = [
  corePresetPlugins,
  blockPresetPlugins,
  cellPlugin,
  questionExtension.plugins,
  new ClipboardPlugin(),
];

const renderers: (ReactRenderer | ReactRenderer[])[] = [
  blockPresetRenderers,
  questionExtension.renderers,
  cellRenderer,
];
const renderManager = RenderManager.from(flattenDeep(renderers));

export default function App() {
  const app = useCreateCarbon("tinyquiz.io", data, flattenDeep(plugins));
  const [runtime] = useState<ActiveCellRuntime>(() => {
    return new ActiveCellRuntime({
      Carbon: app,
    });
  });

  // @ts-expect-error - Expose app to the window for debugging
  window.app = app;

  return (
    <Box className={"carbon-app-container"}>
      <ActiveCellRuntimeContext runtime={runtime}>
        <ObservableQuestions>
          <CarbonApp app={app} renderManager={renderManager}></CarbonApp>
        </ObservableQuestions>
      </ActiveCellRuntimeContext>
    </Box>
  );
}
