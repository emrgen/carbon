import { Box } from "@chakra-ui/react";
import { blockPresetPlugins, node } from "@emrgen/carbon-blocks";
import {
  ActiveCellRuntime,
  ActiveCellRuntimeContext,
  cellRenderer,
} from "@emrgen/carbon-cell";
import { FloatingStyleMenu } from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import {
  CarbonPlugin,
  corePresetPlugins,
  ModePath,
  NodeId,
  StylePath,
} from "@emrgen/carbon-core";
import { designPlugin, designRenderers } from "@emrgen/carbon-design";
import { timelineRenderer } from "@emrgen/carbon-plugin-timeline";
import {
  ObservableQuestions,
  questionExtension,
} from "@emrgen/carbon-question";
import {
  ReactRenderer,
  RenderManager,
  useCreateCarbon,
} from "@emrgen/carbon-react";
import { blockPresetRenderers } from "@emrgen/carbon-react-blocks";
import { CarbonApp } from "@emrgen/carbon-utils";
import { flattenDeep } from "lodash";
import { useState } from "react";
import "./desing.styl";

const plugins: (CarbonPlugin | CarbonPlugin[])[] = [
  corePresetPlugins,
  blockPresetPlugins,
  new ClipboardPlugin(),
  designPlugin,
];

const renderers: (ReactRenderer | ReactRenderer[])[] = [
  blockPresetRenderers,
  questionExtension.renderers,
  cellRenderer,
  timelineRenderer,
  designRenderers,
];
const renderManager = RenderManager.from(flattenDeep(renderers));

export function Design() {
  const [data] = useState(() => {
    const content = node("carbon", [
      node(
        "deBoard",
        [
          node("deTransformer"),
          node("deTransformer", [], {
            [StylePath]: {
              left: "300px",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              top: "300px",
              left: "300px",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              left: "500px",
              transform: "rotateZ(45deg)",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              left: "300px",
              top: "500px",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              left: "500px",
              top: "300px",
            },
          }),
        ],
        {
          [ModePath]: "edit",
        },
      ),
    ]);

    // @ts-expect-error - Expose app to the window for debugging
    content.id = NodeId.ROOT.toString();

    return content;
  });
  const app = useCreateCarbon("tinyquiz.io", data, flattenDeep(plugins));
  const [runtime] = useState<ActiveCellRuntime>(() => {
    return new ActiveCellRuntime({
      Carbon: app,
    });
  });

  window.app = app;

  return (
    <Box className={"carbon-app-container"}>
      <ActiveCellRuntimeContext runtime={runtime}>
        <ObservableQuestions>
          <CarbonApp app={app} renderManager={renderManager}>
            <FloatingStyleMenu />
          </CarbonApp>
        </ObservableQuestions>
      </ActiveCellRuntimeContext>
    </Box>
  );
}
