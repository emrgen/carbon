import { Box } from "@chakra-ui/react";
import { blockPresetPlugins, node } from "@emrgen/carbon-blocks";
import { ActiveCellRuntime, cellRenderer } from "@emrgen/carbon-cell";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import {
  CarbonPlugin,
  corePresetPlugins,
  ModePath,
  NodeId,
  StylePath,
} from "@emrgen/carbon-core";
import { Affine, designPlugin, designRenderers } from "@emrgen/carbon-design";
import { timelineRenderer } from "@emrgen/carbon-plugin-timeline";
import { questionExtension } from "@emrgen/carbon-question";
import {
  ReactRenderer,
  RenderManager,
  useCreateCachedCarbon,
} from "@emrgen/carbon-react";
import { blockPresetRenderers } from "@emrgen/carbon-react-blocks";
import { flattenDeep } from "lodash";
import { CSSProperties, useState } from "react";
import "./desing.styl";
import {
  applyToPoint,
  compose,
  rotateDEG,
  scale,
  toCSS,
  translate,
} from "transformation-matrix";

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

  const [poc1Style] = useState({
    position: "absolute",
    width: 100,
    height: 100,
    background: "red",
    transform: toCSS(compose(translate(100, 100), rotateDEG(45))),
  });

  const [poc2Style] = useState<CSSProperties>({
    position: "absolute",
    width: 100,
    height: 100,
    background: "blue",
    transform: toCSS(compose(translate(200, 200), rotateDEG(0, 50, 100))),
  });
  window.app = app;

  const tm = Affine.fromCSS(poc2Style);

  const p = applyToPoint(compose(scale(2, 2, 200, 200 - 70.71)), {
    x: 200,
    y: 200,
  });
  console.log(p);

  tm.translate(100, 100).rotate(45).translate(100, 0).scale(1, 1);
  // console.log(tm.toCSS());

  return (
    <Box className={"carbon-app-container"}>
      <Box style={poc1Style}>12</Box>
      <Box style={poc2Style}>12</Box>

      {/*<Box bg={"red"} style={tm.toCSS()} />*/}
      {/*<ActiveCellRuntimeContext runtime={runtime}>*/}
      {/*  <CarbonApp app={app} renderManager={renderManager}>*/}
      {/*    <FloatingStyleMenu />*/}
      {/*    <DocumentSaveStatus />*/}
      {/*  </CarbonApp>*/}
      {/*</ActiveCellRuntimeContext>*/}
    </Box>
  );
}
