import {attrRenderers} from "@emrgen/carbon-attributes";
import {blockPresetPlugins, node, text, title} from "@emrgen/carbon-blocks";
import {blockPresetRenderers} from "@emrgen/carbon-blocks-react";
import {carbonChakraRenderers, FloatingStyleMenu,} from "@emrgen/carbon-chakra-ui";
import {ClipboardPlugin} from "@emrgen/carbon-clipboard";
import {codemirrorExtension} from "@emrgen/carbon-codemirror";
import {commentEditorComp, commentEditorPlugin,} from "@emrgen/carbon-comment-editor";
import {corePresetPlugins, ModePath, NodeId} from "@emrgen/carbon-core";
import {databasePlugins} from "@emrgen/carbon-database";
import {databaseRenderers} from "@emrgen/carbon-database-react";
import {mediaPlugins} from "@emrgen/carbon-media";
import {RenderManager, useCreateCarbon} from "@emrgen/carbon-react";
import {Carbon} from "@emrgen/carbon-utils";
import {flattenDeep} from "lodash";
import {createContext, useContext} from "react";
import "./test.styl";
import {PathTracker} from "../../PathTracker";

const Person = ({ name }) => {
  const context = useContext(TestContext);

  console.log(context);
  return <div>{name}</div>;
};

const TestContext = createContext<any>(null);

export const data = node("carbon", [
  node(
    "page",
    [
      title([text("I am a frame title")]),
      node("paragraph", [title([text("I am a paragraph title")])]),
      node("paragraph", [title([text("another paragraph title")])]),
      // node("image"),
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
  ...codemirrorExtension.plugins!,
  ...databasePlugins,
  commentEditorPlugin,
  mediaPlugins,
  new ClipboardPlugin(),
];

const renderers = [
  ...blockPresetRenderers,
  ...codemirrorExtension.renderers!,
  ...attrRenderers,
  ...databaseRenderers,
  commentEditorComp,
  carbonChakraRenderers,
];

const renderManager = RenderManager.from(flattenDeep(renderers));

export default function Text() {
  const app = useCreateCarbon("dev", data, flattenDeep(plugins));

  return (
    <div className={"carbon-app-container"}>
      <Carbon app={app} renderManager={renderManager}>
        <FloatingStyleMenu />
        <PathTracker />
      </Carbon>
    </div>
  );
}
