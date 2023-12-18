import { useEffect, useState } from "react";

import { RecoilRoot } from "recoil";

import {
  BlockEvent,
  blockPresets,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";

import {
  CarbonChangeContext,
  CarbonContent,
  CarbonContext,
  CarbonEvents,
  CarbonModal,
  CarbonState,
  Extension,
  Renderer,
  RendererProps,
  createCarbon,
  extensionPresets,
  useCreateCachedCarbon,
  useCreateCarbon, NodeMap, NodeId, CollapsedPath
} from "@emrgen/carbon-core";
import {
  BlockMenu,
  CarbonApp,
  carbonUtilPlugins,
} from "@emrgen/carbon-utils";
import {BlockTree} from "@emrgen/carbon-blocktree";
import SelectionTracker from "../../SelectionTracker";

const data = node("carbon", [
  node("document", [
    title([text("I am a frame title")]),
    // node("blockContent"),

    // node("tab", [
    //   node("tabTitles", [
    //     node("tabTitle", [title([text("tab 1")])], {node: {link: "tab1"}}),
    //     node("tabTitle", [title([text("tab 2")])]),
    //     node("tabTitle", [title([text("tab 3")])]),
    //   ]),
    //   node("tabContent", [
    //     section([title([text("tab 1 content")])]),
    //   ], {node: {link: "tab1"}}),
    // ]),

    node("pageTree", [
      title([text("Favorites")]),
      node(
        "pageTreeItem",
        [
          title([text("Computer Science")]),
          node("pageTreeItem", [title([text("Algorithms")])]),
          node("pageTreeItem", [title([text("Data Structures")])]),
          node("pageTreeItem", [title([text("Operating Systems")])]),
        ],
        { [CollapsedPath]: true }
      ),
      node("pageTreeItem",
        [
          title([text("Electrical Engineering")]),
          node("pageTreeItem", [title([text("Circuits")])]),
          node("pageTreeItem", [title([text("Digital Logic")])]),
          node("pageTreeItem", [title([text("Microprocessors")])]),
        ]),
    ]),
    //
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
  {plugins: [
    new BlockTree(),
    ]}
  // extensions1,
];

export default function Dev() {
  const app = useCreateCarbon('dev', data, extensions);

  useEffect(() => {
    const onChange = (state: CarbonState) => {
      state.content.forAll((node) => {
        console.log(node.id.toString(), node.name, node.properties.toKV());
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
        <SelectionTracker />
      </CarbonApp>
    </div>
  );
}


