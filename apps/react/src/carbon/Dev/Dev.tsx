import { Box } from "@chakra-ui/react";
import { attrRenderers } from "@emrgen/carbon-attributes";

import {
  blockPresetPlugins,
  emoji,
  empty,
  mention,
  node,
  paragraph,
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
  ContenteditablePath,
  corePresetPlugins,
  Mark,
  MarksPath,
  ModePath,
  NodeId,
  State,
  SuppressContenteditableWarningPath,
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
  useCreateCarbon,
} from "@emrgen/carbon-react";
import { CarbonApp, carbonUtilPlugins } from "@emrgen/carbon-utils";
import { flattenDeep } from "lodash";
import { useEffect, useState } from "react";
import { PathTracker } from "../../PathTracker";
import "./test.styl";

const data = node("carbon", [
  node(
    "page",
    [
      title([text("Elixir")]),

      node("code", [title(text("function name(){}"))], {}),

      // node("video", [], {
      //   "remote/state/video/src":
      //     "https://www.youtube.com/watch?v=srNoYnGhXAg&pp=ygUEc29uZw%3D%3D",
      // }),
      //
      // node("image", [], {
      //   "remote/state/image/src":
      //     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPcbdS5mvBeNcpLWmbEfpSP7LGa3Nae-Lwew&s",
      // }),
      //
      // paragraph([title(text("question title"))]),
      //
      // node("continue", [
      //   node("button", [node("plainText", [text("continue")])], {
      //     ["local/html/data-size"]: "lg",
      //   }),
      // ]),
      //
      // node("codemirror"),
      //
      // node("continue", [
      //   node("button", [node("plainText", [text("continue")])], {
      //     ["local/html/data-size"]: "lg",
      //   }),
      // ]),

      // node("timeline", [title([text("Install @chakra-ui/react")])]),
      // node("timeline", [title([text("Add snippets")])]),
      // node("timeline", [title([text("Setup provider")])]),

      // node(
      //   "sqCanvas",
      //   [
      //     node("sqNote", [paragraph([title([text("add a note")])])], {
      //       [StylePath]: {
      //         left: 100,
      //         top: 100,
      //       },
      //       [ContenteditablePath]: false,
      //     }),
      //     node("sqNote", [paragraph([title([text("add a note")])])], {
      //       [StylePath]: {
      //         left: 120,
      //         top: 200,
      //       },
      //       // [ContenteditablePath]: false,
      //     }),
      //     node("sqNote", [paragraph([title([text("add a note")])])], {
      //       [StylePath]: {
      //         left: 460,
      //         top: 50,
      //       },
      //       // [ContenteditablePath]: false,
      //     }),
      //
      //     node(
      //       "sqColumn",
      //       [
      //         node("sqTitle", [text("column 1")]),
      //         node("sqNote", [paragraph([title([text("add a note 1")])])], {
      //           [ContenteditablePath]: false,
      //         }),
      //         node("sqNote", [paragraph([title([text("add a note 2")])])], {
      //           [ContenteditablePath]: false,
      //         }),
      //       ],
      //       {
      //         [StylePath]: {
      //           left: 50,
      //           top: 300,
      //         },
      //         [TitlePath]: "column 1",
      //         [CardsCountPath]: 3,
      //       },
      //     ),
      //
      //     node("sqBoard", [node("sqTitle", [text("board 1")])], {
      //       [StylePath]: {
      //         left: 50,
      //         top: 20,
      //       },
      //       [BackgroundImagePath]: `https://png.pngtree.com/element_our/20190530/ourmid/pngtree-correct-icon-image_1267804.jpg`,
      //     }),
      //     node("sqImage", [node("sqTitle", [text("image 1")])], {
      //       [StylePath]: {
      //         left: 800,
      //         top: 100,
      //       },
      //       [ImagePath]: `https://png.pngtree.com/element_our/20190530/ourmid/pngtree-correct-icon-image_1267804.jpg`,
      //     }),
      //     node(
      //       "sqHeading",
      //       [
      //         node("h3", [title([text("heading 1")])]),
      //         paragraph([title([text("section 1")])]),
      //       ],
      //       {
      //         [StylePath]: {
      //           left: 1200,
      //           top: 100,
      //         },
      //       },
      //     ),
      //     node("sqVideo", [node("sqTitle", [text("video title")])], {
      //       [StylePath]: {
      //         left: 2000,
      //         top: 20,
      //       },
      //       [VideoPath]: `https://youtu.be/srNoYnGhXAg`,
      //     }),
      //     node(
      //       "sqComment",
      //       [
      //         node("sqCommentLine", [node("sqTitle", [text("comment 1")])], {
      //           [CommentedByPath]: "subhasis",
      //         }),
      //         node("sqCommentLine", [node("sqTitle", [text("comment 2")])], {
      //           [CommentedByPath]: "subhasis",
      //         }),
      //         node("sqCommentLine", [node("sqTitle", [text("comment 3")])], {
      //           [CommentedByPath]: "subhasis",
      //         }),
      //       ],
      //       {
      //         [StylePath]: {
      //           left: 1400,
      //           top: 250,
      //         },
      //       },
      //     ),
      //   ],
      //   {},
      // ),
      //
      // node(
      //   "partial",
      //   [
      //     title([
      //       text("Summary", {
      //         [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
      //       }),
      //     ]),
      //     //  long lorem text
      //     paragraph([
      //       title([
      //         text(
      //           "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard m is simply dummy text of the printing and typesetting industry.",
      //         ),
      //       ]),
      //     ]),
      //   ],
      //   {
      //     [StylePath]: {},
      //   },
      // ),

      // paragraph([title([text("question title")])]),
      // node("continue", [
      //   node("button", [node("plainText", [text("continue")])], {
      //     ["local/html/data-size"]: "lg",
      //   }),
      // ]),
      // node(
      //   "table",
      //   [],
      //   {},
      //   {
      //     columns: node(
      //       "tableHeader",
      //       [
      //         node("tableColumn", [], {
      //           [TableColumnNamePath]: "Name",
      //           [TableColumnTypePath]: "text",
      //         }),
      //         node("tableColumn", [], {
      //           [TableColumnNamePath]: "Age",
      //           [TableColumnTypePath]: "number",
      //         }),
      //         node("tableColumn", [], {
      //           [TableColumnNamePath]: "Email",
      //           [TableColumnTypePath]: "email",
      //         }),
      //         node("tableColumn", [], {
      //           [TableColumnNamePath]: "Status",
      //           [TableColumnTypePath]: "status",
      //         }),
      //       ],
      //       {},
      //     ),
      //   },
      // ),

      // paragraph(
      //   [
      //     title([
      //       text("question"),
      //       text(" "),
      //       text("link", {
      //         [MarksPath]: [Mark.link("http://localhost:3000")].map((m) =>
      //           m.toJSON(),
      //         ),
      //       }),
      //     ]),
      //   ],
      // ),
      // paragraph([
      //   title([
      //     text("question"),
      //     text(" "),
      //     text("italic bold", {
      //       [MarksPath]: [Mark.BOLD, Mark.ITALIC].map((m) => m.toJSON()),
      //     }),
      //     text(" "),
      //     text("colored", {
      //       [MarksPath]: [Mark.color("red")].map((m) => m.toJSON()),
      //     }),
      //     text(" "),
      //     text("background", {
      //       [MarksPath]: [Mark.background("#fb8500")].map((m) => m.toJSON()),
      //     }),
      //     text(" "),
      //     text("code", {
      //       [MarksPath]: [Mark.CODE].map((m) => m.toJSON()),
      //     }),
      //     text(" "),
      //     text("sub", {
      //       [MarksPath]: [Mark.SUBSCRIPT].map((m) => m.toJSON()),
      //     }),
      //     text("strike", {
      //       [MarksPath]: [Mark.STRIKE].map((m) => m.toJSON()),
      //     }),
      //     text("super", {
      //       [MarksPath]: [Mark.SUPERSCRIPT].map((m) => m.toJSON()),
      //     }),
      //     text(" "),
      //     text("underline", {
      //       [MarksPath]: [Mark.UNDERLINE].map((m) => m.toJSON()),
      //     }),
      //   ]),
      // ]),

      // node("collapsible", [title([text("question title")])]),

      // node('flashCard', [
      //   title([text('flash card title')]),
      // ]),

      // node('scale', []),
      //
      // node('button', [
      //   title([text('submit')]),
      // ]),
      //
      // node('question', [
      //   title([text('question title')]),
      // ]),
      //
      // node('mcq', [
      //   title([text('mcq title 1')]),
      // ]),
      // node('mcq', [
      //   title([text('mcq title 2')]),
      // ]),
      // node('mcq', [
      //   title([text('mcq title 3')]),
      // ]),
      // node('explain', [
      //   title([text('question title')]),
      // ]),
      //
      // node('hint', [
      //   title([text('hint 1')]),
      //   paragraph([title([text('hint content')])]),
      // ]),
      // node('hint', [
      //   title([text('hint 2')]),
      //   paragraph([title([text('hint content')])]),
      // ]),
      // node('hint', [
      //   title([text('hint 3')]),
      //   paragraph([title([text('hint content')])]),
      // ]),

      // paragraph([title([
      //   text("section 1"),
      //   text(" bold", {
      //     'remote/state/marks/bold': Mark.BOLD,
      //   }),
      //   text(" italic", {
      //     'remote/state/marks/italic': Mark.ITALIC,
      //   }),
      //   text(" underline", {
      //     'remote/state/marks/underline': Mark.UNDERLINE,
      //   }),
      //   text(" bold italic", {
      //     'remote/state/marks/bold': Mark.BOLD,
      //     'remote/state/marks/italic': Mark.ITALIC,
      //   }),
      //   text(" color", {
      //     'remote/state/marks/bold': Mark.BOLD,
      //     'remote/state/marks/color': Mark.color('teal'),
      //   }),
      //   text("code", {
      //     'remote/state/marks/code': Mark.CODE,
      //   }),
      //   // text("plain"),
      //   // text("", {
      //   //   'local/html/data-empty': true,
      //   // }),
      // ])]),

      // paragraph([title([])]),
      // paragraph([title([text("section 3")])]),

      // node("commentEditor", [paragraph([title([text("add a comment")])])]),

      // paragraph([title([text("section 3")])]),
      // node("hstack", [
      //   node("stack", [paragraph([title([text("section 1")])])]),
      //   node("stack", [paragraph([title([text("section 2")])])]),
      //   node("stack", [paragraph([title([text("section 3")])])]),
      // ]),
      // paragraph([title([text("section 543")])]),
      // node("hstack", [
      //   node("stack", [paragraph([title([text("section 1")])])]),
      //   node("stack", [paragraph([title([text("section 2")])])]),
      //   node("stack", [paragraph([title([text("section 3")])])]),
      // ]),
      // paragraph([title([text("section 4")])]),
      // title([]),
      // node('frame', [
      //   title([text('frame title')]),
      //   paragraph([title([text('frame section')])]),
      // ]),
      // paragraph([title([text("section 1")])]),
      // node('frame', [
      //   title([text('frame title')]),
      //   paragraph([title([text('frame section')])]),
      // ]),
      // paragraph([title([text("section 2")])]),
      // paragraph([title([text("section 3")])]),
      // node('frame', [
      //   title([text('frame title 1')]),
      //   paragraph([title([text('frame section')])]),
      //   node('frame', [
      //     title([text('frame title 2')]),
      //     paragraph([title([text('frame section')])]),
      //   ]),
      // ]),
      // paragraph([title([text("section 4")])]),
      // block({
      //   name: 'modal', children: [
      //     title([text('modal title')]),
      //     paragraph([title([text('modal content')])]),
      //     paragraph([title([text('modal content')])]),
      //     paragraph([title([text('modal content')])]),
      //   ],
      //   links: {
      //     'header': node('title', [text('modal header')]),
      //     'footer': node('title', [text('modal footer')]),
      //   }
      // }),
      // paragraph([title([text("section 3")])]),

      // node("tabs", [
      //   node(
      //     "tab",
      //     [
      //       // node("title", [text("tab 1")]),
      //       paragraph([title([text("tab 1 content")])]),
      //     ],
      //     {
      //       [ActivatedPath]: true,
      //       [TitlePath]: "tab 11 some big title",
      //     },
      //   ),
      //   node(
      //     "tab",
      //     [
      //       // node("title", [text("tab 2")]),
      //       paragraph([title([text("tab 2 content")])]),
      //     ],
      //     {
      //       [TitlePath]: "tab 12 medium",
      //     },
      //   ),
      //   node(
      //     "tab",
      //     [
      //       // node("title", [text("tab 3")]),
      //       paragraph([title([text("tab 3 content")])]),
      //     ],
      //     {
      //       [TitlePath]: "tab 13",
      //     },
      //   ),
      // ]),

      // // node("blockContent"),
      //
      // paragraph([title([text("section 1")])]),

      //       node(
      //         "code",
      //         [
      //           node("codeTitle", [
      //             text(`func main() {
      //   fmt.Println("Hello, Go!")
      // }`),
      //           ]),
      //         ],
      //         {},
      //       ),

      paragraph([title([text("section 1")])]),

      // node("codeBox", [
      //   node("codeLine", [title([text("function foo() {")])]),
      //   node("codeLine", [title([text("  console.log('hello world')")])]),
      //   node("codeLine", [title([text("}")])]),
      // ]),

      // node("codeMirror", [], {
      //   ["remote/state/codemirror"]: `function foo() {\n  console.log('hello world')\n}`,
      // }),

      // node("question", [
      //   title([text("question title")]),
      //   node("mcq", [
      //     node("mcqOption", [title([text("option 1")])]),
      //     node("mcqOption", [title([text("option 2")])]),
      //     node("mcqOption", [title([text("option 3")])]),
      //     node("mcqOption", [title([text("option 4")])]),
      //   ]),
      //   node("hints", [
      //     node("hint", [
      //       title([text("hint 1")]),
      //       paragraph([title([text("hint content")])]),
      //     ]),
      //   ]),
      // ]),
      //
      // node("question", [
      //   title([text("question title")]),
      //   node("mcq", [
      //     node("mcqOption", [title([text("option 1")])]),
      //     node("mcqOption", [title([text("option 2")])]),
      //     node("mcqOption", [title([text("option 3")])]),
      //     node("mcqOption", [title([text("option 4")])]),
      //   ]),
      // ]),

      paragraph([title([text("section 1")])]),

      node("cell"),
      node("cell"),
      node("cell"),
      node("cell"),

      // paragraph([title([text("section 1")])]),

      // node("pageTree", [
      //   title([text("Private")]),
      //   node(
      //     "pageTreeItem",
      //     [
      //       title([text("Physics")]),
      //       node("pageTreeItem", [title([text("Thermodynamics")])]),
      //       node("pageTreeItem", [title([text("Electromagnetism")])]),
      //     ],
      //     {},
      //     // { node: { collapsed: false }, state: { selected: true } }
      //   ),
      //   node("pageTreeItem", [title([text("Mathematics")])]),
      //   node("pageTreeItem", [title([text("Chemistry")])]),
      //   node("pageTreeItem", [title([text("Economics")])]),
      // ]),

      node("paragraph", [
        title([
          text("123456", {
            [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
          }),
          text("78"),
        ]),
      ]),
      node("paragraph", [
        title([
          text("ab", {}),
          text("cdefgh", {
            [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
          }),
        ]),
      ]),
      // paragraph([
      //   title([text("abc")]),
      //   node("hstack", [
      //     node("stack", [paragraph([title([text("section 1")])])]),
      //     node("stack", [paragraph([title([text("section 2")])])]),
      //     node("stack", [paragraph([title([text("section 3")])])]),
      //   ]),
      //   paragraph([
      //     title([text("def")]),
      //     paragraph([
      //       title([text("ghi")]),
      //
      //       paragraph([
      //         title([text("abc")]),
      //         paragraph([
      //           title([text("pqr")]),
      //         ]),
      //         paragraph([
      //           title([text("mno")]),
      //         ]),
      //       ]),
      //       node("hstack", [
      //         node("stack", [paragraph([title([text("section 1")])])]),
      //         node("stack", [paragraph([title([text("section 2")])])]),
      //         node("stack", [paragraph([title([text("section 3")])])]),
      //       ]),
      //       paragraph([title([text("uvw")])]),
      //
      //     ]),
      //     paragraph([title([text("stu")])]),
      //   ]),
      //   paragraph([title([text("def")])]),
      // ]),
      // paragraph([title([text("ghi")])]),

      // paragraph([
      //   title([text("123")]),
      //   paragraph([
      //     title([text("1239")]),
      //     paragraph([
      //       title([text("1238")]),
      //       paragraph([title([text("1237")])]),
      //     ]),
      //     paragraph([title([text("1236")])]),
      //   ]),
      //   paragraph([title([text("1235")])]),
      // ]),
      // paragraph([title([text("1234")])]),
      //
      // paragraph([
      //   title([text("abc")]),
      //   paragraph([
      //     title([text("def")]),
      //     paragraph([
      //       title([text("ghi")]),
      //       paragraph([title([text("jkl")])]),
      //     ]),
      //     paragraph([title([text("mno")])]),
      //   ]),
      //   paragraph([title([text("pqr")])]),
      // ]),
      // paragraph([title([text("stu")])]),
      //
      // node(
      //   "paragraph",
      //   [
      //     title([text("abcdef")]),
      //     node(
      //       "todo",
      //       [title([text("pqrst")]), paragraph([title([text("paragraph")])])],
      //       {}
      //     ),
      //     node('numberList', [
      //       title([text("section 1")]),
      //     ]),
      //     node('bulletList', [
      //       title([text("section 1")]),
      //     ]),
      //   ],
      //   {}
      // ),

      // node("hstack", [
      //   node("stack", [paragraph([title([text("section 1")])])]),
      //   node("stack", [paragraph([title([text("section 2")])])]),
      //   node("stack", [paragraph([title([text("section 3")])])]),
      // ]),

      paragraph([title([text("time"), mention("today"), node("empty")])]),
      paragraph([
        title([
          text("123"),
          mention("ankita"),
          text("123"),
          mention("avira"),
          text("123"),
        ]),
      ]),
      paragraph([title([text("123456789")])]),
      paragraph([title([emoji("🖐️")])]),
      paragraph([
        title([
          empty({
            [ContenteditablePath]: true,
            [SuppressContenteditableWarningPath]: true,
          }),

          mention("123"),
          empty({
            [ContenteditablePath]: true,
            [SuppressContenteditableWarningPath]: true,
          }),

          mention("bubun"),
          text("abc"),
          mention("bappa"),
          empty({
            [ContenteditablePath]: true,
            [SuppressContenteditableWarningPath]: true,
          }),
        ]),
      ]),
      paragraph([
        title([text("section 1")]),
        paragraph([title([text("section 1")])]),
      ]),

      // node("pageLink", [], {
      //   [LinkPath]: "https://www.youtube.com/watch?v=rW5oVuxEwdMsdf",
      // }),
      // node("bookmark", [], {
      //   [BookmarkPath]: "https://blog.medium.com/bnp-editors-9c0a6f5a133a",
      // }),
      // node("bookmark", [], {
      //   [BookmarkPath]:
      //     "https://www.w3schools.com/cssref/css3_pr_text-overflow.php",
      // }),
      // node("bookmark", [], {
      //   [BookmarkPath]: "https://www.npmjs.com/package/image-thumbnail",
      // }),
      // node("bookmark", [], {
      //   [BookmarkPath]: "https://www.youtube.com/watch?v=rW5oVuxEwdM",
      // }),
    ],
    {
      [ModePath]: "edit",
      // [ImagePath]:
      //   "https://momentum.photos/img/605ec0cd-c21b-420d-9ec7-f1a63d69cafd.jpg?momo_cache_bg_uuid=a63a8845-920b-4562-ba44-d3d5228261c9",
    },
    // {
    //   [PagePropLink]: node(
    //     "attributes",
    //     [
    //       attribute({
    //         [AttrNamePath]: "Email",
    //         [AttrTypePath]: "email",
    //         [AttrEmailPath]: "subhasis@mail.com",
    //       }),
    //       attribute({
    //         [AttrNamePath]: "Created At",
    //         [AttrTypePath]: "created-at",
    //         [AttrCreatedAtPath]: new Date().toISOString(),
    //       }),
    //       attribute({
    //         [AttrNamePath]: "Multi Select",
    //         [AttrTypePath]: "multi-select",
    //         [AttrMultiSelectedPath]: ["option 1", "option 2"],
    //         [AttrSelectOptionsPath]: ["option 1", "option 2", "option 3"],
    //       }),
    //       attribute({
    //         [AttrNamePath]: "Status",
    //         [AttrTypePath]: "status",
    //         [AttrStatusPath]: "done",
    //         [AttrStatusOptionsPath]: ["todo", "done", "in progress", "triage"],
    //       }),
    //       attribute({
    //         [AttrNamePath]: "Select",
    //         [AttrTypePath]: "select",
    //         [AttrSelectedPath]: "option 1",
    //         [AttrSelectOptionsPath]: ["option 1", "option 2", "option 3"],
    //       }),
    //       attribute({
    //         [AttrNamePath]: "Text",
    //         [AttrTypePath]: "text",
    //         [AttrTextPath]: "text value",
    //       }),
    //       attribute({
    //         [AttrNamePath]: "Number",
    //         [AttrTypePath]: "number",
    //         [AttrNumberPath]: 123,
    //       }),
    //     ],
    //     {},
    //   ),
    // },
  ),
]);

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
  // flashPlugin,
  ...codemirrorExtension.plugins!,
  cellPlugin,
  // ...questionExtension.plugins!,
  new ClipboardPlugin(),
  ...databasePlugins,
  ...boardPlugins,

  ...questionExtension.plugins!,
  timelinePlugin,
  flashPlugin,
  emojiPlugins,
];

const renderers = [
  ...blockPresetRenderers,
  commentEditorComp,
  // flashComp,
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

// localStorage.setItem('carbon:content', JSON.stringify(data));

export function Dev() {
  const [content] = useState(() => {
    return data;
  });
  const app = useCreateCarbon("dev", content, flattenDeep(plugins));
  const [runtime] = useState<ActiveCellRuntime>(() => {
    return new ActiveCellRuntime({
      Carbon: app,
    });
  });
  // @ts-ignore
  window.app = app;

  useEffect(() => {
    const onChange = (state: State) => {
      if (!state.selection.isSkip && !state.blockSelection.isActive) {
        const head = app.store.element(state.selection.head.node.id);
        head?.scrollIntoView({ behavior: "auto", block: "nearest" });
      }

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
              <Box pos={"absolute"} right={8} top={6}>
                {/*<DocumentSaveStatus />*/}
                {/* eslint-disable-next-line react/jsx-no-undef */}
                {/*{<ToggleViewMode />}*/}
              </Box>
              <FloatingStyleMenu />
              <PathTracker />
              <InsertBlockMenu />
              {/*<BlockContextMenu />*/}
              <EmojiPickerInlineMenu />
            </CarbonApp>
          </ObservableQuestions>
        </ObservableNodes>
      </ActiveCellRuntimeContext>
    </Box>
  );
}
