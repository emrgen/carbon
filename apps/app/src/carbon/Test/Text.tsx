import { useEffect, useState } from "react";

import { RecoilRoot } from "recoil";

import {
  BlockEvent,
  blockPresets,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";

import {
  extensionPresets,
  useCreateCarbon, NodeMap, NodeId
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

const extensions = [
  extensionPresets,
  blockPresets,
  carbonUtilPlugins,
];

export default function TestText() {
  const app = useCreateCarbon('test/text', data, extensions);

  return (
    <div className={'carbon-app-container'}>
      <CarbonApp app={app}>
      </CarbonApp>
    </div>
  );
}
