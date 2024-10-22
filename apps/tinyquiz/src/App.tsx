import "./App.styl";
import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { blockPresetPlugins, node } from "@emrgen/carbon-blocks";
import { title } from "@emrgen/carbon-blocks";
import { text } from "@emrgen/carbon-blocks";
import { section } from "@emrgen/carbon-blocks";
import { RenderManager } from "@emrgen/carbon-react";
import { useCreateCarbon } from "@emrgen/carbon-react";
import { ReactRenderer } from "@emrgen/carbon-react";
import { CarbonPlugin } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { corePresetPlugins } from "@emrgen/carbon-core";
import { ModePath } from "@emrgen/carbon-core";
import { ActivatedPath } from "@emrgen/carbon-core";
import { TitlePath } from "@emrgen/carbon-core";
import { MarksPath } from "@emrgen/carbon-core";
import { Mark } from "@emrgen/carbon-core";
import { CollapsedPath } from "@emrgen/carbon-core";
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
import { CodeCellCodeValuePath } from "@emrgen/carbon-cell/src/constants";

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
  const [data] = useState(() => {
    const data = node("carbon", [
      node(
        "document",
        [
          title([text("Tiny Quiz")]),
          section([text("Welcome to Tiny Quiz!")]),
          section([text("A platform to create and share quizzes.")]),
          node("h1", [title("Blocks")]),
          node("divider"),
          node("h2", [title("Headers")]),
          node("h1", [title("Header 1")]),
          node("h2", [title("Header 2")]),
          node("h3", [title("Header 3")]),
          node("h4", [title("Header 4")]),

          node("h2", [title("Text")]),
          section([text("This is a text block.")]),

          node("h2", [title("Callout")]),
          node("callout", [
            text("Laws of Motion", {
              [MarksPath]: [Mark.BOLD],
            }),
            node("numberList", [
              title(
                text(
                  "An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
                ),
              ),
            ]),
            node("numberList", [
              title(text("Force equals mass times acceleration (F = ma).")),
            ]),

            node("numberList", [
              title(
                text(
                  "For every action, there is an equal and opposite reaction.",
                ),
              ),
            ]),
          ]),

          node("tabs", [
            node(
              "tab",
              [
                section([
                  title([
                    text("MAC", {
                      [MarksPath]: [Mark.BOLD],
                    }),
                    text(
                      " can refer to a line of Apple computers, a hardware identifier for devices on a network, or a data center infrastructure management software",
                    ),
                  ]),
                ]),
              ],
              {
                [ActivatedPath]: true,
                [TitlePath]: "Mac",
              },
            ),
            node(
              "tab",
              [
                section([
                  title([
                    text("Linux ", {
                      [MarksPath]: [Mark.BOLD],
                    }),
                    text(
                      " is an open-source operating system (OS) that's used on many devices, including smartphones, computers, and supercomputers",
                    ),
                  ]),
                ]),
              ],
              {
                [TitlePath]: "Linux",
              },
            ),
            node(
              "tab",
              [
                section([
                  title([
                    text("Windows ", {
                      [MarksPath]: [Mark.BOLD],
                    }),
                    text(
                      " is an operating system (OS) developed by Microsoft that allows users to use a compute",
                    ),
                  ]),
                ]),
              ],
              {
                [TitlePath]: "Windows",
              },
            ),
          ]),
          node("h2", [title("Active Cell")]),
          node("sandbox", [
            node("cell", [], {
              [CollapsedPath]: true,
              [CodeCellCodeValuePath]: `{
  let pos = {x:0, y: 0}
  const onMove = (e) => {
    pos.x = e.screenX
    pos.y = e.screenY
  } 

  window.removeEventListener('mousemove', onMove)
  window.addEventListener('mousemove', onMove)
  while(true) {
    await Promises.delay(10)
    yield \`MouseEvent: {x: \${pos.x}, y: \${pos.y}}\`
  }
}`,
            }),
          ]),
          node("sandbox", [
            node("cell", [], {
              [CollapsedPath]: true,
              [CodeCellCodeValuePath]: `tex\`F = m.f\``,
            }),
          ]),
        ],
        {
          [ModePath]: "edit",
        },
      ),
    ]);

    // @ts-expect-error - Expose app to the window for debugging
    data.id = NodeId.ROOT.toString();

    return data;
  });
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
