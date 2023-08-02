import React from "react";

import { Fastype } from "@emrgen/fastype-core";
import { extensionPresets, useCreateCarbon } from "@emrgen/carbon-core";
import { blockPresets, node } from "@emrgen/carbon-blocks";
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
        node("image", [], {
          node: {
            src: "https://learning.oreilly.com/api/v2/epubs/urn:orm:book:9780123820365/files/images/F000124f12-68-9780123820365.jpg",
          },
          html: {
            // style: { justifyContent: "center" },
          },
        }),
        node("video", [], {
          node: {
            url: "https://www.youtube.com/watch?v=yFswDJPvtPY&rel=0",
            provider: 'youtube',
          },
        }),
        // node("separator"),
      ],
    },
  ],
};

export function FastEditor() {
  const app = useCreateCarbon(data, extensions);
  return <Fastype app={app}/>;
}
