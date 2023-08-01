import React from "react";

import { Fastype } from "@emrgen/fastype-core";
import { extensionPresets, useCreateCarbon } from "@emrgen/carbon-core";
import { blockPresets } from "@emrgen/carbon-blocks";
import { carbonUtilPlugins } from "@emrgen/carbon-utils";
import { fastypeBlocks } from "@emrgen/fastype-blocks";


const extensions = [
  extensionPresets,
  blockPresets,
  carbonUtilPlugins,
  fastypeBlocks,
];

const data = {
  name: "carbon",
  content: [
    {
      name: "document",
      content: [
        {
          name: "title",
          content: [
            {
              name: "text",
              text: "Carbon ",
            },
            {
              name: "text",
              text: "document",
            },
          ],
        },
        {
          name: "divider",
        },
      ],
    },
  ],
};

export function FastEditor() {
  const app = useCreateCarbon(data, extensions);
  return <Fastype app={app}/>;
}
