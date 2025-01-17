import { Box } from "@chakra-ui/react";

import {
  blockPresetPlugins,
  node,
  paragraph,
  text,
  title,
} from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";
import {
  EmojiPickerInlineMenu,
  FloatingStyleMenu,
  InsertBlockMenu,
} from "@emrgen/carbon-chakra-ui";
import { ClipboardPlugin } from "@emrgen/carbon-clipboard";
import { corePresetPlugins, ModePath, NodeId } from "@emrgen/carbon-core";
import { mediaPlugins } from "@emrgen/carbon-media";
import {
  RendererProps,
  RenderManager,
  useCreateCarbon,
} from "@emrgen/carbon-react";
import { CarbonApp } from "@emrgen/carbon-utils";
import { flattenDeep } from "lodash";
import { useState } from "react";
import { PathTracker } from "../../PathTracker";
import "./test.styl";

const data = node("carbon", [
  node(
    "page",
    [
      title([text("Elixir")]),

      // paragraph([title(text("question title"))]),

      node("code", [title([text("function name(){1}\n")])], {}),

      paragraph([title(text("question title"))]),

      // paragraph([
      //   title(text("question title")),
      //   paragraph([title(text("question 1"))]),
      //   paragraph([title(text("question 2"))]),
      // ]),
    ],
    {
      [ModePath]: "edit",
    },
  ),
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

const plugins = [
  mediaPlugins,
  ...corePresetPlugins,
  ...blockPresetPlugins,
  new ClipboardPlugin(),
];

const renderers = [...blockPresetRenderers];

const renderManager = RenderManager.from(flattenDeep(renderers));

// console.log = noop;
// console.info = noop;
// console.debug = noop;
// console.warn = noop;
// console.error = noop;
// console.group = noop;
// console.groupCollapsed = noop;
// console.groupEnd = noop;
// console.time = noop;

// localStorage.setItem('carbon:content', JSON.stringify(data));

export function Code() {
  const [content] = useState(() => {
    return data;
  });
  const app = useCreateCarbon("dev", content, flattenDeep(plugins));
  // @ts-ignore
  window.app = app;

  return (
    <Box className={"carbon-app-container"} pos={"relative"}>
      <CarbonApp app={app} renderManager={renderManager}>
        <Box pos={"absolute"} right={8} top={6}>
          {/*<DocumentSaveStatus />*/}
          {/* eslint-disable-next-line react/jsx-no-undef */}
          {/*{<ToggleViewMode />}*/}
        </Box>
        <FloatingStyleMenu />
        <PathTracker />
        <InsertBlockMenu />
        {/*<BlockContextMenu />*/}
        <EmojiPickerInlineMenu />
      </CarbonApp>
    </Box>
  );
}
