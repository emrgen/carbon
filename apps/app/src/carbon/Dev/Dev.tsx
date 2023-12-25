import {useEffect, useState} from "react";

import {RecoilRoot} from "recoil";

import {
  blockPresets,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";

import {codeExtension} from "@emrgen/carbon-code";
import {
  commentEditorExtension,
} from "@emrgen/carbon-comment-editor";

import {
  State,
  Extension,
  Renderer,
  RendererProps,
  extensionPresets,
  useCreateCarbon, NodeId, ActivatedPath, TitlePath, CarbonModal
} from "@emrgen/carbon-core";
import {
  BlockMenu,
  CarbonApp,
  carbonUtilPlugins,
} from "@emrgen/carbon-utils";
import {BlockTree} from "@emrgen/carbon-blocktree";
import SelectionTracker from "../../SelectionTracker";
import {noop} from "lodash";

const data = node("carbon", [
  node("document", [
    title([text("I am a frame title")]),
    //
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
    //
    // node("commentEditor", [
    //   section([title([text('add a comment')])])
    // ]),
    //
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
    node("section", [title([text("Phycology")])]),

    node(
      "section",
      [
        title([text("section 1")]),
        node(
          "todo",
          [title([text("section 1")]), section([title([text("section")])])],
          {}
        ),
      ],
      {}
    ),


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
  renderers: [Renderer.create("image", ImageComp)],
};

const extensions = [
  extensionPresets,
  blockPresets,
  carbonUtilPlugins,
  commentEditorExtension,
  codeExtension,
  {
    plugins: [
      new BlockTree(),
    ]
  }
  // extensions1,
];

console.log = noop;
console.info = noop;
console.debug = noop;
console.warn = noop;
console.error = noop;
console.group = noop;
console.groupCollapsed = noop;
console.groupEnd = noop;
console.time = noop;

export default function Dev() {
  const app = useCreateCarbon('dev', data, extensions);

  useEffect(() => {
    const onChange = (state: State) => {
      state.content.forAll((node) => {
        // console.log(node.id.toString(), node.name, node.properties.toKV());
      });
    }

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    }
  }, [app]);

  return (
    <div className={'carbon-app-container'}>
      <CarbonApp app={app}>
        <SelectionTracker/>
      </CarbonApp>
    </div>
  );
}


