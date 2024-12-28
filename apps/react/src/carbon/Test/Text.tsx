import { blockPresetPlugins, node, title } from "@emrgen/carbon-blocks";
import { blockPresetRenderers } from "@emrgen/carbon-blocks-react";

import {
  CarbonPlugin,
  corePresetPlugins,
  ModePath,
  NodeId,
} from "@emrgen/carbon-core";
import { RenderManager, useCreateCarbon } from "@emrgen/carbon-react";
import { CarbonApp } from "@emrgen/carbon-utils";
import { flattenDeep } from "lodash";

const data = node("carbon", [
  node("page", [title()], {
    [ModePath]: "edit",
  }),
]);

// @ts-ignore
data.id = NodeId.ROOT.toString();

const extensions: CarbonPlugin[] = [
  ...corePresetPlugins,
  ...blockPresetPlugins,
  // ...carbonUtilPlugins,
];

const renderManager = RenderManager.from([...blockPresetRenderers]);

export default function TestText() {
  const app = useCreateCarbon("test/text", data, flattenDeep(extensions));

  return (
    <div className={"carbon-app-container"}>
      <CarbonApp app={app} renderManager={renderManager}></CarbonApp>
    </div>
  );
}
