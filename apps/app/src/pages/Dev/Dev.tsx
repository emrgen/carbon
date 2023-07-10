import {
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
  extensionPresets,
  useCreateCarbon,
} from "@emrgen/carbon-core";
import { useEffect } from "react";

const data = node("document", [
  title([text("Carbon "), text("document")]),
  node("divider"),
  node("section", [title([text("section 1")])]),
  node("hstack", [
    node("stack", [section([title([text("section 1")])])]),
    node("stack", [section([title([text("section 2")])])]),
  ]),
  // node("code", [
  //   title([text(`function print() { console.log("hello world") }`)]),
  // ]),
  node("callout", [title([text("I am a callout!")])]),
  node("table", [
    node("row", [
      node("column", [title([text("column 1.1")])]),
      node("column", [title([text("column 1.2")])]),
    ]),
    node("row", [
      node("column", [title([text("column 2.1")])]),
      node("column", [title([text("column 2.2")])]),
    ]),
  ]),
  node("quote", [title([text("I am a quote!")])]),
  node(
    "collapsible",
    [
      title([text("collapsible 0")]),
      node("section", [title([text("section 0.1")])]),
    ],
    {},
    { node: { collapsed: true } }
  ),
  // node("docLink", [title([text("Link to doc")])]),
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
  node("section", [
    title([text("section 1")]),
    node("section", [
      title([text("section 1.1")]),
      node("section", [
        title([text("section 1.1.1")]),
        node("section", [title([text("section 1.1.1.1")])]),
        node("section", [title([text("section 1.1.1.2")])]),
      ]),
      node("section", [title([text("section 1.1.2")])]),
    ]),
    node("section", [title([text("section 1.2")])]),
  ]),
  node("todo", [title([text("section 1")])], {}),
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

  node("image", [], {
    node: {
      src: "https://learning.oreilly.com/api/v2/epubs/urn:orm:book:9780123820365/files/images/F000124f12-68-9780123820365.jpg",
      align: "center",
    },
    html: {
      style: { justifyContent: "center" },
    },
  }),
  node("image", [], {
    node: {
      src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb",
      align: "center",
    },
    html: {
      style: { justifyContent: "end" },
    },
  }),
  // node("hstack", [
  //   node("stack", [section([title([text("section 1")])])]),
  //   node("stack", [section([title([text("section 2")])])]),
  //   node("stack", [section([title([text("section 3")])])]),
  // ]),

  // node("hstack", [
  //   node("stack", [section([title([text("section 1")])])]),
  //   node("stack", [section([title([text("section 2")])])]),
  // ]),
  // section([title([])]),
  section([
    title([
      text("sect"),
      text("ABC", { node: { link: "http://localhost:5173/" } }),
      text("ion 1"),
    ]),
  ]),
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
]);

export default function Dev() {
  const app = useCreateCarbon(data, [extensionPresets, blockPresets]);
  // console.log(app.schema.nodes);

  // @ts-ignore
  window.app = app;
  // console.log(app.content)

  useEffect(() => {
    app.focus();
  }, [app]);

  return (
    <CarbonContext app={app}>
      <CarbonChangeContext>
        <div className="carbon-header">
          <div
            className="carbon-control"
            onClick={() => app.cmd.insert.node("section")?.dispatch()}
          >
            Text
          </div>
          <div
            className="carbon-control"
            onClick={() => app.cmd.insert.node("divider")?.dispatch()}
          >
            Divider
          </div>
          <div
            className="carbon-control"
            onClick={() => app.cmd.change.into("bulletedList")?.dispatch()}
          >
            Bullet
          </div>
        </div>
        <CarbonContent />
      </CarbonChangeContext>
    </CarbonContext>
  );
}
