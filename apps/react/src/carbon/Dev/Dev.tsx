import { useEffect } from "react";

import {
  attribute,
  blockPresetPlugins,
  BookmarkPath,
  emoji,
  mention,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";
import {
  Extension,
  ReactRenderer,
  RendererProps,
  RenderManager,
  useCreateCarbon,
} from "@emrgen/carbon-react";
import { blockPresetRenderers } from "@emrgen/carbon-react-blocks";
import {
  corePresetPlugins,
  LinkPath,
  Mark,
  MarksPath,
  ModePath,
  NodeId,
  PropLink,
  State,
  StylePath,
} from "@emrgen/carbon-core";
import { CarbonApp } from "@emrgen/carbon-utils";
import { codeExtension } from "@emrgen/carbon-code";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { flattenDeep, noop } from "lodash";
import SelectionTracker from "../../SelectionTracker";
import { PathTracker } from "../../PathTracker";
import {
  commentEditorComp,
  commentEditorPlugin,
} from "@emrgen/carbon-comment-editor";
import {
  AttrCreatedAtPath,
  AttrEmailPath,
  AttrMultiSelectedPath,
  AttrNamePath,
  attrRenderers,
  AttrSelectedPath,
  AttrSelectOptionsPath,
  AttrStatusOptionsPath,
  AttrStatusPath,
  AttrTextPath,
  AttrTypePath,
} from "@emrgen/carbon-attributes";

function is_env_development() {
  // @ts-ignore
  return import.meta.env.VITE_MODE === "dev";
}

const data = node("carbon", [
  node(
    "document",
    [
      title([text("I am a frame title")]),

      node(
        "partial",
        [
          title([
            text("Summary", {
              [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
            }),
          ]),
          //  long lorem text
          section([
            title([
              text(
                "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard m is simply dummy text of the printing and typesetting industry.",
              ),
            ]),
          ]),
        ],
        {
          [StylePath]: {},
        },
      ),

      section([title([text("question title")])]),

      section(
        [
          title([
            text("question"),
            text(" "),
            text("title", {
              [MarksPath]: [Mark.link("http://localhost:3000")].map((m) =>
                m.toJSON(),
              ),
            }),
          ]),
        ],
        {
          // [BackgroundPath]: "#fb8500",
        },
      ),
      section([
        title([
          text("question"),
          text(" "),
          text("italic bold", {
            [MarksPath]: [Mark.BOLD, Mark.ITALIC].map((m) => m.toJSON()),
          }),
          text(" "),
          text("colored", {
            [MarksPath]: [Mark.color("red")].map((m) => m.toJSON()),
          }),
          text(" "),
          text("background", {
            [MarksPath]: [Mark.background("#fb8500")].map((m) => m.toJSON()),
          }),
          text(" "),
          text("code", {
            [MarksPath]: [Mark.CODE].map((m) => m.toJSON()),
          }),
          text(" "),
          text("sub", {
            [MarksPath]: [Mark.SUBSCRIPT].map((m) => m.toJSON()),
          }),
          text("strike", {
            [MarksPath]: [Mark.STRIKE].map((m) => m.toJSON()),
          }),
          text("super", {
            [MarksPath]: [Mark.SUPERSCRIPT].map((m) => m.toJSON()),
          }),
          text(" "),
          text("underline", {
            [MarksPath]: [Mark.UNDERLINE].map((m) => m.toJSON()),
          }),
        ]),
      ]),

      // node("collapsible", [title([text("question title")])]),

      // node('question', [
      //   node('questionTitle', [
      //     section([title([text('question title')])]),
      //   ]),
      //   node('questionDescription', [
      //     section([title([text('question description')])]),
      //   ]),
      //   node('questionType', [
      //     node('multipleChoice', [
      //       node('multipleChoiceOption', [
      //         title([text('option 1')]),
      //       ]),
      //       node('multipleChoiceOption', [
      //         title([text('option 2')]),
      //       ]),
      //       node('multipleChoiceOption', [
      //         title([text('option 3')]),
      //       ]),
      //     ])
      //   ])
      // ]),

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
      //   section([title([text('hint content')])]),
      // ]),
      // node('hint', [
      //   title([text('hint 2')]),
      //   section([title([text('hint content')])]),
      // ]),
      // node('hint', [
      //   title([text('hint 3')]),
      //   section([title([text('hint content')])]),
      // ]),

      // section([title([
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

      // section([title([])]),
      // section([title([text("section 3")])]),

      // node("commentEditor", [section([title([text("add a comment")])])]),

      // section([title([text("section 3")])]),
      // node("hstack", [
      //   node("stack", [section([title([text("section 1")])])]),
      //   node("stack", [section([title([text("section 2")])])]),
      //   node("stack", [section([title([text("section 3")])])]),
      // ]),
      // section([title([text("section 543")])]),
      // node("hstack", [
      //   node("stack", [section([title([text("section 1")])])]),
      //   node("stack", [section([title([text("section 2")])])]),
      //   node("stack", [section([title([text("section 3")])])]),
      // ]),
      // section([title([text("section 4")])]),
      // title([]),
      // node('frame', [
      //   title([text('frame title')]),
      //   section([title([text('frame section')])]),
      // ]),
      // section([title([text("section 1")])]),
      // node('frame', [
      //   title([text('frame title')]),
      //   section([title([text('frame section')])]),
      // ]),
      // section([title([text("section 2")])]),
      // section([title([text("section 3")])]),
      // node('frame', [
      //   title([text('frame title 1')]),
      //   section([title([text('frame section')])]),
      //   node('frame', [
      //     title([text('frame title 2')]),
      //     section([title([text('frame section')])]),
      //   ]),
      // ]),
      // section([title([text("section 4")])]),
      // block({
      //   name: 'modal', children: [
      //     title([text('modal title')]),
      //     section([title([text('modal content')])]),
      //     section([title([text('modal content')])]),
      //     section([title([text('modal content')])]),
      //   ],
      //   links: {
      //     'header': node('title', [text('modal header')]),
      //     'footer': node('title', [text('modal footer')]),
      //   }
      // }),
      // section([title([text("section 3")])]),
      // node("tabs", [
      //   node("tab", [
      //     // node("title", [text("tab 1")]),
      //     section([title([text("tab 1 content")])]),
      //   ], {
      //     [ActivatedPath]: true,
      //     [TitlePath]: "tab 11 some big title"
      //   }),
      //   node("tab", [
      //     // node("title", [text("tab 2")]),
      //     section([title([text("tab 2 content")])]),
      //   ], {
      //
      //     [TitlePath]: "tab 12 medium"
      //   }),
      //   node("tab", [
      //     // node("title", [text("tab 3")]),
      //     section([title([text("tab 3 content")])]),
      //   ], {
      //     [TitlePath]: "tab 13"
      //   }),
      // ]),

      // // node("blockContent"),
      //
      // section([title([text("section 1")])]),

      node(
        "code",
        [
          node("codeTitle", [
            text(`func main() {
  fmt.Println("Hello, Go!")
}`),
          ]),
        ],
        {},
      ),

      section([title([text("section 1")])]),

      // node("codeBox", [
      //   node("codeLine", [title([text("function foo() {")])]),
      //   node("codeLine", [title([text("  console.log('hello world')")])]),
      //   node("codeLine", [title([text("}")])]),
      // ]),
      //
      // node("codeMirror", [], {
      //   ["remote/state/codemirror"]: `function foo() {\n  console.log('hello world')\n}`,
      // }),

      // node("cell", [
      //   node('cellView'),
      //   node("codeMirror", [], {
      //   }),
      // ]),
      //
      // node("cell", [
      //   node('cellView'),
      //   node("codeMirror", [], {
      //   }),
      // ]),
      //
      // node("cell", [
      //   node('cellView'),
      //   node("codeMirror", [], {
      //   }),
      // ]),
      //

      // section([title([text("section 1")])]),

      // node("code", [
      //   node("codeLine", [title([text("function foo() {")])]),
      //   node("codeLine", [title([text("  console.log('hello world')")])]),
      //   node("codeLine", [title([text("}")])]),
      // ]),

      // node("pageTree", [
      //   title([text("Favorites")]),
      //   node(
      //     "pageTreeItem",
      //     [
      //       title([text("Computer Science")]),
      //       node("pageTreeItem", [title([text("Algorithms")])]),
      //       node("pageTreeItem", [title([text("Data Structures")])]),
      //       node("pageTreeItem", [title([text("Operating Systems")])]),
      //     ],
      //     {[CollapsedPath]: false}
      //   ),
      //   node("pageTreeItem",
      //     [
      //       title([text("Electrical Engineering")]),
      //       node("pageTreeItem", [title([text("Circuits")])]),
      //       node("pageTreeItem", [title([text("Digital Logic")])]),
      //       node("pageTreeItem", [title([text("Microprocessors")])]),
      //     ]),
      // ]),

      // node("pageTree", [
      //   title([text("Private")]),
      //   node(
      //     "pageTreeItem",
      //     [
      //       title([text("Physics")]),
      //       node("pageTreeItem", [title([text("Thermodynamics")])]),
      //       node("pageTreeItem", [title([text("Electromagnetism")])]),
      //     ],
      //     {}
      //     // { node: { collapsed: false }, state: { selected: true } }
      //   ),
      //   node("pageTreeItem", [title([text("Mathematics")])]),
      //   node("pageTreeItem", [title([text("Chemistry")])]),
      //   node("pageTreeItem", [title([text("Economics")])]),
      // ]),

      node("section", [
        title([
          text("123456", {
            [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
          }),
          text("78"),
        ]),
      ]),
      node("section", [
        title([
          text("ab", {}),
          text("cdefgh", {
            [MarksPath]: [Mark.BOLD].map((m) => m.toJSON()),
          }),
        ]),
      ]),
      // section([
      //   title([text("abc")]),
      //   node("hstack", [
      //     node("stack", [section([title([text("section 1")])])]),
      //     node("stack", [section([title([text("section 2")])])]),
      //     node("stack", [section([title([text("section 3")])])]),
      //   ]),
      //   section([
      //     title([text("def")]),
      //     section([
      //       title([text("ghi")]),
      //
      //       section([
      //         title([text("abc")]),
      //         section([
      //           title([text("pqr")]),
      //         ]),
      //         section([
      //           title([text("mno")]),
      //         ]),
      //       ]),
      //       node("hstack", [
      //         node("stack", [section([title([text("section 1")])])]),
      //         node("stack", [section([title([text("section 2")])])]),
      //         node("stack", [section([title([text("section 3")])])]),
      //       ]),
      //       section([title([text("uvw")])]),
      //
      //     ]),
      //     section([title([text("stu")])]),
      //   ]),
      //   section([title([text("def")])]),
      // ]),
      // section([title([text("ghi")])]),

      // section([
      //   title([text("123")]),
      //   section([
      //     title([text("1239")]),
      //     section([
      //       title([text("1238")]),
      //       section([title([text("1237")])]),
      //     ]),
      //     section([title([text("1236")])]),
      //   ]),
      //   section([title([text("1235")])]),
      // ]),
      // section([title([text("1234")])]),
      //
      // section([
      //   title([text("abc")]),
      //   section([
      //     title([text("def")]),
      //     section([
      //       title([text("ghi")]),
      //       section([title([text("jkl")])]),
      //     ]),
      //     section([title([text("mno")])]),
      //   ]),
      //   section([title([text("pqr")])]),
      // ]),
      // section([title([text("stu")])]),
      //
      // node(
      //   "section",
      //   [
      //     title([text("abcdef")]),
      //     node(
      //       "todo",
      //       [title([text("pqrst")]), section([title([text("section")])])],
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
      //   node("stack", [section([title([text("section 1")])])]),
      //   node("stack", [section([title([text("section 2")])])]),
      //   node("stack", [section([title([text("section 3")])])]),
      // ]),

      section([title([emoji("🖐️")])]),
      section([
        title([mention("subhasis"), mention("subhasis"), mention("subhasis")]),
      ]),
      section([title([text("section 1")])]),
      node("pageLink", [], {
        [LinkPath]: "https://www.youtube.com/watch?v=rW5oVuxEwdMsdf",
      }),
      node("bookmark", [], {
        [BookmarkPath]: "https://blog.medium.com/bnp-editors-9c0a6f5a133a",
      }),
      node("bookmark", [], {
        [BookmarkPath]:
          "https://www.w3schools.com/cssref/css3_pr_text-overflow.php",
      }),
      node("bookmark", [], {
        [BookmarkPath]: "https://www.npmjs.com/package/image-thumbnail",
      }),
      node("bookmark", [], {
        [BookmarkPath]: "https://www.youtube.com/watch?v=rW5oVuxEwdM",
      }),
    ],
    {
      [ModePath]: "edit",
      // [ImagePath]:
      //   "https://momentum.photos/img/605ec0cd-c21b-420d-9ec7-f1a63d69cafd.jpg?momo_cache_bg_uuid=a63a8845-920b-4562-ba44-d3d5228261c9",
    },
    {
      [PropLink]: node(
        "attributes",
        [
          attribute({
            [AttrNamePath]: "Email",
            [AttrTypePath]: "email",
            [AttrEmailPath]: "subhasis@mail.com",
          }),
          attribute({
            [AttrNamePath]: "Created At",
            [AttrTypePath]: "created-at",
            [AttrCreatedAtPath]: new Date().toISOString(),
          }),
          attribute({
            [AttrNamePath]: "Multi Select",
            [AttrTypePath]: "multi-select",
            [AttrMultiSelectedPath]: ["option 1", "option 2"],
            [AttrSelectOptionsPath]: ["option 1", "option 2", "option 3"],
          }),
          attribute({
            [AttrNamePath]: "Status",
            [AttrTypePath]: "status",
            [AttrStatusPath]: "done",
            [AttrStatusOptionsPath]: ["todo", "done", "in progress", "triage"],
          }),
          attribute({
            [AttrNamePath]: "Select",
            [AttrTypePath]: "select",
            [AttrSelectedPath]: "option 1",
            [AttrSelectOptionsPath]: ["option 1", "option 2", "option 3"],
          }),
          attribute({
            [AttrNamePath]: "Text",
            [AttrTypePath]: "text",
            [AttrTextPath]: "text value",
          }),
          attribute({
            [AttrNamePath]: "Number",
            [AttrTypePath]: "number",
            [AttrTextPath]: 123,
          }),
        ],
        {},
      ),
    },
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

const extensions1: Extension = {
  renderers: [ReactRenderer.create("image", ImageComp)],
};

const plugins = [
  ...corePresetPlugins,
  ...blockPresetPlugins,
  // carbonUtilPlugins,
  commentEditorPlugin,
  // flashPlugin,
  ...codeExtension.plugins!,
  // cellPlugin,
  // ...questionExtension.plugins!,
  new ClipboardPlugin(),
  // {
  //   plugins: [
  //     new BlockTree(),
  //   ]
  // }
  // extensions1,
];

const renderers = [
  ...blockPresetRenderers,
  commentEditorComp,
  // flashComp,
  ...codeExtension.renderers!,
  ...attrRenderers,
  // ...cellRenderer,
  // ...questionExtension.renderers!,
];

const renderManager = RenderManager.from(renderers);

// console.log = noop;
// console.info = noop;
// console.debug = noop;
// console.warn = noop;
// console.error = noop;
// console.group = noop;
// console.groupCollapsed = noop;
// console.groupEnd = noop;
console.time = noop;

// localStorage.setItem('carbon:content', JSON.stringify(data));

export default function Dev() {
  const app = useCreateCarbon("dev", data, flattenDeep(plugins));

  // @ts-ignore
  window.app = app;

  useEffect(() => {
    const onChange = (state: State) => {
      // console.debug(
      //   "changes",
      //   state.changes.patch,
      //   Array.from(state.changes.dataMap.values()),
      // );
      console.debug(
        "actions",
        state.actions.actions.map((a) => a.toJSON()),
      );
      // printNode(state.content);
      state.content.all((node) => {
        // console.log(node.id.toString(), node.name, node.properties.toKV());
      });
    };

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    };
  }, [app]);

  // useEffect(() => {
  //   debugger;
  //   const pin = Pin.toEndOf(app.state.content)!;
  //   // const after = PinnedSelection.fromPin(pin)!;
  // }, [app]);

  // return (
  //   <></>
  // )

  return (
    <div className={"carbon-app-container"}>
      <CarbonApp app={app} renderManager={renderManager}>
        <SelectionTracker />
        <PathTracker />
      </CarbonApp>
    </div>
  );
}
