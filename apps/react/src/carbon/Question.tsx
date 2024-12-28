// import { blockPresets, node, text, title } from "@emrgen/carbon-blocks";
//
// import { questionExtension } from "@emrgen/carbon-question";
// import { CarbonApp, carbonUtilPlugins } from "@emrgen/carbon-utils";
//
// const data = node("carbon", [
//   node(
//     "page",
//     [
//       title([text("Carbon "), text("page")]),
//       node("divider"),
//       node("paragraph", [title([text("paragraph 1.2")])]),
//     ],
//     {
//       node: {
//         // props: [
//         //   {
//         //     name: "tags",
//         //     value: ["question", "answer", "note"],
//         //   },
//         // ],
//       },
//     }
//   ),
// ]);
//
// const extensions = [
//   extensionPresets,
//   blockPresets,
//   carbonUtilPlugins,
//   questionExtension,
// ];
//
// export function Question() {
//   const react = useCreateCarbon('q',data, extensions);
//
//   return <CarbonApp react={react} />;
// }

export const Question = () => {
  return (
    <div>
      <div>Question</div>
    </div>
  );
}
