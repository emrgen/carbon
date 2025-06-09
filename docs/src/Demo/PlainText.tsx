import { attrRenderers } from "@emrgen/carbon-attributes";
import { blockPresetPlugins, node, paragraph, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { codemirrorExtension } from "@emrgen/carbon-codemirror";
import { commentEditorComp, commentEditorPlugin } from "@emrgen/carbon-comment-editor";
import { corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import { databasePlugins } from "@emrgen/carbon-database";
import { databaseRenderers } from "@emrgen/carbon-database-react";
import { RenderManager } from "@emrgen/carbon-react";
import { CarbonApp } from "@emrgen/carbon-utils";
import { noop } from "lodash";
import { useCreate } from "../create";

// console.log = noop;
// console.info = noop;
console.debug = noop;
console.warn = noop;
console.error = noop;
console.group = noop;
console.groupCollapsed = noop;
console.groupEnd = noop;
console.time = noop;

const data = node("carbon", [
  node(
    "page",
    [
      title("Plain Text editor"),
      node("h4", [title("Web WYSIWYG Editor Demo")]),
      paragraph(
        "This demo showcases a lightweight, in-browser WYSIWYG (What You See Is What You Get) editor that lets users create and format rich text content visually—without needing to write HTML. Features include bold/italic text, headings, lists, links, and more, all editable in real time. It's built using standard web technologies and is perfect for embedding into content management systems or blog platforms.",
      ),
    ],
    {
      [ModePath]: "edit",
    },
  ),
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
  const app = useCreate(data, plugins);

  return <CarbonApp app={app} renderManager={renderManager}></CarbonApp>;
}
