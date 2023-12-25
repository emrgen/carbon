import { useEffect, useState } from "react";

import { RecoilRoot } from "recoil";

import {
  BlockEvent, blockPresetPlugins,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";
import {RenderManager, useCreateCarbon} from "@emrgen/carbon-react";
import {blockPresetRenderers} from "@emrgen/carbon-react-blocks";

import {
  CarbonPlugin, corePresetPlugins

} from "@emrgen/carbon-core";
import {
  BlockMenu,
  CarbonApp,
  carbonUtilPlugins,
} from "@emrgen/carbon-utils";
import SelectionTracker from "../../SelectionTracker";


const data = node("carbon", [
  node("document", [
    title(),
  ]),
]);

const extensions: CarbonPlugin[] = [
  ...corePresetPlugins,
  ...blockPresetPlugins,
  // ...carbonUtilPlugins,
];

const renderManager = RenderManager.from([
  ...blockPresetRenderers,
])

export default function TestText() {
  const app = useCreateCarbon('test/text', data, extensions);

  return (
    <div className={'carbon-app-container'}>
      <CarbonApp app={app} renderManager={renderManager}>
      </CarbonApp>
    </div>
  );
}
