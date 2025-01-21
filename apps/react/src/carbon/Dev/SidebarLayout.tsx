import { Box } from "@chakra-ui/react";
import { attrRenderers } from "@emrgen/carbon-attributes";

import {
  blockPresetPlugins,
  node,
  paragraph,
  plainText,
  text,
  title,
} from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { boardPlugins } from "@emrgen/carbon-board";
import { boardRenderers } from "@emrgen/carbon-board-react";
import {
  ActiveCellRuntime,
  ActiveCellRuntimeContext,
  cellPlugin,
  cellRenderer,
} from "@emrgen/carbon-cell";
import {
  carbonChakraRenderers,
  EmojiPickerInlineMenu,
  FloatingStyleMenu,
  InsertBlockMenu,
} from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { codemirrorExtension } from "@emrgen/carbon-codemirror";
import {
  commentEditorComp,
  commentEditorPlugin,
} from "@emrgen/carbon-comment-editor";
import {
  AddPagePath,
  CollapsedPath,
  corePresetPlugins,
  Keymap,
  ModePath,
  NodeId,
  State,
} from "@emrgen/carbon-core";
import { databasePlugins } from "@emrgen/carbon-database";
import { databaseRenderers } from "@emrgen/carbon-database-react";
import { emojiPlugins } from "@emrgen/carbon-emoji";
import { flashPlugin, flashRenderers } from "@emrgen/carbon-flash";
import { mediaPlugins, mediaRenderers } from "@emrgen/carbon-media";
import {
  timelinePlugin,
  timelineRenderer,
} from "@emrgen/carbon-plugin-timeline";
import {
  ObservableNodes,
  ObservableQuestions,
  questionExtension,
} from "@emrgen/carbon-question";
import {
  RendererProps,
  RenderManager,
  useCreateCachedCarbon,
} from "@emrgen/carbon-react";
import { CarbonUI } from "@emrgen/carbon-ui";
import { CarbonApp, carbonUtilPlugins } from "@emrgen/carbon-utils";
import { flattenDeep } from "lodash";
import { useEffect, useState } from "react";
import "./test.styl";

const page = node(
  "page",
  [
    title([text("Elixir")]),

    node("callout", [title([text("callout title")])], {}),

    paragraph([title(text("question title"))]),

    node("image", [], {
      "remote/state/image/src":
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPcbdS5mvBeNcpLWmbEfpSP7LGa3Nae-Lwew&s",
    }),
    node("image", [], {}),

    node("video", [], {
      "remote/state/video/src": "https://www.youtube.com/watch?v=-IkEMMKSqcw",
    }),

    node("video", [], {}),

    // node("video"),
  ],
  {
    [ModePath]: "edit",
    // [ImagePath]:
    //   "https://momentum.photos/img/605ec0cd-c21b-420d-9ec7-f1a63d69cafd.jpg?momo_cache_bg_uuid=a63a8845-920b-4562-ba44-d3d5228261c9",
  },
);

const layout = node("sidebarLayout", [
  node("sidebar", [
    node("pageTreeGroup", [
      node(
        "pageTree",
        [
          plainText("Favorites"),
          node("pageTreeItem", [
            plainText("Computer Science"),
            node("pageTreeItem", [plainText("Algorithms")]),
            node("pageTreeItem", [plainText("Data Structures")]),
            node("pageTreeItem", [plainText("Operating Systems")]),
          ]),
          node(
            "pageTreeItem",
            [
              plainText("Electrical Engineering"),
              node("pageTreeItem", [plainText("Circuits")], {}),
              node("pageTreeItem", [plainText("Digital Logic")], {}),
              node("pageTreeItem", [plainText("Microprocessors")], {}),
            ],
            { [CollapsedPath]: false },
          ),
        ],
        {
          [AddPagePath]: true,
        },
      ),
      node(
        "pageTree",
        [
          plainText("Private"),
          node("pageTreeItem", [
            plainText("Computer Science"),
            node("pageTreeItem", [plainText("Algorithms")]),
            node("pageTreeItem", [plainText("Data Structures")]),
            node("pageTreeItem", [plainText("Operating Systems")]),
          ]),
          node(
            "pageTreeItem",
            [
              plainText("Electrical Engineering"),
              node("pageTreeItem", [plainText("Circuits")], {}),
              node("pageTreeItem", [plainText("Digital Logic")], {}),
              node("pageTreeItem", [plainText("Microprocessors")], {}),
            ],
            { [CollapsedPath]: false },
          ),
        ],
        {
          [AddPagePath]: true,
        },
      ),
    ]),
  ]),
  node("layoutContent", [page]),
]);

const data = node("carbon", [layout]);

// @ts-ignore
data.id = NodeId.ROOT.toString();

const ImageComp = (props: RendererProps) => {
  return (
    <div contentEditable="false" suppressContentEditableWarning>
      Image
    </div>
  );
};

// const extensions1: Extension = {
//   renderers: [ReactRenderer.create("image", ImageComp)],
// };

const plugins = [
  mediaPlugins,
  ...corePresetPlugins,
  ...blockPresetPlugins,
  carbonUtilPlugins,
  commentEditorPlugin,
  ...codemirrorExtension.plugins!,
  cellPlugin,
  new ClipboardPlugin(),
  ...databasePlugins,
  ...boardPlugins,
  ...questionExtension.plugins!,
  timelinePlugin,
  flashPlugin,
  emojiPlugins,
  CarbonUI.plugins,
];

const renderers = [
  ...blockPresetRenderers,
  commentEditorComp,
  ...codemirrorExtension.renderers!,
  ...attrRenderers,
  ...databaseRenderers,
  ...boardRenderers,
  ...cellRenderer,
  ...questionExtension.renderers!,
  timelineRenderer,
  flashRenderers,
  mediaRenderers,
  carbonChakraRenderers,
  CarbonUI.renderers,
];

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

export function SidebarLayout() {
  const [content] = useState(() => {
    return data;
  });
  const app = useCreateCachedCarbon("sidebar", content, flattenDeep(plugins));
  const [runtime] = useState<ActiveCellRuntime>(() => {
    return new ActiveCellRuntime({
      Carbon: app,
    });
  });

  // @ts-ignore
  window.app = app;
  // @ts-ignore
  window.Keymap = Keymap;

  useEffect(() => {
    const onChange = (state: State) => {
      // console.log(state.selection.bounds())
      console.debug(
        "changes",
        state.changes.patch,
        Array.from(state.changes.dataMap.values()),
      );
      console.debug(
        "actions",
        state.actions.optimize().actions.map((a) => a.toJSON()),
      );
      state.content.all((node) => {});
    };

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    };
  }, [app]);

  return (
    <Box className={"carbon-app-container"} pos={"relative"}>
      <ActiveCellRuntimeContext runtime={runtime}>
        <ObservableNodes>
          <ObservableQuestions>
            <CarbonApp app={app} renderManager={renderManager}>
              <Box pos={"absolute"} right={8} top={6}></Box>
              <FloatingStyleMenu />
              <InsertBlockMenu />
              {/*<BlockContextMenu />*/}
              <EmojiPickerInlineMenu />
              {/*<ScrollIntoView />*/}
            </CarbonApp>
          </ObservableQuestions>
        </ObservableNodes>
      </ActiveCellRuntimeContext>
    </Box>
  );
}
