import { blockPresets, node, text, title } from "@emrgen/carbon-blocks";

import { extensionPresets, useCreateCarbon } from "@emrgen/carbon-core";
import { questionExtension } from "@emrgen/carbon-question";
import { CarbonApp, carbonUtilPlugins } from "@emrgen/carbon-utils";

const data = node("carbon", [
  node(
    "document",
    [
      title([text("Carbon "), text("document")]),
      node("divider"),
      node("section", [title([text("section 1.2")])]),
    ],
    {
      node: {
        // props: [
        //   {
        //     name: "tags",
        //     value: ["question", "answer", "note"],
        //   },
        // ],
      },
    }
  ),
]);

const extensions = [
  extensionPresets,
  blockPresets,
  carbonUtilPlugins,
  questionExtension,
];

export function Question() {
  const app = useCreateCarbon(data, extensions);

  return <CarbonApp app={app} />;
}
