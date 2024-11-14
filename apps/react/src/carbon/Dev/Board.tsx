import { Box } from "@chakra-ui/react";
import { attrRenderers } from "@emrgen/carbon-attributes";

import {
  blockPresetPlugins,
  emoji,
  empty,
  mention,
  node,
  paragraph,
  plainText,
  text,
  title,
} from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { boardPlugins, CardsCountPath, CommentedByPath } from "@emrgen/carbon-board";
import { boardRenderers } from "@emrgen/carbon-board-react";
import {
  ActiveCellRuntime,
  ActiveCellRuntimeContext,
  cellPlugin,
  cellRenderer,
} from "@emrgen/carbon-cell";
import {
  BlockContextMenu,
  carbonChakraRenderers,
  FloatingStyleMenu,
  InsertBlockMenu,
  ToggleViewMode,
} from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { codemirrorExtension } from "@emrgen/carbon-codemirror";
import {
  commentEditorComp,
  commentEditorPlugin,
} from "@emrgen/carbon-comment-editor";
import {
  BackgroundImagePath,
  Carbon,
  CollapsedPath,
  ContenteditablePath,
  corePresetPlugins,
  ImagePath,
  Mark,
  MarksPath,
  ModePath,
  NodeId,
  State,
  StylePath,
  SuppressContenteditableWarningPath,
  TitlePath,
  VideoPath,
} from "@emrgen/carbon-core";
import { databasePlugins } from "@emrgen/carbon-database";
import { databaseRenderers } from "@emrgen/carbon-database-react";
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
  useCreateCarbon,
} from "@emrgen/carbon-react";
import { CarbonApp, carbonUtilPlugins } from "@emrgen/carbon-utils";
import { flattenDeep } from "lodash";
import { useEffect, useState } from "react";
import { PathTracker } from "../../PathTracker";
import './board.styl';

const data = node("carbon", [
  node(
    "document",
    [
      title([text("Document Title")]),
      node(
        "sqCanvas",
        [
          node("sqNote", [paragraph([title([text("add a note")])])], {
            [StylePath]: {
              left: 100,
              top: 100,
            },
            [ContenteditablePath]: false,
          }),
          node("sqNote", [paragraph([title([text("add a note")])])], {
            [StylePath]: {
              left: 120,
              top: 200,
            },
            // [ContenteditablePath]: false,
          }),
          node("sqNote", [paragraph([title([text("add a note")])])], {
            [StylePath]: {
              left: 460,
              top: 50,
            },
            // [ContenteditablePath]: false,
          }),

          node(
            "sqColumn",
            [
              node("sqTitle", [text("column 1")]),
              node("sqNote", [paragraph([title([text("add a note 1")])])], {
                [ContenteditablePath]: false,
              }),
              node("sqNote", [paragraph([title([text("add a note 2")])])], {
                [ContenteditablePath]: false,
              }),
            ],
            {
              [StylePath]: {
                left: 50,
                top: 300,
              },
              [TitlePath]: "column 1",
              [CardsCountPath]: 2,
            },
          ),

          node("sqBoard", [node("sqTitle", [text("board 1")])], {
            [StylePath]: {
              left: 50,
              top: 20,
            },
            [BackgroundImagePath]: `https://png.pngtree.com/element_our/20190530/ourmid/pngtree-correct-icon-image_1267804.jpg`,
          }),
          node("sqImage", [node("sqTitle", [text("image 1")])], {
            [StylePath]: {
              left: 800,
              top: 100,
            },
            [ImagePath]: `https://png.pngtree.com/element_our/20190530/ourmid/pngtree-correct-icon-image_1267804.jpg`,
          }),
          node(
            "sqHeading",
            [
              node("h3", [title([text("heading 1")])]),
              paragraph([title([text("section 1")])]),
            ],
            {
              [StylePath]: {
                left: 1200,
                top: 100,
              },
            },
          ),
          node("sqVideo", [node("sqTitle", [text("video title")])], {
            [StylePath]: {
              left: 2000,
              top: 20,
            },
            [VideoPath]: `https://youtu.be/srNoYnGhXAg`,
          }),
          node(
            "sqComment",
            [
              node("sqCommentLine", [node("sqTitle", [text("comment 1")])], {
                [CommentedByPath]: "subhasis",
              }),
              node("sqCommentLine", [node("sqTitle", [text("comment 2")])], {
                [CommentedByPath]: "subhasis",
              }),
              node("sqCommentLine", [node("sqTitle", [text("comment 3")])], {
                [CommentedByPath]: "subhasis",
              }),
            ],
            {
              [StylePath]: {
                left: 1400,
                top: 250,
              },
            },
          ),
        ],
        {},
      ),
    ],
    {
      [ModePath]: "edit",
    },
  ),
]);

// @ts-ignore
data.id = NodeId.ROOT.toString();

const plugins = [
  mediaPlugins,
  ...corePresetPlugins,
  ...blockPresetPlugins,
  ...boardPlugins,
  carbonUtilPlugins,
  new ClipboardPlugin(),
];

const renderers = [
  ...carbonChakraRenderers,
  ...blockPresetRenderers,
  ...boardRenderers,
  ...mediaRenderers,
  ...databaseRenderers,
  ...flashRenderers,
  ...attrRenderers,
  timelineRenderer,
  cellRenderer,
];

const renderManager = RenderManager.from(flattenDeep(renderers));

export const Board = () => {
  const app = useCreateCarbon("dev", data, flattenDeep(plugins));
  // @ts-ignore
  window.app = app;

  return (
    <Box className={"carbon-board-app-container"} pos={"relative"}>
      <CarbonApp app={app} renderManager={renderManager}>
        <FloatingStyleMenu />
        <PathTracker />
        <InsertBlockMenu />
        <BlockContextMenu />
      </CarbonApp>
    </Box>
  );
};
