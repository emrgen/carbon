import { blockPresets, node, text, title } from "@emrgen/carbon-blocks";

import { extensionPresets, useCreateCarbon } from "@emrgen/carbon-core";
import { questionExtension } from "@emrgen/carbon-question";
import { CarbonAppDocument, carbonUtilPlugins } from "@emrgen/carbon-utils";

const data = node("carbon", [
  node(
    "document",
    [
      title([text("Carbon "), text("document")]),
      node("divider"),
      node("section", [title([text("section 1.2")])]),
      // node("questionAnswer", [title([text("Question")])]),
    ],
    {},
    {
      node: {
        attrs: [
          {
            name: "tags",
            value: ["question", "answer", "note"],
          },
        ],
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

  return <CarbonAppDocument app={app} />;
}
