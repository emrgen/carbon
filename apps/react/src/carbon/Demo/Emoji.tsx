import { blockPresetPlugins, node, text, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import { FloatingStyleMenu } from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import { emojiPlugins } from "@emrgen/carbon-emoji";
import { RenderManager, useCreateCarbon } from "@emrgen/carbon-react";
import { CarbonApp } from "@emrgen/carbon-utils";
import { flattenDeep } from "lodash";
import { createContext, useContext } from "react";
import { PathTracker } from "../../PathTracker";
import "../Dev/test.styl";

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
      title([text("Emoji")]),
      node("paragraph", [title([text("type :smile: to see 😊")])]),
      node("paragraph", [title([text("type :heart: to see ❤️")])]),
      node("paragraph", [title([text("type :rocket: to see 🚀")])]),
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
  ...emojiPlugins,
  new ClipboardPlugin(),
];

const renderers = [...blockPresetRenderers];

const renderManager = RenderManager.from(flattenDeep(renderers));

export function EmojiDemo() {
  const app = useCreateCarbon("dev", data, flattenDeep(plugins));

  return (
    <div className={"carbon-app-container"}>
      <CarbonApp app={app} renderManager={renderManager}>
        {/*<EmojiPickerInlineMenu />*/}
        <FloatingStyleMenu />
        <PathTracker />
      </CarbonApp>
    </div>
  );
}
