import { attrRenderers } from "@emrgen/carbon-attributes";
import { blockPresetPlugins, node, text, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { codemirrorExtension } from "@emrgen/carbon-codemirror";
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
import { RenderManager, useCreateCarbon } from "@emrgen/carbon-react";
import { CarbonApp } from "@emrgen/carbon-utils";
import { flattenDeep, noop } from "lodash";
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

const data = node("carbon", [
  node("page", [title([text("Text")])], {
    [ModePath]: "edit",
  }),
]);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
data.id = NodeId.ROOT.toString();

const plugins = [
  ...corePresetPlugins,
  ...blockPresetPlugins,
  ...codemirrorExtension.plugins!,
  ...databasePlugins,
  commentEditorPlugin,
  new ClipboardPlugin(),
];

const renderers = [
  ...blockPresetRenderers,
  ...codemirrorExtension.renderers!,
  ...attrRenderers,
  ...databaseRenderers,
  commentEditorComp,
];

const renderManager = RenderManager.from(renderers);

export function PlainText() {
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

  return <CarbonApp app={app} renderManager={renderManager}></CarbonApp>;
}
