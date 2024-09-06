import { createContext, useContext } from "react";
import "./test.styl";
import { CarbonApp } from "@emrgen/carbon-utils";
import SelectionTracker from "../../SelectionTracker";
import { PathTracker } from "../../PathTracker";
import { RenderManager, useCreateCarbon } from "@emrgen/carbon-react";
import { flattenDeep } from "lodash";
import { blockPresetPlugins, node, text, title } from "@emrgen/carbon-blocks";
import { corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import {
  commentEditorComp,
  commentEditorPlugin,
} from "@emrgen/carbon-comment-editor";
import { codeExtension } from "@emrgen/carbon-code";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { databasePlugins } from "@emrgen/carbon-database";
import { blockPresetRenderers } from "@emrgen/carbon-react-blocks";
import { attrRenderers } from "@emrgen/carbon-attributes";
import { databaseRenderers } from "@emrgen/carbon-database-react";

const Person = ({ name }) => {
  const context = useContext(TestContext);

  console.log(context);
  return <div>{name}</div>;
};

const TestContext = createContext<any>(null);

export const data = node("carbon", [
  node(
    "document",
    [
      title([text("I am a frame title")]),
      node("section", [title([text("I am a section title")])]),
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

export default function Text() {
  const app = useCreateCarbon("dev", data, flattenDeep(plugins));

  return (
    <div className={"carbon-app-container"}>
      <CarbonApp app={app} renderManager={renderManager}>
        <SelectionTracker />
        <PathTracker />
      </CarbonApp>
    </div>
  );
}
