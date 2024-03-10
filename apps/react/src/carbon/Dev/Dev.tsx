import {useEffect} from "react";

import {blockPresetPlugins, node, text, title, section, block} from "@emrgen/carbon-blocks";
import {ReactRenderer, RendererProps, RenderManager, useCreateCarbon, ImmutableNodeFactory} from "@emrgen/carbon-react";
import {blockPresetRenderers} from "@emrgen/carbon-react-blocks";
import {commentEditorPlugin, commentEditorComp} from "@emrgen/carbon-comment-editor";
import {
  ActivatedPath,
  CollapsedPath,
  corePresetPlugins,
  Extension, Mark,
  Node,
  NodeId,
  PluginManager,
  Schema,
  State,
  TagPath, TitlePath,
} from "@emrgen/carbon-core";
import {CarbonApp} from "@emrgen/carbon-utils";
import {noop, range} from "lodash";
import SelectionTracker from "../../SelectionTracker";
import {PathTracker} from "../../PathTracker";

const data = node("carbon", [
  node("document", [
    title([text("I am a frame title")]),

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

    // node("commentEditor", [
    //   section([title([text('add a comment')])])
    // ]),

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
    //
    // node("code", [
    //   node("codeLine",[ title([text("function foo() {")])]),
    //   node("codeLine", [title([text("  console.log('hello world')")])]),
    //   node("codeLine",[ title([text("}")])])
    // ]),
    //
    // section([title([text("section 1")])]),
    //
    // node("code", [
    //   node("codeLine",[ title([text("function foo() {")])]),
    //   node("codeLine", [title([text("  console.log('hello world')")])]),
    //   node("codeLine",[ title([text("}")])])
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
    //     {[CollapsedPath]: true}
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
    //
    node("section", [title([text("12345678")])]),
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

  ]),
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
  // codeExtension,
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
];

const renderManager = RenderManager.from(
  renderers,
)

// console.log = noop;
// console.info = noop;
// console.debug = noop;
// console.warn = noop;
// console.error = noop;
// console.group = noop;
// console.groupCollapsed = noop;
// console.groupEnd = noop;
console.time = noop;


export default function Dev() {
  const app = useCreateCarbon('dev', data, plugins);

  // @ts-ignore
  window.app = app;

  useEffect(() => {
    const onChange = (state: State) => {
      console.debug('changes', state.changes.patch, Array.from(state.changes.dataMap.values()))
      console.debug('actions', state.actions.actions)//.map(a => a.toJSON()));
      state.content.all((node) => {
        // console.log(node.id.toString(), node.name, node.properties.toKV());
      });
    }

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    }
  }, [app]);

  // return (
  //   <></>
  // )

  return (
    <div className={'carbon-app-container'}>
      <CarbonApp app={app} renderManager={renderManager}>
        <SelectionTracker/>
        <PathTracker/>
      </CarbonApp>
    </div>
  );
}

