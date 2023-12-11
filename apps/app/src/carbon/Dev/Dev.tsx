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
  useCreateCarbon,
} from "@emrgen/carbon-core";
import { DndContext, RectSelectContext } from "@emrgen/carbon-dragon";
import {
  BlockMenu,
  CarbonApp,
  carbonUtilPlugins,
} from "@emrgen/carbon-utils";
import { Stack } from "@chakra-ui/react";

const data = node("carbon", [
  // node("fileTree", [
  //   node(
  //     "fileTreeItem",
  //     [
  //       title([text("Sunt amet mollit cupidatat non elit labore dolore qui.")]),
  //       node("fileTreeItem", [title([text("section 1")])]),
  //       node("fileTreeItem", [title([text("section 1")])]),
  //     ],
  //     {}
  //     // { node: { collapsed: false }, state: { selected: true } }
  //   ),
  //   node("fileTreeItem", [title([text("section 1")])]),
  //   node("fileTreeItem", [title([text("section 1")])]),
  //   node("fileTreeItem", [title([text("section 1")])]),
  // ]),
  node("document", [
    title([text("I am a frame title")]),
    // node("divider"),

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

    node("section", [title([text("section 1")])]),
    // node("hstack", [
    //   node("stack", [section([title([text("section 1")])])]),
    //   node("stack", [section([title([text("section 2")])])]),
    // ]),
    // // node("code", [
    // //   title([text(`function print() { console.log("hello world") }`)]),
    // // ]),
    // node("callout", [title([text("I am a callout!")])]),
    // node("table", [
    //   node("row", [
    //     node("column", [title([text("column 1.1")])]),
    //     node("column", [title([text("column 1.2")])]),
    //   ]),
    //   node("row", [
    //     node("column", [title([text("column 2.1")])]),
    //     node("column", [title([text("column 2.2")])]),
    //   ]),
    // ]),
    // node("quote", [title([text("I am a quote!")])]),
    // node(
    //   "collapsible",
    //   [
    //     title([text("collapsible 0")]),
    //     node("section", [title([text("section 0.1")])]),
    //   ],
    //   {},
    //   { node: { collapsed: true } }
    // ),
    // // node("docLink", [title([text("Link to doc")])]),
    node("section", [
      title([text("section 0")]),
      node("section", [
        title([text("section 0.1")]),
        node("section", [
          title([text("section 0.1.1")]),
          node("section", [title([text("section 0.1.1.1")])]),
        ]),
      ]),
    ]),
    // node("section", [
    //   title([text("section 1")]),
    //   node("section", [
    //     title([text("section 1.1")]),
    //     node("section", [
    //       title([text("section 1.1.1")]),
    //       node("section", [title([text("section 1.1.1.1")])]),
    //       node("section", [title([text("section 1.1.1.2")])]),
    //     ]),
    //     node("section", [title([text("section 1.1.2")])]),
    //   ]),
    //   node("section", [title([text("section 1.2")])]),
    // ]),
    // node("todo", [title([text("section 1")])], {}),
    // node(
    //   "section",
    //   [
    //     title([text("section 1")]),
    //     node(
    //       "todo",
    //       [title([text("section 1")]), section([title([text("section")])])],
    //       {}
    //     ),
    //   ],
    //   {}
    // ),

    // node("section", [title([text("section 1.2")])]),
    // node("image", [], {
    //   node: {
    //     src: "https://learning.oreilly.com/api/v2/epubs/urn:orm:book:9780123820365/files/images/F000124f12-68-9780123820365.jpg",
    //     align: "center",
    //   },
    //   html: {
    //     style: { justifyContent: "center" },
    //   },
    // }),
    // node("image", [], {
    //   node: {
    //     src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb",
    //     align: "center",
    //   },
    //   html: {
    //     style: { justifyContent: "end" },
    //   },
    // }),
    // node("hstack", [
    //   node("stack", [section([title([text("section 1")])])]),
    //   node("stack", [section([title([text("section 2")])])]),
    //   node("stack", [section([title([text("section 3")])])]),
    // ]),

    // node("hstack", [
    //   node("stack", [section([title([text("section 1")])])]),
    //   node("stack", [section([title([text("section 2")])])]),
    // ]),
    // section([
    //   title([
    //     text("sect"),
    //     text("ABC", { node: { link: "http://localhost:5173/" } }),
    //     text("ion 1"),
    //   ]),
    // ]),
    // node("divider"),
    // section([title([])]),
    // section([title([])]),
    // node("collapsible", [
    //   title([text("I'm a collapsible")]),
    //   section([title([text("section 1")])]),
    // ]),
    // node("bulletedList", [title([text("section 1")])]),
    // node("equation", [title([text(`(x+1)^2 = x^2 + 2x + 1`)])]),
    // node("numberedList", [
    //   title([text("section 1")]),
    //   node("numberedList", [title([text("section 1.1")])]),
    //   node("numberedList", [
    //     title([text("section 1.2")]),
    //     section([
    //       title([text("section 1.2.1")]),
    //       section([title([text("section 1.2.1.1")])]),
    //     ]),
    //   ]),
    // ]),
    // node("divider"),
    // // node("link"),
    // section([
    //   title([text("section 2")]),
    //   section([
    //     title([text("section 2.1")]),
    //     section([title([text("section 2.1.1")])]),
    //     section([
    //       title([text("section 2.1.2")]),
    //       section([title([text("section 2.1.2.1")])]),
    //       section([title([text("section 2.1.2.2")])]),
    //     ]),
    //   ]),
    // ]),
    // section([title([text("section 3")])]),
    // node("h1", [title([text("section 3")])]),
    // node("h2", [title([text("section 3")])]),
    // node("h3", [title([text("section 3")])]),
    // node("h4", [title([text("section 3")])]),
    // section([title([text("section 3")])]),
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
  // extensions1,
];

export default function Dev() {
  const app = useCreateCarbon('dev',data, extensions);


  return <div className={'carbon-app-container'}><CarbonApp app={app} /></div>;
}
