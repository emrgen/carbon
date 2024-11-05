import { blockPresets, node, text, title } from "@emrgen/carbon-blocks";

import {
  CarbonChangeContext,
  CarbonContent,
  CarbonContext,
  useCreateCarbon,
} from "@emrgen/carbon-core";

const data = node("doc", [
  title([text("section 1")]),
  paragraph([
    title([text("section 1")]),
    paragraph([title([text("section 2")])]),
    paragraph([title([text("section 3")])]),
  ]),
  paragraph([title([text("section 3")])]),
]);

export default function Test() {
  const app = useCreateCarbon("test", data, [blockPresets]);

  // console.log(react.content)

  return (
    <CarbonContext app={app}>
      <CarbonChangeContext>
        <CarbonContent />
      </CarbonChangeContext>
    </CarbonContext>
  );
}
