import { Box } from "@chakra-ui/react";
import { blockPresetPlugins, node } from "@emrgen/carbon-blocks";
import {
  ActiveCellRuntime,
  ActiveCellRuntimeContext,
  cellRenderer,
} from "@emrgen/carbon-cell";
import { DocumentSaveStatus } from "@emrgen/carbon-chakra-ui/src/components/DocumentSaveStatus";
import { FloatingStyleMenu } from "@emrgen/carbon-chakra-ui/src/components/FloatingStyleMenu";
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
import { questionExtension } from "@emrgen/carbon-question";
import {
  ReactRenderer,
  RenderManager,
  useCreateCachedCarbon,
} from "@emrgen/carbon-react";
import { blockPresetRenderers } from "@emrgen/carbon-react-blocks";
import { CarbonApp } from "@emrgen/carbon-utils/src/components/CarbonAppDocument";
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
          node("deTransformer", [], {
            [StylePath]: {
              background: "pink",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              left: "300px",
              background: "pink",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              top: "300px",
              left: "300px",
              background: "teal",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              left: "500px",
              transform: "rotateZ(45deg)",
              background: "pink",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              left: "300px",
              top: "500px",
              background: "purple",
            },
          }),
          node("deTransformer", [], {
            [StylePath]: {
              left: "500px",
              top: "300px",
              background: "pink",
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
  const app = useCreateCachedCarbon("design", data, flattenDeep(plugins));
  const [runtime] = useState<ActiveCellRuntime>(() => {
    return new ActiveCellRuntime({
      Carbon: app,
    });
  });

  return (
    <Box className={"carbon-app-container"}>
      <ActiveCellRuntimeContext runtime={runtime}>
        <CarbonApp app={app} renderManager={renderManager}>
          <FloatingStyleMenu />
          <DocumentSaveStatus />
        </CarbonApp>
      </ActiveCellRuntimeContext>
    </Box>
  );
}
