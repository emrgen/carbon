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
import { ViewStylePath } from "@emrgen/carbon-cell/src/constants";

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

export default function TinyQuiz() {
  const [data] = useState(() => {
    const data = node("carbon", [
      node(
        "document",
        [
          title([text("Welcome to TinyQuiz")]),
          section(title([text("A platform to create and share quizzes.")])),
          // node("h1", [title("Blocks")]),
          // node("divider"),
          // node("h2", [title("Headers")]),
          // node("h1", [title("Header 1")]),
          // node("h2", [title("Header 2")]),
          // node("h3", [title("Header 3")]),
          // node("h4", [title("Header 4")]),
          //
          // node("h2", [title("Text")]),
          // section([title(text("This is a text block."))]),
          //
          // node("h2", [title("Callout")]),
          node("callout", [
            text("Moye Moye", {
              [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
            }),
            node("section", [
              title(
                text(
                  `"Moye Moye" is a song by Serbian singer Teya Dora, also known as Teodora Pavlovska. The song's actual title is "Moje More", but the song's clip has "Moye Moye" written on it. The song's meaning is "my bad dream".`,
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
                      [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
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
                      [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
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
                      [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
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
          section(title([])),
          node("h4", [title("Diagrams")]),
          node("sandbox", [
            node("cell", [], {
              [CollapsedPath]: true,
              [ViewStylePath]: {
                display: "flex",
                justifyContent: "center",
              },
              [CodeCellCodeValuePath]: `// https://mermaid.js.org/syntax/flowchart.html
mermaid\` classDiagram

class User
    User : +String id
    User : +String name

class RootUser
  RootUser : +String 
  RootUser : +String owner

User <|-- RootUser
\``,
            }),
          ]),
          node("sandbox", [
            node("cell", [], {
              [CollapsedPath]: true,
              [ViewStylePath]: {
                display: "flex",
                justifyContent: "center",
                paddingTop: "40px",
                height: "400px",
              },
              [CodeCellCodeValuePath]: `// https://mermaid.js.org/syntax/flowchart.html
mermaid\`pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\``,
            }),
          ]),
          node("sandbox", [
            node("cell", [], {
              [CollapsedPath]: true,
              [ViewStylePath]: {
                display: "flex",
                justifyContent: "center",
                paddingTop: "40px",
                height: "200px",
              },
              [CodeCellCodeValuePath]: `// https://mermaid.js.org/syntax/flowchart.html
mermaid\`gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
        A task          :a1, 2014-01-01, 30d
        Another task    :after a1, 20d
    section Another
        Task in Another :2014-01-12, 12d
        another task    :24d
\``,
            }),
          ]),
          section(title([])),
          section(title([])),
          section(title([])),
          section(title([])),
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

  window.app = app;

  return (
    <Box className={"carbon-app-container"}>
      <ActiveCellRuntimeContext runtime={runtime}>
        <ObservableQuestions>
          <CarbonApp app={app} renderManager={renderManager}>
            {/*<SelectionTracker />*/}
          </CarbonApp>
        </ObservableQuestions>
      </ActiveCellRuntimeContext>
    </Box>
  );
}
