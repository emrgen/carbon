import { attrRenderers } from "@emrgen/carbon-attributes";
import { blockPresetPlugins, node, text, title } from "@emrgen/carbon-blocks";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { codeExtension } from "@emrgen/carbon-codemirror";
import {
  commentEditorComp,
  commentEditorPlugin,
} from "@emrgen/carbon-comment-editor";
import {
  corePresetPlugins,
  ModePath,
  NodeId,
  State,
} from "@emrgen/carbon-core";
import { databasePlugins } from "@emrgen/carbon-database";
import { databaseRenderers } from "@emrgen/carbon-database-react";
import "./App.css";
import { RenderManager, useCreateCarbon } from "@emrgen/carbon-react";
import { blockPresetRenderers } from "@emrgen/carbon-react-blocks";
import { CarbonApp } from "@emrgen/carbon-utils";
import { flattenDeep, noop, range } from "lodash";
import { useEffect } from "react";

console.log = noop;
// console.info = noop;
console.debug = noop;
console.warn = noop;
console.error = noop;
console.group = noop;
console.groupCollapsed = noop;
console.groupEnd = noop;
console.time = noop;

export const data = node("carbon", [
  node(
    "document",
    [
      title([text("I am a frame title")]),
      ...range(800).map((a) =>
        node("section", [title([text("I am a section title")])]),
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
  ...corePresetPlugins,
  ...blockPresetPlugins,
  ...codeExtension.plugins!,
  ...databasePlugins,
  commentEditorPlugin,
  new ClipboardPlugin(),
];

const renderers = [
  ...blockPresetRenderers,
  ...codeExtension.renderers!,
  ...attrRenderers,
  ...databaseRenderers,
  commentEditorComp,
];

const renderManager = RenderManager.from(renderers);

export default function App() {
  console.info("xxxxxxxxxxxxx");
  const app = useCreateCarbon("dev", data, flattenDeep(plugins));

  useEffect(() => {
    const onUpdate = (state: State) => {
      console.info(state.content.child(0)?.size);
    };

    app.on("changed", onUpdate);
    return () => {
      app.off("changed", onUpdate);
    };
  }, [app]);

  return (
    <div className={"carbon-app-container"}>
      <CarbonApp app={app} renderManager={renderManager}></CarbonApp>
    </div>
  );
}
