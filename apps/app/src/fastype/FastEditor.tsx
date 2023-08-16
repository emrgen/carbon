import React from "react";

import { Fastype } from "@emrgen/fastype-core";
import { extensionPresets, useCreateCachedCarbon, useCreateCarbon } from "@emrgen/carbon-core";
import { blockPresets, node, text, title } from "@emrgen/carbon-blocks";
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
        node("equation", [
          title([
            // text("\\begin{matrix}\n1 & 2 & 3\\\\\na & b & c\n\\end{matrix}"),
            text(String.raw`\ce{CO2 + C -> 2 CO}`),
          ]),
        ]),
        node("code", [
          title([
            text(String.raw`function name() {
  console.log("hello world");
}`),
          ]),
        ]),

        // {
        //   name: "content",
        // },
        // node("image", [], {
        //   node: {
        //     src: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
        //   },
        // }),
        // node("video", [], {
        //   node: {
        //     url: "https://www.youtube.com/watch?v=yFswDJPvtPY&rel=0",
        //     provider: 'youtube',
        //   },
        // }),
      ],
      attrs: {
        node: {
          picture: {
            src: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
          },
        },
      },
    },
  ],
};

export function FastEditor() {
  const app = useCreateCarbon(data, extensions);
  return <Fastype app={app} />;
}
